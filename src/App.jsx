import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CompetitionStatusProvider } from './hooks/useCompetitionStatus';
import { CompetitorsProvider } from './hooks/useCompetitors';
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
import AdminDashboard from './pages/AdminDashboard';
import VoterActivity from './pages/VoterActivity';
import UserDirectory from './pages/UserDirectory';
import LeaderboardPage from './pages/LeaderboardPage';
import WinnersPage from './pages/WinnersPage';
import Join from './pages/Join';
import WinnersAutoReveal from './components/WinnersAutoReveal';

export default function App() {
  return (
    <AuthProvider>
      <CompetitionStatusProvider>
        <CompetitorsProvider>
          <WinnersAutoReveal />
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
        <Route path="/judge-login" element={<Navigate to="/login" replace />} />
        <Route path="/competitor-login" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/winners" element={<WinnersPage />} />
        <Route path="/join" element={<Join />} />
        <Route
          path="/voter"
          element={
            <RoleGate allow={[ROLES.VOTER, ROLES.ADMIN]}>
              <StudentDashboard />
            </RoleGate>
          }
        />
        <Route path="/judge" element={<Navigate to="/login" replace />} />
        <Route path="/competitor" element={<Navigate to="/login" replace />} />
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
        </CompetitorsProvider>
      </CompetitionStatusProvider>
    </AuthProvider>
  );
}
