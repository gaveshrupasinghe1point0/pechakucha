import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import AuthCard from '../components/AuthCard';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password updated. Login again to continue.');
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <AuthCard title="Reset password" subtitle="Choose a new secure password for your account.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="password"
          minLength={8}
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  );
}
