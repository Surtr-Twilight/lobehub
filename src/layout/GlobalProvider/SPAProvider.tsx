'use client';

import '@/types/spaServerConfig';

import { ENABLE_BUSINESS_FEATURES } from '@lobechat/business-const';
import { ContextMenuHost, ModalHost, ToastHost, TooltipGroup } from '@lobehub/ui';
import { domMax, LazyMotion } from 'motion/react';
import { type ReactNode, Suspense, useEffect, useState } from 'react';

import { ReferralProvider } from '@/business/client/ReferralProvider';
import { LobeAnalyticsProviderWrapper } from '@/components/Analytics/LobeAnalyticsProviderWrapper';
import { DragUploadProvider } from '@/components/DragUploadZone/DragUploadProvider';
import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { isDesktop } from '@/const/version';
import AuthProvider from '@/layout/AuthProvider';
import { ServerConfigStoreProvider } from '@/store/serverConfig/Provider';
import { getCookie } from '@/utils/index';
import { getAntdLocale } from '@/utils/locale.vite';

import AppTheme from './AppTheme';
import { FaviconProvider } from './FaviconProvider';
import { GroupWizardProvider } from './GroupWizardProvider';
import ImportSettings from './ImportSettings';
import LocaleSPA from './LocaleSPA';
import NextThemeProvider from './NextThemeProvider';
import QueryProvider from './Query';
import ServerVersionOutdatedAlert from './ServerVersionOutdatedAlert';
import StoreInitialization from './StoreInitialization';
import StyleRegistry from './StyleRegistry';

interface SPAGlobalProviderProps {
  children: ReactNode;
}
const locale = getCookie(LOBE_LOCALE_COOKIE);
const SPAGlobalProvider = ({ children }: SPAGlobalProviderProps) => {
  const serverConfig = window.__SERVER_CONFIG__ || {};
  const { featureFlags, config, theme, isMobile } = serverConfig;

  const [antdLocale, setAntdLocale] = useState<any>(undefined);

  useEffect(() => {
    getAntdLocale(locale).then(setAntdLocale);
  }, []);

  return (
    <StyleRegistry>
      <LocaleSPA antdLocale={antdLocale} defaultLang={locale}>
        <NextThemeProvider>
          <AppTheme
            customFontFamily={theme?.customFontFamily}
            customFontURL={theme?.customFontURL}
            defaultNeutralColor={theme?.neutralColor as any}
            defaultPrimaryColor={theme?.primaryColor as any}
            globalCDN={theme?.cdnUseGlobal}
          >
            <ServerConfigStoreProvider
              featureFlags={featureFlags}
              isMobile={isMobile}
              serverConfig={config}
            >
              <QueryProvider>
                <AuthProvider>
                  <StoreInitialization />

                  {isDesktop && <ServerVersionOutdatedAlert />}
                  <FaviconProvider>
                    <GroupWizardProvider>
                      <DragUploadProvider>
                        <LazyMotion features={domMax}>
                          <TooltipGroup layoutAnimation={false}>
                            <LobeAnalyticsProviderWrapper>{children}</LobeAnalyticsProviderWrapper>
                          </TooltipGroup>
                          <ModalHost />
                          <ToastHost />
                          <ContextMenuHost />
                        </LazyMotion>
                      </DragUploadProvider>
                    </GroupWizardProvider>
                  </FaviconProvider>
                </AuthProvider>
              </QueryProvider>
              <Suspense>
                {ENABLE_BUSINESS_FEATURES ? <ReferralProvider /> : null}
                <ImportSettings />
              </Suspense>
            </ServerConfigStoreProvider>
          </AppTheme>
        </NextThemeProvider>
      </LocaleSPA>
    </StyleRegistry>
  );
};

export default SPAGlobalProvider;
