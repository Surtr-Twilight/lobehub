import { type ReactNode } from 'react';
import { memo } from 'react';

import { LobeAnalyticsProvider } from '@/components/Analytics/LobeAnalyticsProvider';
import { isDev } from '@/utils/env';

type Props = {
  children: ReactNode;
};

export const LobeAnalyticsProviderWrapper = memo<Props>(({ children }) => {
  const analyticsConfig = window.__SERVER_CONFIG__?.analyticsConfig;

  return (
    <LobeAnalyticsProvider
      ga4Config={{
        debug: isDev,
        enabled: !!analyticsConfig?.google,
        gtagConfig: {
          debug_mode: isDev,
        },
        measurementId: analyticsConfig?.google?.measurementId ?? '',
      }}
      postHogConfig={{
        debug: analyticsConfig?.posthog?.debug ?? false,
        enabled: !!analyticsConfig?.posthog,
        host: analyticsConfig?.posthog?.host,
        key: analyticsConfig?.posthog?.key ?? '',
        person_profiles: 'always',
      }}
    >
      {children}
    </LobeAnalyticsProvider>
  );
});

LobeAnalyticsProviderWrapper.displayName = 'LobeAnalyticsProviderWrapper';
