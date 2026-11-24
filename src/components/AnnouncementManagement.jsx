import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setAnnouncements(data || []);
  }

  async function publishAnnouncement(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setMessage('Please log in again.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('announcements')
      .insert({
        title: title.trim(),
        message: announcementMessage.trim(),
        audience,
        created_by: user.id
      });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Announcement published successfully!');
      setTitle('');
      setAnnouncementMessage('');
      setAudience('all');
      await loadAnnouncements();
    }

    setLoading(false);
  }

  return (
    <div className="announcement-management">
      <h2>Announcement Management</h2>

      {message && <p role="status">{message}</p>}

      <div className="course-card">
        <h3>Create Announcement</h3>

        <form onSubmit={publishAnnouncement}>
          <input
            type="text"
            placeholder="Announcement Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Write your announcement..."
            value={announcementMessage}
            onChange={e => setAnnouncementMessage(e.target.value)}
            required
          />

          <label>Send Announcement To</label>

          <select
            value={audience}
            onChange={e => setAudience(e.target.value)}
          >
            <option value="all">Everyone</option>
            <option value="students">Students Only</option>
            <option value="lecturers">Lecturers Only</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Announcement'}
          </button>
        </form>
      </div>

      <h3>Published Announcements</h3>

      {announcements.length === 0 && (
        <p>No announcements published yet.</p>
      )}

      {announcements.map(item => (
        <div className="course-card" key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.message}</p>
          <p>Audience: {item.audience}</p>
          <small>
            {new Date(item.created_at).toLocaleString()}
          </small>
        </div>
      ))}

      <button
  className="refresh-announcements-btn"
  onClick={loadAnnouncements}
>
  ↻ Refresh Announcements
</button>
    </div>
  );
}

export default AnnouncementManagement;