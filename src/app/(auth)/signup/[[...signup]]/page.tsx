import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEFAULT_LANG, LOBE_LOCALE_COOKIE } from '@/const/locale';
import { authEnv } from '@/envs/auth';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';

import BetterAuthSignUpForm from './BetterAuthSignUpForm';

export const generateMetadata = async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOBE_LOCALE_COOKIE)?.value || DEFAULT_LANG;
  const { t } = await translation('auth', locale);

  return metadataModule.generate({
    description: t('betterAuth.signup.subtitle'),
    title: t('betterAuth.signup.title'),
    url: '/signup',
  });
};

const Page = () => {
  if (authEnv.AUTH_DISABLE_EMAIL_PASSWORD) {
    redirect('/signin');
  }

  return <BetterAuthSignUpForm />;
};

export default Page;
