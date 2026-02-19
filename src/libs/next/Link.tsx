/**
 * Link component - react-router-dom replacement for next/link.
 * Accepts `href` (Next.js style) and maps it to react-router-dom `to`.
 * External URLs (http/https/mailto/tel) render a plain <a> tag.
 *
 * @see Phase 4.2
 */

import { type AnchorHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';

export interface LinkProps
  extends Omit<RouterLinkProps, 'to' | 'prefetch'>,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Omit<RouterLinkProps, 'prefetch'>> {
  children?: ReactNode;
  href?: string;
  prefetch?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  to?: string;
}

function isExternalUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/.test(url);
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, to, prefetch: _prefetch, scroll: _scroll, shallow: _shallow, replace, ...rest }, ref) => {
    const target = href || to || '/';

    if (isExternalUrl(target)) {
      return <a ref={ref} href={target} {...rest} />;
    }

    return <RouterLink ref={ref} replace={replace} to={target} {...rest} />;
  },
);

Link.displayName = 'Link';

export default Link;
