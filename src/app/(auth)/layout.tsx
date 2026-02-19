import { cookies, headers } from 'next/headers';
import { type ReactNode, Suspense } from 'react';
import { isRtlLang } from 'rtl-detect';

import ClientOnly from '@/components/client/ClientOnly';
import { DEFAULT_LANG, LOBE_LOCALE_COOKIE } from '@/const/locale';
import AuthProvider from '@/layout/AuthProvider';
import GlobalProvider from '@/layout/GlobalProvider';
import { parseBrowserLanguage } from '@/utils/locale';

import AuthContainer from './_layout';

export default async function AuthRootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale =
    cookieStore.get(LOBE_LOCALE_COOKIE)?.value || parseBrowserLanguage(headerStore, DEFAULT_LANG);
  const direction = isRtlLang(locale) ? 'rtl' : 'ltr';

  return (
    <html suppressHydrationWarning dir={direction} lang={locale}>
      <body>
        <GlobalProvider isMobile={false} locale={locale}>
          <AuthProvider>
            <ClientOnly>
              <Suspense>
                <AuthContainer>{children}</AuthContainer>
              </Suspense>
            </ClientOnly>
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
