import { isDesktop } from '@lobechat/const';
import { type PropsWithChildren } from 'react';

import { authEnv } from '@/envs/auth';

import BetterAuth from './BetterAuth';
import Desktop from './Desktop';
import NoAuth from './NoAuth';

const useEnableAuth = () => {
  // Client (SPA/browser): only use __SERVER_CONFIG__ to avoid accessing server env
  if (typeof window !== 'undefined') return !!window.__SERVER_CONFIG__?.config?.enableAuth;
  // Server (Next SSR): authEnv is safe
  return !!authEnv.AUTH_SECRET;
};

const AuthProvider = ({ children }: PropsWithChildren) => {
  const enableAuth = useEnableAuth();

  if (isDesktop) {
    return <Desktop>{children}</Desktop>;
  }

  if (enableAuth) {
    return <BetterAuth>{children}</BetterAuth>;
  }

  return <NoAuth>{children}</NoAuth>;
};

export default AuthProvider;
