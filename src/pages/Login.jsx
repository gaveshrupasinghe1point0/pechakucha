import { Link } from 'react-router-dom';
import { GraduationCap, Mic2, ShieldCheck, Vote } from 'lucide-react';
import AuthCard from '../components/AuthCard';

export default function Login() {
  return (
    <AuthCard
      title="Choose login type"
      subtitle="Select the correct portal for your role in the PechaKucha competition."
      footer={
        <>
          New here? <Link className="font-bold text-brand-600" to="/signup">Create account</Link>
        </>
      }
    >
      <div className="grid gap-3">
        <LoginChoice
          to="/admin-login"
          icon={ShieldCheck}
          title="Admin Login"
          text="Competition control panel with 5-character admin code."
        />
        <LoginChoice
          to="/judge-login"
          icon={GraduationCap}
          title="Judge Login"
          text="Lecturer scoring panel for @nsbm.ac.lk accounts."
        />
        <LoginChoice
          to="/voter-login"
          icon={Vote}
          title="Voter Login"
          text="Student voting dashboard for @students.nsbm.ac.lk accounts."
        />
        <LoginChoice
          to="/competitor-login"
          icon={Mic2}
          title="Competitor Login"
          text="Competitor profile and live result dashboard."
        />
      </div>
      <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-white/10 dark:bg-white/10">
        <p className="font-black text-slate-900 dark:text-white">Forgot password?</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          Contact an admin on WhatsApp to reset your password.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a
            className="rounded-xl bg-brand-600 px-4 py-3 text-center font-bold text-white transition hover:bg-brand-700"
            href="https://wa.me/94706957211"
            target="_blank"
            rel="noreferrer"
          >
            Admin 1 WhatsApp
          </a>
          <a
            className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-center font-bold text-brand-700 transition hover:border-brand-500 dark:border-white/10 dark:bg-white/10 dark:text-brand-100"
            href="https://wa.me/94701866508"
            target="_blank"
            rel="noreferrer"
          >
            Admin 2 WhatsApp
          </a>
        </div>
      </div>
    </AuthCard>
  );
}

function LoginChoice({ to, icon: Icon, title, text }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg dark:border-white/10 dark:bg-white/10 dark:hover:border-white/25"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white transition group-hover:scale-105">
        <Icon size={21} />
      </span>
      <span>
        <span className="block font-black">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-500 dark:text-slate-400">{text}</span>
      </span>
    </Link>
  );
}
