# Packaging & Distribution

How to build PowerShell Spider into a standalone `.exe` installer for Windows with a custom icon.

---

## Step 1: Create the Icon

The app icon must be a `.ico` file (Windows icon format). We use the spider logo: `/\../\`

### Option A: Generate with ImageMagick (CLI)

```bash
# Install ImageMagick: https://imagemagick.org/script/download.php

# Create a 256x256 icon with the spider logo on a dark background
magick -size 256x256 xc:"#0a0a0a" ^
  -font "Consolas-Bold" -pointsize 48 ^
  -fill "#00ff41" -gravity center ^
  -annotate +0-10 "/\../\" ^
  -annotate +0+30 "SPIDER" ^
  icon.png

# Convert to .ico (multi-resolution)
magick icon.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

### Option B: Create Manually

1. Open any image editor (Photoshop, GIMP, Figma, even Paint.NET)
2. Create a **256x256** canvas with background `#0a0a0a`
3. Using a monospace font (Consolas or JetBrains Mono) in color `#00ff41`, type:
   ```
   /\../\
   SPIDER
   ```
4. Center it, export as PNG
5. Convert PNG to `.ico` using [ConvertICO](https://convertico.com/) or [icoconvert.com](https://icoconvert.com/)
   - Include sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### Option C: Use Python

```python
from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (256, 256), '#0a0a0a')
draw = ImageDraw.Draw(img)
font = ImageFont.truetype('consola.ttf', 40)  # Consolas on Windows
draw.text((128, 100), '/\\../\\', fill='#00ff41', font=font, anchor='mm')
draw.text((128, 150), 'SPIDER', fill='#00ff41', font=font, anchor='mm')
img.save('icon.png')
# Then convert to .ico using the method above
```

Place the final icon at:

```
assets/icon.ico
```

## Step 2: Configure the Icon

Update `forge.config.ts` to reference the icon:

```ts
const config: ForgeConfig = {
  packagerConfig: {
    name: 'PowerShell Spider',
    executableName: 'powershell-spider',
    icon: './assets/icon',          // no .ico extension — Forge adds it
    asar: {
      unpack: '**/*.node',
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'powershell-spider',
      setupIcon: './assets/icon.ico',
      iconUrl: 'https://raw.githubusercontent.com/romankarki/powershell-spider/master/assets/icon.ico',
    }),
  ],
  // ... rest stays the same
};
```

## Step 3: Build the Installer

```bash
# 1. Make sure everything compiles clean
npx tsc --noEmit

# 2. Rebuild native modules
npx @electron/rebuild

# 3. Package into a folder (quick test)
npm run package

# 4. Build the .exe installer
npm run make
```

Output location:

```
out/
├── make/
│   └── squirrel.windows/
│       └── x64/
│           ├── powershell-spider-1.0.0 Setup.exe   <-- installer
│           └── RELEASES
└── powershell-spider-win32-x64/                    <-- unpacked app
    └── powershell-spider.exe                       <-- direct exe
```

## Step 4: Distribute

### Direct `.exe` (no install)

Share the entire `out/powershell-spider-win32-x64/` folder as a zip. Users run `powershell-spider.exe` directly.

### Installer `.exe`

Share `out/make/squirrel.windows/x64/powershell-spider-1.0.0 Setup.exe`. This installs to the user's `AppData`, creates Start Menu shortcuts, and supports auto-updates.

### Versioning

Update the version in `package.json` before each release:

```json
{
  "version": "1.0.0"
}
```

The installer filename includes the version automatically.

## Folder Structure After Setup

```
powershell-spider/
├── assets/
│   └── icon.ico        <-- app icon (all sizes)
├── forge.config.ts     <-- updated with icon paths
├── package.json        <-- version number
└── out/                <-- build output (gitignored)
```

## Troubleshooting

**Icon not showing on the .exe**
- Make sure `icon.ico` contains all sizes (16 through 256)
- The `icon` path in `packagerConfig` must NOT include the `.ico` extension
- The `setupIcon` path in `MakerSquirrel` MUST include `.ico`

**Squirrel installer fails**
- Ensure `@electron-forge/maker-squirrel` is installed
- Run `npm run make` from a clean state: delete the `out/` folder first

**Native module errors after packaging**
- The `asar.unpack: '**/*.node'` setting in `packagerConfig` ensures `node-pty` binaries stay outside the asar archive
- If still failing, try adding `node-pty` to `packagerConfig.extraResource`
