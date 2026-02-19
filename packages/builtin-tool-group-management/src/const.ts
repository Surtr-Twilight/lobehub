export const isDesktop =
  // @ts-ignore - import.meta.env is available in Vite builds
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_IS_DESKTOP_APP === '1') ||
  process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';
