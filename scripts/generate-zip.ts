import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function addDirectoryToZip(zip: JSZip, dirPath: string, rootDir: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Ignore unwanted folders and files
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === '.aistudio' ||
      entry.name === 'bun.lock' ||
      entry.name.endsWith('.zip')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, rootDir);
    } else {
      const fileData = fs.readFileSync(fullPath);
      zip.file(relativePath, fileData);
    }
  }
}

async function createProjectZip() {
  const rootDir = process.cwd();
  const zip = new JSZip();

  console.log('Packing project files...');
  await addDirectoryToZip(zip, rootDir, rootDir);

  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'rx-nafij-ai-voice.zip');
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(outputPath, content);
  console.log(`ZIP created successfully at: ${outputPath} (${(content.length / 1024).toFixed(1)} KB)`);
}

createProjectZip().catch((err) => {
  console.error('Failed to create ZIP:', err);
  process.exit(1);
});
