/**
 * Navigation utilities - react-router-dom replacements for Next.js navigation APIs.
 *
 * @see Phase 4.1
 */

import { useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from 'react-router-dom';

/**
 * Polyfill for next/navigation ReadonlyURLSearchParams.
 * In SPA mode, just alias the standard URLSearchParams.
 */
export type ReadonlyURLSearchParams = globalThis.URLSearchParams;

/**
 * Drop-in replacement for next/navigation useRouter.
 * Returns an object with push / replace / back / forward / refresh / prefetch.
 */
export function useRouter() {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      prefetch: (_href: string) => {
        /* noop in SPA */
      },
      push: (path: string) => navigate(path),
      refresh: () => navigate(0),
      replace: (path: string) => navigate(path, { replace: true }),
    }),
    [navigate],
  );
}

/**
 * Drop-in replacement for next/navigation usePathname.
 */
export function usePathname(): string {
  return useLocation().pathname;
}

/**
 * Drop-in replacement for next/navigation useSearchParams.
 * Next.js returns ReadonlyURLSearchParams directly;
 * react-router-dom returns [URLSearchParams, setter].
 * We unwrap to match the Next.js API so consumers can call searchParams.get().
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

/**
 * Re-export react-router-dom useParams.
 */
export const useParams = useRouterParams;

/**
 * Imperative redirect for use in event handlers / loaders (not in component render).
 */
export function redirect(url: string): never {
  window.location.href = url;
  throw new Error(`Redirecting to ${url}`);
}

/**
 * Throw a "not found" error, caught by the nearest ErrorBoundary / errorElement.
 */
export function notFound(): never {
  const error = new Error('NOT_FOUND');
  (error as any).status = 404;
  (error as any).statusCode = 404;
  throw error;
}

/**
 * Noop replacement for next/navigation useServerInsertedHTML.
 * In SPA mode, styles are injected by the CSS-in-JS runtime on the client.
 * The callback is simply ignored.
 */
export function useServerInsertedHTML(_callback: () => React.ReactNode): void {
  // noop in SPA - antd-style handles client-side style injection
}

export type RedirectType = 'push' | 'replace';
