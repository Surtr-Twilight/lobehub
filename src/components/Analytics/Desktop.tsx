'use client';

import Script from 'next/script';
import { memo } from 'react';
import urlJoin from 'url-join';

interface DesktopAnalyticsProps {
  baseUrl?: string;
  projectId?: string;
}

const DesktopAnalytics = memo<DesktopAnalyticsProps>(({ projectId, baseUrl }) =>
  projectId && baseUrl ? (
    <Script defer data-website-id={projectId} src={urlJoin(baseUrl, 'script.js')} />
  ) : null,
);

export default DesktopAnalytics;
