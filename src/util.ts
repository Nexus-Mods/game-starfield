/* eslint-disable */
import { fs, log, selectors, types, util } from 'vortex-api';
import { GAME_ID, MY_GAMES_DATA_WARNING, JUNCTION_NOTIFICATION_ID } from './common';
import turbowalk, { IWalkOptions, IEntry } from 'turbowalk';
import path from 'path';
import { getStopPatterns } from './stopPatterns';

export async function mergeFolderContents(source: string, destination: string, overwrite = false): Promise<void> {
  log('debug', 'Merging folders', { source, destination, overwrite });
  // Copy all the files and folders that are inside one folder to another. 
  await fs.ensureDirWritableAsync(destination);

  // Can't read the source folder? Nothing to do.
  const sourceDir = await fs.readdirAsync(source).catch(err => Promise.resolve([]));
  const destinationDir = await fs.readdirAsync(destination);

  for (const sourceFile of sourceDir) {
    const sourceFilePath = path.join(source, sourceFile);
    const stats: fs.Stats = await fs.statAsync(sourceFilePath).catch(err => Promise.resolve(undefined));
    if (!stats) {
      // This shouldn't happen, but if it does, we can't do anything about it.
      log('warn', 'Could not stat file', sourceFilePath);
      continue;
    }
    // Check if there's an indentical folder/file in the dest already.
    const destinationMatch = destinationDir.find(f => f.toLowerCase() === sourceFile.toLowerCase());

    if (stats.isDirectory()) {
      // Is there already a subfolder? If so, we need to merge the contents
      if (destinationMatch !== undefined) {
        await mergeFolderContents(sourceFilePath, path.join(destination, destinationMatch), overwrite);
      } else {
        await fs.copyAsync(sourceFilePath, path.join(destination, sourceFile), { overwrite: true });
      }
      continue;
    } else if (stats.isFile()) {
      // If the file doesn't exist, merge it over. 
      if (!destinationMatch || overwrite) {
        await fs.copyAsync(sourceFilePath, path.join(destination, destinationMatch), { overwrite: true, noSelfCopy: true });
        continue;
      } else {
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
  // Make sure the parent folder exists before attempting to create the junction.
  //  Plenty of reasons why this might be missing at this stage, lets just make sure.
  await fs.ensureDirWritableAsync(path.dirname(source));
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
    //await fs.ensureDirAsync(filePath);
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

export async function purge(api: types.IExtensionApi): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    api.events.emit('purge-mods', true, (err) => err ? reject(err) : resolve()));
}

export async function deploy(api: types.IExtensionApi): Promise<void> {
  return new Promise<void>((resolve, reject) =>
    api.events.emit('deploy-mods', (err) => err ? reject(err) : resolve()));
}

export async function walkPath(dirPath: string, walkOptions?: IWalkOptions): Promise<IEntry[]> {
  walkOptions = walkOptions || { skipLinks: true, skipHidden: true, skipInaccessible: true };
  const walkResults: IEntry[] = [];
  return new Promise<IEntry[]>(async (resolve, reject) => {
    await turbowalk(dirPath, (entries: IEntry[]) => {
      walkResults.push(...entries);
      return Promise.resolve() as any;
    }, walkOptions);
    return resolve(walkResults);
  });
}

// Only use this option as part of a migration if/when we need to change our installers or mod paths.
//  The intented effect is to avoid the external changes dialog for users who have already deployed mods
//  using the old pathing. This call will be expensive as it will pull the manifests of all existing modTypes.
export async function nuclearPurge(api: types.IExtensionApi, gameId: string): Promise<void> {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== gameId) {
    return Promise.resolve();
  }

  // The game path should've stayed the same.
  const discovery = selectors.discoveryByGame(state, gameId);
  if (!discovery?.path) {
    return Promise.resolve();
  }
  const gamePath = discovery.path;
  const manifestRegexp = /^vortex.deployment.*json$/i;
  // Get all the manifests for all modTypes for this game. We can't rely
  //  on our store selectors as the modPaths may have changed.
  const entries: IEntry[] = await walkPath(gamePath);
  const manifests: { [filePath: string] : types.IDeploymentManifest } = await entries.reduce(async (accumP, m) => {
    const accum = await accumP;
    if (manifestRegexp.test(path.basename(m.filePath))) {
      accum[m.filePath] = JSON.parse(await fs.readFileAsync(m.filePath));
    }
    return accum;
  }, {});
  for (const filePath of Object.keys(manifests)) {
    const manifest = manifests[filePath];
    await purgeDeployedFiles(manifest.targetPath, manifest.files);
    await fs.removeAsync(filePath);
  }
}

export async function purgeDeployedFiles(basePath: string,
                                         files: types.IDeployedFile[]): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(basePath, file.relPath);
    // Timestamp differences of more than a second are considered a manual change. (probably the user, don't delete)
    await fs.statAsync(fullPath).then(stats => ((stats.mtime.getTime() - file.time) < 1000) ? fs.unlinkAsync(fullPath) : Promise.resolve())
                                .catch(err => err.code !== 'ENOENT' ? Promise.reject(err) : Promise.resolve());
  }
  return Promise.resolve();
}

export async function getExtensionVersion() {
  const infoFile = JSON.parse(await fs.readFileAsync(path.join(__dirname, 'info.json')));
  return infoFile.version;
}

export async function migrateMod(modPath: string): Promise<void> {
  const dataPath = path.join(modPath, 'Data');
  const files = await fs.readdirAsync(dataPath);
  for (const file of files) {
    const src = path.join(dataPath, file);
    const dest = path.join(modPath, file);
    await fs.moveAsync(src, dest, { overwrite: true });
  }
  await fs.rmdirAsync(dataPath);
  return Promise.resolve();
}

export async function doesModRequireMigration(modPath: string): Promise<boolean> {
  const dataPath = path.join(modPath, 'Data');
  return isDataPathMod(dataPath);
}

export async function isDataPathMod(modPath: string): Promise<boolean> {
  const files = await fs.readdirAsync(modPath).catch(() => []);
  if (files.length === 0) {
    return Promise.resolve(false);
  }
  const stopPatterns = getStopPatterns();
  for (const patt of stopPatterns) {
    const regex = new RegExp(patt, 'i');
    const match = files.find(f => regex.test(f));
    if (match !== undefined) {
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(false);
}

export function dismissNotifications(api: types.IExtensionApi) {
  const notificationIds = ['starfield-junction-activity',
    MY_GAMES_DATA_WARNING, JUNCTION_NOTIFICATION_ID, 'starfield-update-notif-0.5.0'];
  for (const id of notificationIds) {
    api.dismissNotification(id);
  }
}