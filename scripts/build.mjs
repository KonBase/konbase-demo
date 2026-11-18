// `npm run build` = next build, except on Cloudflare Workers Builds (WORKERS_CI=1),
// where `wrangler deploy` needs the OpenNext bundle from `opennextjs-cloudflare build`.
import { spawnSync } from 'node:child_process';

const cmd =
  process.env.WORKERS_CI === '1'
    ? ['opennextjs-cloudflare', 'build']
    : ['next', 'build'];
const r = spawnSync('npx', cmd, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(r.status ?? 1);
