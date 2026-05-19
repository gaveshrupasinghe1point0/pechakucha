import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import AuthCard from '../components/AuthCard';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) toast.error(error.message);
    else toast.success('Password reset link sent.');
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We will send a secure reset link to your verified email."
      footer={<Link className="font-bold text-brand-600" to="/login">Back to login</Link>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="email"
          placeholder="your university email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthCard>
  );
}
