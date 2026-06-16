import { createBrowserRouter, Navigate } from 'react-router-dom';
import { KioskView }      from '@/views/KioskView';
import { DisplayView }    from '@/views/DisplayView';
import { SpecialistView } from '@/views/SpecialistView';
import { NotFoundView }   from '@/views/NotFoundView';

export const router = createBrowserRouter([
  { path: '/',             element: <Navigate to="/kiosk" replace /> },
  { path: '/kiosk',        element: <KioskView /> },
  { path: '/display',      element: <DisplayView /> },
  { path: '/sala-espera',  element: <DisplayView /> },      // alias
  { path: '/turnos',       element: <SpecialistView /> },
  { path: '/specialist',   element: <SpecialistView /> },   // alias
  { path: '*',             element: <NotFoundView /> },
]);
