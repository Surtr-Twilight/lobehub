'use client';

import { memo, useEffect } from 'react';
import urlJoin from 'url-join';

import { isDesktop } from '@/const/version';
import { type AnalyticsConfig } from '@/types/spaServerConfig';

function loadScript(src: string, attrs?: Record<string, string>) {
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = src;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      script.setAttribute(key, value);
    }
  }
  document.head.appendChild(script);
}

function loadInlineScript(code: string) {
  const script = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);
}

const SPAAnalytics = memo(() => {
  const analyticsConfig = window.__SERVER_CONFIG__?.analyticsConfig;

  useEffect(() => {
    if (!analyticsConfig) return;

    loadGoogleAnalytics(analyticsConfig);
    loadPlausible(analyticsConfig);
    loadUmami(analyticsConfig);
    loadClarity(analyticsConfig);
    loadReactScan(analyticsConfig);
    loadDesktopAnalytics(analyticsConfig);
  }, [analyticsConfig]);

  return null;
});

function loadGoogleAnalytics(config: AnalyticsConfig) {
  if (!config.google?.measurementId) return;
  const id = config.google.measurementId;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  loadInlineScript(`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  `);
}

function loadPlausible(config: AnalyticsConfig) {
  if (!config.plausible?.domain) return;
  loadScript(`${config.plausible.scriptBaseUrl}/js/script.js`, {
    'data-domain': config.plausible.domain,
  });
}

function loadUmami(config: AnalyticsConfig) {
  if (!config.umami?.websiteId) return;
  loadScript(config.umami.scriptUrl, {
    'data-website-id': config.umami.websiteId,
  });
}

function loadClarity(config: AnalyticsConfig) {
  if (!config.clarity?.projectId) return;
  loadInlineScript(`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${config.clarity.projectId}");
  `);
}

function loadReactScan(config: AnalyticsConfig) {
  if (!config.reactScan?.apiKey) return;
  loadScript('https://monitoring.react-scan.com/api/v1/ingest', {
    'data-api-key': config.reactScan.apiKey,
  });
}

function loadDesktopAnalytics(config: AnalyticsConfig) {
  if (!isDesktop) return;
  if (!config.desktop?.projectId || !config.desktop?.baseUrl) return;
  loadScript(urlJoin(config.desktop.baseUrl, 'script.js'), {
    'data-website-id': config.desktop.projectId,
  });
}

SPAAnalytics.displayName = 'SPAAnalytics';

export default SPAAnalytics;
