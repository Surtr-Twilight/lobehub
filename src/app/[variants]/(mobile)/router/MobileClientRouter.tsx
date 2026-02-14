'use client';

import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { mobileRoutes } from './mobileRouter.config';

const ClientRouter = () => {
  const router = useMemo(() => createBrowserRouter(mobileRoutes), []);

  return <RouterProvider router={router} />;
};

export default ClientRouter;
