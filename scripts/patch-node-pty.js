// Patches node-pty for Windows builds without Spectre-mitigated libraries
const fs = require('fs');
const path = require('path');

const nodeptyDir = path.join(__dirname, '..', 'node_modules', 'node-pty');

// 1. Patch winpty.gyp
const winptyGyp = path.join(nodeptyDir, 'deps', 'winpty', 'src', 'winpty.gyp');
if (fs.existsSync(winptyGyp)) {
  let content = fs.readFileSync(winptyGyp, 'utf8');
  content = content.replace(
    /'WINPTY_COMMIT_HASH%': '.*?'/,
    "'WINPTY_COMMIT_HASH%': 'none'"
  );
  content = content.replace(
    /'<!\(cmd \/c "cd shared && UpdateGenVersion\.bat.*?'\)/,
    "'gen')"
  );
  content = content.replace(/'SpectreMitigation': 'Spectre'/g, "'SpectreMitigation': 'false'");
  fs.writeFileSync(winptyGyp, content);
  console.log('Patched winpty.gyp');
}

// 2. Create GenVersion.h
const genDir = path.join(nodeptyDir, 'deps', 'winpty', 'src', 'gen');
fs.mkdirSync(genDir, { recursive: true });
const versionFile = path.join(nodeptyDir, 'deps', 'winpty', 'VERSION.txt');
const version = fs.existsSync(versionFile) ? fs.readFileSync(versionFile, 'utf8').trim() : '0.0.0';
fs.writeFileSync(
  path.join(genDir, 'GenVersion.h'),
  `const char GenVersion_Version[] = "${version}";\nconst char GenVersion_Commit[] = "none";\n`
);
console.log('Created GenVersion.h');

// 3. Patch binding.gyp
const bindingGyp = path.join(nodeptyDir, 'binding.gyp');
if (fs.existsSync(bindingGyp)) {
  let content = fs.readFileSync(bindingGyp, 'utf8');
  content = content.replace(/'SpectreMitigation': 'Spectre'/g, "'SpectreMitigation': 'false'");
  fs.writeFileSync(bindingGyp, content);
  console.log('Patched binding.gyp');
}

console.log('node-pty patches applied successfully');
