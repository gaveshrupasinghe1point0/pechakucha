export const ROLES = {
  ADMIN: 'admin',
  JUDGE: 'judge',
  COMPETITOR: 'competitor',
  VOTER: 'voter',
};

export const STUDENT_DOMAIN = '@students.nsbm.ac.lk';
export const STAFF_DOMAIN = '@nsbm.ac.lk';

export const eventConfig = {
  name: import.meta.env.VITE_EVENT_NAME || 'NSBM PechaKucha Competition',
  brand: import.meta.env.VITE_EVENT_BRAND || 'NSBM Green University',
};
