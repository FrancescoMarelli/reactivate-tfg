import { create } from 'browser-sync';
import { build } from 'esbuild';
import { config } from './esbuild.config.js';

const bs = create();

const builder = await build({
  ...config,
  define: { 'process.env.NODE_ENV': '"development"' },
  sourcemap: true,
  incremental: true,
});

bs.watch('src/**/*.ts', (event, file) => {
  console.log(`- ${file} changed, rebuilding`);
  builder
    .rebuild()
    .then(() => bs.reload())
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
});

bs.watch('public/{index.html,assets/**/*}', (event, file) => {
  console.log(`- Asset ${file} changed, reloading`);
  bs.reload();
});

bs.init({
  server: 'public',
  host: '0.0.0.0',
  port: 3000,
  open: false,
});

// Script de producción

await build({
  ...config,
  define: { 'process.env.NODE_ENV': '"production"' },
  sourcemap: false,
  minify: true,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
