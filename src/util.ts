/* eslint-disable */
import { getFileVersion } from 'exe-version';
import { actions, fs, log, selectors, types, util } from 'vortex-api';
import { ALL_NATIVE_PLUGINS, PLUGINS_TXT, LOCAL_APP_DATA, GAME_ID, MY_GAMES_DATA_WARNING, JUNCTION_NOTIFICATION_ID, PLUGINS_BACKUP, XBOX_APP_X_MANIFEST, PLUGIN_ENABLER_CONSTRAINT, INSTALLING_REQUIREMENTS_NOTIFICATION_ID } from './common';
import turbowalk, { IWalkOptions, IEntry } from 'turbowalk';
import { parseStringPromise } from 'xml2js';
import path from 'path';
import semver from 'semver';
import { getStopPatterns } from './stopPatterns';
import { LoadOrderManagementType } from './types';

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
        await fs.copyAsync(sourceFilePath, path.join(destination, sourceFile), { overwrite: true, noSelfCopy: true });
        continue;
      } else {
        log('debug', 'Did not copy file as it already exists', { source: sourceFilePath, destination: path.join(destination, destinationMatch) })
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
  util.opn(LOCAL_APP_DATA).catch(() => null);
};

export const removePluginsFile = async () => {
  try {
    await fs.removeAsync(PLUGINS_BACKUP).catch(err => null);
    await fs.unlinkAsync(PLUGINS_TXT);
  } catch (err) {
    // File doesn't exist, nothing to do.
  }
}

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
  // We REALLY don't care for hidden or inaccessible files.
  walkOptions = { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true };
  const walkResults: IEntry[] = [];
  return new Promise<IEntry[]>(async (resolve, reject) => {
    await turbowalk(dirPath, (entries: IEntry[]) => {
      walkResults.push(...entries);
      return Promise.resolve() as any;
      // If the directory is missing when we try to walk it; it's most probably down to a collection being
      //  in the process of being installed/removed. We can safely ignore this.
    }, walkOptions).catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err));
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

export async function requiresPluginEnabler(api: types.IExtensionApi): Promise<boolean> {
  try {
    const gameVersion = await getGameVersionAsync(api);
    return (semver.satisfies(semver.coerce(gameVersion).version, PLUGIN_ENABLER_CONSTRAINT));
  } catch (err) {
    // Assume it's required.
    log('error', 'failed to check plugin enabler constraint', err);
    return false;
  }
}

export function getGameVersionSync(api: types.IExtensionApi): string {
  const state = api.getState();
  const gameVersion = util.getSafe(state, ['persistent', 'gameMode', 'versions', GAME_ID], '0.0.0');
  return semver.coerce(gameVersion).raw;
}

export async function getGameVersionAsync(api: types.IExtensionApi): Promise<string> {
  const state = api.getState();
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (!discovery?.path) {
    return Promise.reject(new util.GameNotFound(GAME_ID));
  }
  if (discovery.store === 'xbox') {
    try {
      const appManifest = path.join(discovery.path, XBOX_APP_X_MANIFEST);
      await fs.statAsync(appManifest);
      const data = await fs.readFileAsync(appManifest, { encoding: 'utf8' });
      const parsed = await parseStringPromise(data);
      return Promise.resolve(parsed?.Package?.Identity?.[0]?.$?.Version);
    } catch (err) {
      return Promise.reject(new Error('failed to parse appxmanifest.xml'));
    }
  } else {
    const game = util.getGame(GAME_ID);
    const exePath = path.join(discovery.path, discovery.executable || game.executable());
    try {
      const version = await getFileVersion(exePath);
      return Promise.resolve(version);
    } catch (err) {
      return Promise.reject(new util.NotFound(exePath));
    }
  }
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
  // TODO: Find a better way to control the update notifications!!!
  const notificationIds = ['starfield-junction-activity',
    MY_GAMES_DATA_WARNING, JUNCTION_NOTIFICATION_ID, INSTALLING_REQUIREMENTS_NOTIFICATION_ID,
    'starfield-update-notif-0.5.0', 'starfield-update-notif-0.6.0', 'starfield-update-notif-0.7.0',
    'starfield-update-notif-0.8.0'
  ];
  for (const id of notificationIds) {
    // Can't batch these.
    api.dismissNotification(id);
  }
}

export function sanitizeIni(iniStr: string) {
  // Replace whitespace around equals signs.
  //  Pretty sure the game doesn't care one way or another, but it's nice to be consistent.
  let text = iniStr.replace(/\s=\s/g, '=');
  const escapedQuotes = /\\\"/g;
  if (text.match(escapedQuotes)) {
    // The library has the bad habit of wrapping values with quotation marks entirely,
    //  and escaping the existing quotation marks.
    // We could do some crazy regex here, but it's better to be as simple as possible.
    // Remove all the quotation marks.
    text = text.replace(/\"/g, '');

    // Wherever we have an escape character, it's safe to assume that used to be a quotation
    //  mark so we re-introduce it.
    text = text.replace(/\\/g, '"');
  }
  return text;
}

/**
 * At the time of writing this extension, deepMerge was not exported
 *  as part of the API. We're using a copy of the function here, to ensure
 *  older versions of Vortex (with the 0.6.X extension) can still run the merging
 *  functionality - it should be safe to remove once we confirm everyone migrated to
 *  Vortex 1.9.9+
 */
export function deepMerge(lhs: any, rhs: any): any {
  if (lhs === undefined) {
    return rhs;
  } else if (rhs === undefined) {
    return lhs;
  }

  const result = {};
  for (const key of Object.keys(lhs).concat(Object.keys(rhs))) {
    if ((lhs[key] === undefined) || (rhs[key] === undefined)) {
      result[key] = pick(lhs[key], rhs[key]);
    }

    result[key] = ((typeof(lhs[key]) === 'object') && (typeof(rhs[key]) === 'object'))
      ? result[key] = deepMerge(lhs[key], rhs[key])
      : (Array.isArray(lhs[key]) && Array.isArray(rhs[key]))
        ? result[key] = lhs[key].concat(rhs[key])
        : result[key] = pick(rhs[key], lhs[key]);
  }
  return result;
}

function pick(lhs: any, rhs: any): any {
  return lhs === undefined ? rhs : lhs;
}

export function getMods(api: types.IExtensionApi, modType: string): types.IMod[] {
  const state = api.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return Object.values(mods).filter((mod: types.IMod) => mod.type === modType || mod.type === '') as types.IMod[];
}

export async function findModByFile(api: types.IExtensionApi, modType: string, fileName: string): Promise<types.IMod> {
  const mods = getMods(api, modType);
  const installationPath = selectors.installPathForGame(api.getState(), GAME_ID);
  for (const mod of mods) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files = await walkPath(modPath);
    if (files.find(file => file.filePath.endsWith(fileName))) {
      return mod;
    }
  }
  return undefined;
}

export async function linkAsiLoader(api: types.IExtensionApi, lhs: string, rhs: string): Promise<void> {
  // The asi loader replaces a game assembly - we need to make sure to back up and restore it based on
  //  the deployment events.
  const state = api.getState();
  const pluginEnabler = util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false);
  const profile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID || pluginEnabler === false) {
    return Promise.resolve();
  }
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (discovery?.store !== 'xbox') {
    return Promise.resolve();
  }

  const asiLoaderLhs = path.join(discovery.path, lhs);
  const asiLoaderRhs = path.join(discovery.path, rhs);

  const exists = await fs.statAsync(asiLoaderLhs).then(() => true).catch(() => false);
  if (exists) {
    await fs.linkAsync(asiLoaderLhs, asiLoaderRhs).catch(err => Promise.resolve());
    await fs.unlinkAsync(asiLoaderLhs).catch(err => Promise.resolve());
  }
  return Promise.resolve();
}

export function forceRefresh(api: types.IExtensionApi) {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const action = {
    type: 'SET_FB_FORCE_UPDATE',
    payload: {
      profileId,
    },
  };
  api.store.dispatch(action);
}

export async function serializePluginsFile(plugins: types.ILoadOrderEntry[]): Promise<void> {
  const data = plugins.map(plugin => {
    // Strip the native plugins from whatever we write to the file as it's uneccessary.
    if (ALL_NATIVE_PLUGINS.includes(plugin.name.toLowerCase())) {
      return '';
    }
    const invalid = plugin.data?.isInvalid ? '#' : '';
    const enabled = plugin.enabled ? '*' : '';
    return `${invalid}${enabled}${plugin.name}`
  });
  data.splice(0, 0, '# This file was automatically generated by Vortex. Do not edit this file.');
  await fs.writeFileAsync(PLUGINS_TXT, data.filter(plug => !!plug).join('\n'), { encoding: 'utf8' });
}

export async function deserializePluginsFile(): Promise<string[]> {
  try {
    const targetFile = await fs.statAsync(PLUGINS_BACKUP)
      .then(() => PLUGINS_BACKUP)
      .catch(() => PLUGINS_TXT);
    const data = await fs.readFileAsync(targetFile, 'utf8');
    const lines = data.split('\n').filter(line => line.trim().length > 0);
    return Array.from(new Set(lines));
  } catch (err) {
    return [];
  }
}

export function setPluginManagementEnabled(api: types.IExtensionApi, enabled: boolean) {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  const action = {
    type: 'GAMEBRYO_SET_PLUGIN_MANAGEMENT_ENABLED',
    payload: {
      profileId,
      enabled,
    },
  };
  api.store.dispatch(action);
}

export function getManagementType(api: types.IExtensionApi): LoadOrderManagementType {
  const state = api.store.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  return util.getSafe(state, ['settings', GAME_ID, 'loadOrderManagementType', profileId], 'dnd');
}