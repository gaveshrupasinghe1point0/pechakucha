import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { STUDENT_DOMAIN } from '../lib/constants';
import AuthCard from '../components/AuthCard';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', studentId: '', password: '' });

  const isStudentEmail = form.email.toLowerCase().trim().endsWith(STUDENT_DOMAIN);

  function isAllowedEmail(email) {
    return email.toLowerCase().trim().endsWith(STUDENT_DOMAIN);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isAllowedEmail(form.email)) {
      toast.error(`Use a ${STUDENT_DOMAIN} email address.`);
      return;
    }

    if (isStudentEmail && !form.studentId.trim()) {
      toast.error('Student ID is required for student accounts.');
      return;
    }

    setLoading(true);
    try {
      const signUpPromise = supabase.auth.signUp({
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

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Signup timed out. Check Supabase SMTP settings or try again.')), 30000);
      });

      const { error } = await Promise.race([signUpPromise, timeoutPromise]);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created successfully. Confirm your email and login.');
      setForm({ fullName: '', email: '', studentId: '', password: '' });
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Students sign up with their NSBM student email to vote in the competition."
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
        Only student accounts can sign up. Admin access is assigned separately.
      </p>
    </AuthCard>
  );
}
