import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { ROLES } from '../lib/constants';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', accessCode: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const { data: codeAccepted, error: codeError } = await supabase.rpc('verify_admin_access', {
      admin_email: form.email,
      access_code: form.accessCode.toUpperCase(),
    });

    if (profileError || codeError || profile?.role !== ROLES.ADMIN || !codeAccepted) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error('Admin email, password, or 5-character access code is invalid.');
      return;
    }

    setLoading(false);
    toast.success('Admin access granted.');
    navigate('/admin');
  }

  return (
    <AuthCard
      title="Admin login"
      subtitle="Restricted access for the competition control team only."
      footer={
        <>
          Not an admin? <Link className="font-bold text-brand-600" to="/login">Use normal login</Link>
        </>
      }
    >
      <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 shrink-0" size={18} />
          <p>
            Admin accounts must be one of the 4 approved members and must enter their
            5-character admin code. Judges and normal students are blocked.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="input-field"
          type="email"
          placeholder="admin email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Admin password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <input
          className="input-field text-center uppercase tracking-[0.5em]"
          maxLength={5}
          minLength={5}
          placeholder="CODE"
          value={form.accessCode}
          onChange={(event) =>
            setForm({ ...form, accessCode: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
          }
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Checking access...' : 'Enter admin dashboard'}
        </button>
      </form>
    </AuthCard>
  );
}
