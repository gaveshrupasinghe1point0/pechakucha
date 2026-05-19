import { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Users } from 'lucide-react';
import PageShell from '../components/PageShell';
import StatCard from '../components/StatCard';
import { supabase } from '../lib/supabase';

export default function UserDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email,student_id,role,created_at')
      .order('created_at', { ascending: false });

    if (!error) setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();

    const channel = supabase
      .channel('admin-user-directory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const studentCount = users.filter((user) => user.role === 'voter' || user.role === 'competitor').length;
  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <PageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-100">
            Admin only
          </p>
          <h1 className="mt-2 text-4xl font-black">User Directory</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            View registered users with their student IDs and roles. This page is protected and only
            visible to admin accounts.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={18} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total users" value={users.length} icon={Users} />
        <StatCard label="Students/competitors" value={studentCount} icon={Users} tone="emerald" />
        <StatCard label="Admins" value={adminCount} icon={ShieldCheck} tone="amber" />
      </div>

      <section className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-white/70 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Student ID</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4 font-black">{user.full_name}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-5 py-4 font-semibold">{user.student_id ?? 'Not provided'}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold uppercase text-brand-700 dark:text-brand-100">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(user.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
