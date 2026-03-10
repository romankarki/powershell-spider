const { spawn } = require('child_process');
const { createServer, build } = require('vite');
const path = require('path');
const electronPath = require('electron');

async function startDev() {
  // 1. Start Vite dev server for renderer
  const viteServer = await createServer({
    configFile: path.join(__dirname, 'vite.renderer.config.ts'),
    root: path.join(__dirname, 'src/renderer'),
  });
  await viteServer.listen(5173);
  const url = `http://localhost:${viteServer.config.server.port || 5173}`;
  console.log(`Vite dev server running at ${url}`);

  // 2. Build main process
  await build({
    configFile: path.join(__dirname, 'vite.main.config.ts'),
    root: __dirname,
    build: {
      outDir: '.vite/build',
      lib: {
        entry: 'src/main/index.ts',
        formats: ['cjs'],
        fileName: () => 'index.js',
      },
      rollupOptions: {
        external: ['electron', 'node-pty', ...require('module').builtinModules.map(m => [m, `node:${m}`]).flat()],
      },
      emptyOutDir: false,
      minify: false,
    },
    define: {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: JSON.stringify(url),
      MAIN_WINDOW_VITE_NAME: JSON.stringify('main_window'),
    },
  });
  console.log('Main process built');

  // 3. Build preload
  await build({
    configFile: path.join(__dirname, 'vite.preload.config.ts'),
    root: __dirname,
    build: {
      outDir: '.vite/preload',
      rollupOptions: {
        input: 'src/preload/index.ts',
        external: ['electron', 'electron/renderer', ...require('module').builtinModules.map(m => [m, `node:${m}`]).flat()],
        output: {
          format: 'cjs',
          inlineDynamicImports: true,
          entryFileNames: '[name].js',
        },
      },
      emptyOutDir: false,
      minify: false,
    },
  });
  console.log('Preload built');

  // 4. Start electron
  const electronProcess = spawn(electronPath, ['.'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env },
  });

  electronProcess.on('exit', (code) => {
    console.log(`Electron exited with code ${code}`);
    viteServer.close();
    process.exit(code || 0);
  });

  electronProcess.on('error', (err) => {
    console.error('Failed to start electron:', err);
    viteServer.close();
    process.exit(1);
  });
}

startDev().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
