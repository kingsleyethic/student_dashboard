 import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setMessage('Unable to retrieve your account profile.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Verify account type
    if (profile.role !== accountType) {
      setMessage(`This account is not registered as a ${accountType}.`);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Login successful
    setMessage('Login successful!');
    setLoading(false);
  }

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>

      <form onSubmit={handleLogin}>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="student">Login as Student</option>
          <option value="lecturer">Login as Lecturer</option>
          <option value="admin">Login as Admin</option>
        </select>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Login;