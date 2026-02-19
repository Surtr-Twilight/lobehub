import { morphApiURI } from '@/const/protocol';

export const API_ENDPOINTS = {
  oauth: morphApiURI('/api/auth'),

  proxy: morphApiURI('/webapi/proxy'),

  // plugins
  gateway: morphApiURI('/webapi/plugin/gateway'),

  // trace
  trace: morphApiURI('/webapi/trace'),

  // chat
  chat: (provider: string) => morphApiURI(`/webapi/chat/${provider}`),

  // models
  models: (provider: string) => morphApiURI(`/webapi/models/${provider}`),
  modelPull: (provider: string) => morphApiURI(`/webapi/models/${provider}/pull`),

  // STT
  stt: morphApiURI('/webapi/stt/openai'),

  // TTS
  tts: (provider: string) => morphApiURI(`/webapi/tts/${provider}`),
  edge: morphApiURI('/webapi/tts/edge'),
  microsoft: morphApiURI('/webapi/tts/microsoft'),
};

export const MARKET_OIDC_ENDPOINTS = {
  // NOTE: `auth` is used to open a page in the system browser (desktop) / popup (web),
  // so it must always be an HTTP(S) path joined with `NEXT_PUBLIC_MARKET_BASE_URL`.
  // It MUST NOT be wrapped by the Electron backend protocol.
  auth: '/lobehub-oidc/auth',
  token: morphApiURI('/market/oidc/token'),
  userinfo: morphApiURI('/market/oidc/userinfo'),
  handoff: morphApiURI('/market/oidc/handoff'),
  // Same as `auth`: used as `redirect_uri` (must be a real web URL under market base).
  desktopCallback: '/lobehub-oidc/callback/desktop',
};

export const MARKET_ENDPOINTS = {
  base: morphApiURI('/market'),
  // Agent management
  createAgent: morphApiURI('/market/agent/create'),
  getAgentDetail: (identifier: string) =>
    morphApiURI(`/market/agent/${encodeURIComponent(identifier)}`),
  getOwnAgents: morphApiURI('/market/agent/own'),
  createAgentVersion: morphApiURI('/market/agent/versions/create'),
  // Agent status management
  publishAgent: (identifier: string) =>
    morphApiURI(`/market/agent/${encodeURIComponent(identifier)}/publish`),
  unpublishAgent: (identifier: string) =>
    morphApiURI(`/market/agent/${encodeURIComponent(identifier)}/unpublish`),
  deprecateAgent: (identifier: string) =>
    morphApiURI(`/market/agent/${encodeURIComponent(identifier)}/deprecate`),
  // User profile
  getUserProfile: (username: string) => morphApiURI(`/market/user/${encodeURIComponent(username)}`),
  updateUserProfile: morphApiURI('/market/user/me'),

  // Social - Follow
  follow: morphApiURI('/market/social/follow'),
  unfollow: morphApiURI('/market/social/unfollow'),
  followStatus: (userId: number) => morphApiURI(`/market/social/follow-status/${userId}`),
  following: (userId: number) => morphApiURI(`/market/social/following/${userId}`),
  followers: (userId: number) => morphApiURI(`/market/social/followers/${userId}`),
  followCounts: (userId: number) => morphApiURI(`/market/social/follow-counts/${userId}`),

  // Social - Favorite
  favorite: morphApiURI('/market/social/favorite'),
  unfavorite: morphApiURI('/market/social/unfavorite'),
  favoriteStatus: (targetType: 'agent' | 'plugin', targetIdOrIdentifier: number | string) =>
    morphApiURI(
      `/market/social/favorite-status/${targetType}/${encodeURIComponent(targetIdOrIdentifier)}`,
    ),
  myFavorites: morphApiURI('/market/social/favorites'),
  userFavorites: (userId: number) => morphApiURI(`/market/social/user-favorites/${userId}`),
  favoriteAgents: (userId: number) => morphApiURI(`/market/social/favorite-agents/${userId}`),
  favoritePlugins: (userId: number) => morphApiURI(`/market/social/favorite-plugins/${userId}`),

  // Social - Like
  like: morphApiURI('/market/social/like'),
  unlike: morphApiURI('/market/social/unlike'),
  toggleLike: morphApiURI('/market/social/toggle-like'),
  likeStatus: (targetType: 'agent' | 'plugin', targetIdOrIdentifier: number | string) =>
    morphApiURI(
      `/market/social/like-status/${targetType}/${encodeURIComponent(targetIdOrIdentifier)}`,
    ),
  likedAgents: (userId: number) => morphApiURI(`/market/social/liked-agents/${userId}`),
  likedPlugins: (userId: number) => morphApiURI(`/market/social/liked-plugins/${userId}`),
};
