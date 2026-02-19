import { isDesktop } from './version';

export const ELECTRON_BE_PROTOCOL_SCHEME = 'lobe-backend';

export const morphApiURI = (uri: string) => {
  return isDesktop ? `${ELECTRON_BE_PROTOCOL_SCHEME}://lobe${uri}` : uri;
};
