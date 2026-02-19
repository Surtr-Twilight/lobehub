import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import { morphApiURI } from '@/const/protocol';
import { type AsyncRouter } from '@/server/routers/async';

export const asyncClient = createTRPCClient<AsyncRouter>({
  links: [
    httpBatchLink({
      maxURLLength: 2083,
      transformer: superjson,
      url: morphApiURI('/trpc/async'),
    }),
  ],
});
