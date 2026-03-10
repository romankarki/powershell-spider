import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { VitePlugin } from '@electron-forge/plugin-vite';
import path from 'path';
import fs from 'fs';

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    name: 'PowerShell Spider',
    executableName: 'powershell-spider',
    icon: './assets/icon',
    asar: {
      unpack: '**/node_modules/node-pty/**',
    },
  },
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      // Copy node-pty into the packaged app since Vite plugin excludes node_modules
      const src = path.resolve(__dirname, 'node_modules', 'node-pty');
      const dest = path.join(buildPath, 'node_modules', 'node-pty');
      if (fs.existsSync(src)) {
        copyDirSync(src, dest);
        console.log('Copied node-pty to build path');
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'powershell-spider',
      setupIcon: './assets/icon.ico',
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
