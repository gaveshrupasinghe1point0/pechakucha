import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ROLES } from './lib/constants';
import RoleGate from './components/RoleGate';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import RoleLogin from './pages/RoleLogin';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import JudgeDashboard from './pages/JudgeDashboard';
import CompetitorDashboard from './pages/CompetitorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VoterActivity from './pages/VoterActivity';
import UserDirectory from './pages/UserDirectory';
import LeaderboardPage from './pages/LeaderboardPage';
import Join from './pages/Join';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/voter-login"
          element={
            <RoleLogin
              role={ROLES.VOTER}
              title="Voter login"
              subtitle="Students can vote using verified @students.nsbm.ac.lk accounts."
              placeholder="name@students.nsbm.ac.lk"
            />
          }
        />
        <Route
          path="/judge-login"
          element={
            <RoleLogin
              role={ROLES.JUDGE}
              title="Judge login"
              subtitle="Lecturers and judges can score using @nsbm.ac.lk accounts."
              placeholder="name@nsbm.ac.lk"
            />
          }
        />
        <Route
          path="/competitor-login"
          element={
            <RoleLogin
              role={ROLES.COMPETITOR}
              title="Competitor login"
              subtitle="Competitors can view their profile and live results."
              placeholder="competitor@students.nsbm.ac.lk"
            />
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/join" element={<Join />} />
        <Route
          path="/voter"
          element={
            <RoleGate allow={[ROLES.VOTER, ROLES.ADMIN]}>
              <StudentDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/judge"
          element={
            <RoleGate allow={[ROLES.JUDGE]}>
              <JudgeDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/competitor"
          element={
            <RoleGate allow={[ROLES.COMPETITOR]}>
              <CompetitorDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleGate allow={[ROLES.ADMIN]}>
              <AdminDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/admin/voter-activity"
          element={
            <RoleGate allow={[ROLES.ADMIN]}>
              <VoterActivity />
            </RoleGate>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGate allow={[ROLES.ADMIN]}>
              <UserDirectory />
            </RoleGate>
          }
        />
        <Route path="/student" element={<Navigate to="/voter" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
