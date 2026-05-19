import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import AuthCard from '../components/AuthCard';
import { supabase } from '../lib/supabase';

export default function RoleLogin({ role, title, subtitle, placeholder }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role !== role) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error(`This account is not a ${role} account.`);
      return;
    }

    setLoading(false);
    toast.success('Welcome back');
    navigate(`/${role}`);
  }

  return (
    <AuthCard
      title={title}
      subtitle={subtitle}
      footer={
        <>
          New here? <Link className="font-bold text-brand-600" to="/signup">Create account</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="email"
          placeholder={placeholder}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in...' : title}
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-semibold text-slate-500 dark:text-slate-400" to="/login">
        Back to login choices
      </Link>
    </AuthCard>
  );
}
