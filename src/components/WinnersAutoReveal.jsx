import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCompetitionStatus } from '../hooks/useCompetitionStatus';

const exemptPaths = ['/winners'];

export default function WinnersAutoReveal() {
  const { status } = useCompetitionStatus();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!status.winners_page_enabled) return;
    if (location.pathname.startsWith('/admin')) return;
    if (exemptPaths.includes(location.pathname)) return;
    navigate('/winners', { replace: true });
  }, [location.pathname, navigate, status.winners_page_enabled]);

  return null;
}
