import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default {
  ...defineCloudflareConfig(),
  // Without this OpenNext runs `npm run build`, which would call it back (see scripts/build.mjs)
  buildCommand: 'npx next build',
};
