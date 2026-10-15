// Packs the PNGs rendered by make-icon.ps1 into a multi-size assets/icon.ico
// (PNG-compressed entries, supported since Windows Vista).
// Usage: node scripts/make-icon.js
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'build', 'icon');
const out = path.join(__dirname, '..', 'assets', 'icon.ico');
const sizes = [256, 128, 64, 48, 32, 16];

const pngs = sizes.map((s) => ({ size: s, data: fs.readFileSync(path.join(srcDir, `icon-${s}.png`)) }));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);           // reserved
header.writeUInt16LE(1, 2);           // type: icon
header.writeUInt16LE(pngs.length, 4); // image count

const entries = [];
let offset = 6 + 16 * pngs.length;
for (const { size, data } of pngs) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2);                       // palette
  e.writeUInt8(0, 3);                       // reserved
  e.writeUInt16LE(1, 4);                    // color planes
  e.writeUInt16LE(32, 6);                   // bits per pixel
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += data.length;
  entries.push(e);
}

fs.writeFileSync(out, Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]));
console.log(`wrote ${out} (${sizes.join(', ')} px)`);
