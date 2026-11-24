import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setAnnouncements(data || []);
    }

    setLoading(false);
  }

  return (
    <section className="announcement-feed">
      <h2>University Announcements</h2>

      {loading && <p>Loading announcements...</p>}

      {message && <p>{message}</p>}

      {!loading && announcements.length === 0 && (
        <p>No announcements available.</p>
      )}

      {announcements.map(item => (
        <article className="course-card" key={item.id}>
          <h3>{item.title}</h3>

          <p>{item.message}</p>

          <small>
            Published: {new Date(item.created_at).toLocaleString()}
          </small>
        </article>
      ))}

     <button
  className="refresh-announcements-btn"
  onClick={loadAnnouncements}
>
  ↻ Refresh Announcements
</button>
    </section>
  );
}

export default AnnouncementFeed;