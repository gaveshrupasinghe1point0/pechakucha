import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { STAFF_DOMAIN, STUDENT_DOMAIN } from '../lib/constants';
import AuthCard from '../components/AuthCard';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', studentId: '', password: '' });

  const isStudentEmail = form.email.toLowerCase().trim().endsWith(STUDENT_DOMAIN);

  function isAllowedEmail(email) {
    const normalized = email.toLowerCase().trim();
    return normalized.endsWith(STUDENT_DOMAIN) || normalized.endsWith(STAFF_DOMAIN);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isAllowedEmail(form.email)) {
      toast.error(`Use ${STUDENT_DOMAIN} or ${STAFF_DOMAIN}`);
      return;
    }

    if (isStudentEmail && !form.studentId.trim()) {
      toast.error('Student ID is required for student accounts.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: form.fullName,
          student_id: isStudentEmail ? form.studentId.trim().toUpperCase() : null,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Account created successfully. Confirm your email and login.');
    setForm({ fullName: '', email: '', studentId: '', password: '' });
    navigate('/login');
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Students become voters automatically. Staff accounts become judges by default."
      footer={
        <>
          Already registered? <Link className="font-bold text-brand-600" to="/login">Login</Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="input-field"
          placeholder="Full name"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          required
        />
        <input
          className="input-field"
          type="email"
          placeholder="name@students.nsbm.ac.lk"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        {isStudentEmail && (
          <input
            className="input-field"
            placeholder="Student ID"
            value={form.studentId}
            onChange={(event) => setForm({ ...form, studentId: event.target.value.toUpperCase() })}
            required
          />
        )}
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Admin and competitor roles are manually assigned in Supabase after account creation.
      </p>
    </AuthCard>
  );
}
