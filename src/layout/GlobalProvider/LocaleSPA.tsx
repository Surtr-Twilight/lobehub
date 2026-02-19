import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { type PropsWithChildren } from 'react';
import { memo, useEffect, useState } from 'react';
import { isRtlLang } from 'rtl-detect';

import { createI18nNext } from '@/locales/create';
import { isOnServerSide } from '@/utils/env';
import { loadI18nNamespaceModule } from '@/utils/i18n/loadI18nNamespaceModule.vite';
import { getAntdLocale } from '@/utils/locale.vite';

import Editor from './Editor';

const dayjsLocaleLoaders = import.meta.glob<{ default: any }>('/node_modules/dayjs/locale/*.js');

const updateDayjs = async (lang: string) => {
  // dayjs locale is using `en` instead of `en-US`
  // refs: https://github.com/lobehub/lobe-chat/issues/3396
  const locale = lang.toLowerCase() === 'en-us' ? 'en' : lang.toLowerCase();
  const localePath = `/node_modules/dayjs/locale/${locale}.js`;
  const fallbackPath = '/node_modules/dayjs/locale/en.js';
  const loadLocale = dayjsLocaleLoaders[localePath] ?? dayjsLocaleLoaders[fallbackPath];

  if (!loadLocale) throw new Error('Failed to load dayjs fallback locale: en');

  if (!dayjsLocaleLoaders[localePath]) {
    console.warn(`dayjs locale for ${lang} not found, fallback to en`);
  }

  const dayJSLocale = await loadLocale();
  dayjs.locale(dayJSLocale.default);
};

interface LocaleLayoutProps extends PropsWithChildren {
  antdLocale?: any;
  defaultLang?: string;
}

const LocaleSPA = memo<LocaleLayoutProps>(({ children, defaultLang, antdLocale }) => {
  const [i18n] = useState(() => createI18nNext(defaultLang, loadI18nNamespaceModule));
  const [lang, setLang] = useState(defaultLang);
  const [locale, setLocale] = useState(antdLocale);

  if (isOnServerSide) {
    i18n.init({ initAsync: false });
  } else {
    if (!i18n.instance.isInitialized)
      i18n.init().then(async () => {
        if (!lang) return;

        await updateDayjs(lang);
      });
  }

  // handle i18n instance language change
  useEffect(() => {
    const handleLang = async (lng: string) => {
      setLang(lng);

      if (lang === lng) return;

      const newLocale = await getAntdLocale(lng);
      setLocale(newLocale);

      await updateDayjs(lng);
    };

    i18n.instance.on('languageChanged', handleLang);
    return () => {
      i18n.instance.off('languageChanged', handleLang);
    };
  }, [i18n, lang]);

  // detect document direction
  const documentDir = isRtlLang(lang!) ? 'rtl' : 'ltr';

  return (
    <ConfigProvider
      direction={documentDir}
      locale={locale}
      theme={{
        components: {
          Button: {
            contentFontSizeSM: 12,
          },
        },
      }}
    >
      <Editor>{children}</Editor>
    </ConfigProvider>
  );
});

LocaleSPA.displayName = 'LocaleSPA';

export default LocaleSPA;
