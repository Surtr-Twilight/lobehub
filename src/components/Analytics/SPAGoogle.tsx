'use client';

import { type FC, useEffect } from 'react';

interface SPAGoogleAnalyticsProps {
  measurementId: string;
}

const SPAGoogleAnalytics: FC<SPAGoogleAnalyticsProps> = ({ measurementId }) => {
  useEffect(() => {
    if (!measurementId) return;

    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.async = true;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId);

    return () => {
      script.remove();
    };
  }, [measurementId]);

  return null;
};

export default SPAGoogleAnalytics;
