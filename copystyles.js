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
        // eslint-disable-next-line no-console
        // console.log('Copying stylesheet', { style, destPath });
        await fs.copyFile(
          path.join(stylePath, style),
          path.join(destPath, style)
        );
      }
      catch(err) {
        // eslint-disable-next-line no-console
        console.error('Error copying style sheet', { style, err });
      }
    }

  }
  catch(err) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy styles!', err);
  }
}

start();
