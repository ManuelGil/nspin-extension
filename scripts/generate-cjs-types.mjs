import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

async function listFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function toCjsDeclarationContent(content) {
  let next = content;

  // Rewrite relative ESM specifiers so .d.cts references the CJS entrypoints.
  next = next.replace(/(["'])(\.{1,2}\/[^"']*)\.js\1/g, '$1$2.cjs$1');

  // Keep source map references aligned with the generated declaration extension.
  next = next.replace(/\.d\.ts\.map\b/g, '.d.cts.map');

  return next;
}

function toCjsDeclarationMapContent(content) {
  try {
    const map = JSON.parse(content);

    if (typeof map.file === 'string') {
      map.file = map.file.replace(/\.d\.ts$/u, '.d.cts');
    }

    return `${JSON.stringify(map)}\n`;
  } catch {
    return content.replace(/\.d\.ts\b/g, '.d.cts');
  }
}

async function main() {
  const files = await listFilesRecursively(DIST_DIR);

  const declarationFiles = files.filter((file) => file.endsWith('.d.ts'));
  const declarationMapFiles = files.filter((file) => file.endsWith('.d.ts.map'));

  await Promise.all(
    declarationFiles.map(async (file) => {
      const content = await readFile(file, 'utf8');
      const transformed = toCjsDeclarationContent(content);
      const outFile = file.replace(/\.d\.ts$/u, '.d.cts');

      await writeFile(outFile, transformed, 'utf8');
    })
  );

  await Promise.all(
    declarationMapFiles.map(async (file) => {
      const content = await readFile(file, 'utf8');
      const transformed = toCjsDeclarationMapContent(content);
      const outFile = file.replace(/\.d\.ts\.map$/u, '.d.cts.map');

      await writeFile(outFile, transformed, 'utf8');
    })
  );
}

main().catch((error) => {
  console.error('Failed to generate .d.cts declarations');
  console.error(error);
  process.exitCode = 1;
});
