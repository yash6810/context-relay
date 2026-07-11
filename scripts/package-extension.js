import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const ZIP_PATH = path.resolve(PUBLIC_DIR, 'context-relay-extension.zip');

function packageExtension() {
  console.log('Packaging extension...');
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist directory does not exist. Run "npm run build" first.');
    process.exit(1);
  }

  // Make sure public dir exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Copy manifest and icons to dist
  const rootDir = path.resolve(__dirname, '..');
  try {
    fs.copyFileSync(path.resolve(rootDir, 'manifest.json'), path.resolve(DIST_DIR, 'manifest.json'));
    // Icons folder is in public, but since Vite might copy it, let's check
    const distIcons = path.resolve(DIST_DIR, 'icons');
    if (!fs.existsSync(distIcons)) {
       const publicIcons = path.resolve(PUBLIC_DIR, 'icons');
       if (fs.existsSync(publicIcons)) {
         fs.cpSync(publicIcons, distIcons, { recursive: true });
       }
    }
  } catch (err) {
    console.error("Failed to copy manifest/assets to dist:", err);
  }

  try {
    const zip = new AdmZip();
    zip.addLocalFolder(DIST_DIR);
    zip.writeZip(ZIP_PATH);
    console.log(`\n✅ Extension packaged successfully!`);
    console.log(`📁 File saved to: ${ZIP_PATH}\n`);
  } catch (error) {
    console.error('Failed to package extension:', error);
    process.exit(1);
  }
}

packageExtension();
