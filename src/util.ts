import { fs, log, selectors, types, util } from "vortex-api";
import { GAME_ID } from './common';
import path from "path";

export async function mergeFolderContents(source: string, destination: string, overwrite = false): Promise<void> {
  log('debug', 'Merging folders', { source, destination, overwrite });
  // Copy all the files and folders that are inside one folder to another. 
  await fs.ensureDirWritableAsync(destination);
  const sourceDir = await fs.readdirAsync(source);
  const destinationDir = await fs.readdirAsync(destination);

  for (const sourceFile of sourceDir) {
    const sourceFilePath = path.join(source, sourceFile)
    const stats: fs.Stats = await fs.statAsync(sourceFilePath);
    // Check if there's an indentical folder/file in the dest already.
    const destinationMatch = destinationDir.find(f => f.toLowerCase() === sourceFile.toLowerCase());

    if (stats.isDirectory()) {
      // Is there already a subfolder? If so, we need to merge the contents
      if (destinationMatch !== undefined) {
        await mergeFolderContents(sourceFilePath, path.join(destination, destinationMatch), overwrite);
      }
      // We can move the entire folder over. 
      else {
        await fs.copyAsync(sourceFilePath, path.join(destination, sourceFile), { force: true });
      }
      // await fs.rmdirAsync(sourceFilePath)
      continue;
    }
    // Otherwise we're dealing with a file. 
    else if (stats.isFile()) {
      // If the file doesn't exist, merge it over. 
      if (!destinationMatch || overwrite) {
        await fs.copyAsync(sourceFilePath, path.join(destination, destinationMatch), { overwrite: true });
        continue;
      }
      else {
        log('debug', 'Did not copy file as it already exists', { source: sourceFilePath, destination: path.join(destination, destinationMatch) })
        // await fs.unlinkAsync(sourceFilePath);
        continue;
      }
    }
    else return log('warn', 'Did not remove file as it is neither a file nor folder', sourceFilePath);
  }

  // await fs.rmdirAsync(source);
}

export const isStarfield = (context: types.IExtensionContext, gameId: string | string[] | undefined = undefined) => {
  if (gameId !== undefined) {
    return (gameId === GAME_ID);
  }
  const state = context.api.getState();
  const gameMode = selectors.activeGameId(state);
  return (gameMode === GAME_ID);
};

export const openSettingsPath = () => {
  const docPath = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  util.opn(docPath).catch(() => null);
};

export const openAppDataPath = () => {
  const docPath = path.join(util.getVortexPath('localAppData'), 'Starfield');
  util.opn(docPath).catch(() => null);
};