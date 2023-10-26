import { fs, log, selectors, types, util } from 'vortex-api';
import { GAME_ID } from './common';
import path from 'path';

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
        await fs.copyAsync(sourceFilePath, path.join(destination, sourceFile), { overwrite: true });
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

export const isJunctionDir = async (filePath: string): Promise<boolean> => {
  try {
    const res: fs.Stats = await fs.lstatAsync(filePath);
    return Promise.resolve(res.isSymbolicLink());
  } catch (err) {
    return Promise.resolve(false);
  }
}

export const createJunction = async (source: string,
                                     destination: string,
                                     backup?: boolean): Promise<void> => {
  if (backup) {
    // merge both the 'my games' and 'main' data folders
    await mergeFolderContents(source, destination, true);

    // make a backup (just in case), timestamped so we dont worry about unique renaming
    await fs.renameAsync(source, `${source}-backup-${Date.now()}`);
  }
  await fs.symlinkAsync(destination, source, 'junction');
  return Promise.resolve();
}

export const removeJunction = async (filePath: string): Promise<void> => {
  if (!isJunctionDir(filePath)) {
    // Nothing here.
    return Promise.resolve();
  }
  await fs.unlinkAsync(filePath);
  const backUp = await getLatestBackupPath(path.dirname(filePath));
  try {
    await fs.statAsync(backUp);
    await fs.renameAsync(backUp, filePath);
  } catch (err) {
    await fs.ensureDirAsync(filePath);
  }
  return Promise.resolve();
}

export const getLatestBackupPath = async (dirPath: string) => {
  // Captures the digits at the end.
  const regexp = /(\d+)$/;
  const directories = await fs.readdirAsync(dirPath);
  const latestBack = directories.reduce((prev, current) => {
    const match = current.match(regexp);
    if (match && match[1] && +match[1] > +prev.match(regexp)[1]) {
      prev = current;
    }
    return prev;
  }, '0');
  return path.join(dirPath, latestBack);
}

export const isStarfield = (context: types.IExtensionContext, gameId: string | string[]) => {
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

export const openPhotoModePath = () => {
  const docPath = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield', 'Photos');
  util.opn(docPath).catch(() => null);
};