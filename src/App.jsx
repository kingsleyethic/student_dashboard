 import { useState, useEffect } from 'react';
import './App.css';

import Registration from './components/Registration.jsx';
import Login from './components/Login.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import LecturerDashboard from './components/LecturerDashboard.jsx';

import { supabase } from './lib/supabase.js';

function App() {
  const [page, setPage] = useState('login');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session) {
        setProfile(null);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        console.error('Profile error:', error?.message);
        await supabase.auth.signOut();
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, [session]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (session && profile?.role === 'student') {
    return <StudentDashboard />;
  }

  if (session && profile?.role === 'lecturer') {
    return <LecturerDashboard />;
  }

  return (
    <div className="App">
      {page === 'login' ? (
        <>
          <Login />
          <p>
            Don't have an account?
            <button onClick={() => setPage('register')}>Register</button>
          </p>
        </>
      ) : (
        <>
          <Registration />
          <p>
            Already have an account?
            <button onClick={() => setPage('login')}>Login</button>
          </p>
        </>
      )}
    </div>
  );
}

export default App;