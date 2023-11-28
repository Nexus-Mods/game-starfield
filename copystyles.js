// eslint-disable no-console
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stylePath = path.join(__dirname, 'src', 'styles');
const destPath = path.join(__dirname, 'dist');

async function start() {
  try {
    const styles = await fs.readdir(stylePath);
    for (const style of styles) {
      try {
        await fs.copyFile(
          path.join(stylePath, style),
          path.join(destPath, style)
        );
      }
      catch(err) {
        console.error('Error copying style sheet', { style, err });
      }
    }

  }
  catch(err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to copy styles!', err);
    } else {
      console.log('No styles to copy');
    }
  }
}

start();
