import { BRANDING_NAME, ORG_NAME } from '@lobechat/business-const';

import pkg from '../../../package.json';

export const CURRENT_VERSION = pkg.version;

export const isDesktop =
  // @ts-ignore - import.meta.env is available in Vite builds
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_IS_DESKTOP_APP === '1') ||
  process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';

// @ts-ignore
export const isCustomBranding = BRANDING_NAME !== 'LobeHub';
// @ts-ignore
export const isCustomORG = ORG_NAME !== 'LobeHub';
