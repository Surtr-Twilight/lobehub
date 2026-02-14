'use client';

import { memo, useEffect, useMemo } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, useNavigate } from 'react-router-dom';

import { getDesktopOnboardingCompleted } from '@/app/[variants]/(desktop)/desktop-onboarding/storage';
import { isDesktop } from '@/const/version';

import { desktopRoutes } from './desktopRouter.config';

const DesktopOnboardingRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Desktop runtime guard
    if (!isDesktop) return;

    // If already completed, allow normal routing.
    if (getDesktopOnboardingCompleted()) return;

    // Redirect to SPA onboarding route.
    if (window.location.pathname !== '/desktop-onboarding') {
      navigate('/desktop-onboarding', { replace: true });
    }
  }, [navigate]);

  return null;
};

const DesktopRouterRoot = memo(() => {
  return (
    <>
      {isDesktop && <DesktopOnboardingRedirect />}
      <Outlet />
    </>
  );
});

DesktopRouterRoot.displayName = 'DesktopRouterRoot';

const ClientRouter = () => {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          children: desktopRoutes,
          element: <DesktopRouterRoot />,
        },
      ]),
    [],
  );

  return <RouterProvider router={router} />;
};

export default ClientRouter;
