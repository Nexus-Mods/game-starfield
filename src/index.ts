/* eslint-disable */

import path from 'path';

import { actions, fs, types, selectors, util } from 'vortex-api';

import { getDataPath, testDataPath } from './modTypes/dataPath';
import { getASIPluginsPath, testASIPluginsPath } from './modTypes/asiMod';

import { testSFSESupported, installSFSE } from './installers/starfield-sfse-installer';
import { testASILoaderSupported, installASILoader, testASIModSupported, installASIMod } from './installers/starfield-asi-installer';

import { mergeASIIni, testASIMergeIni } from './merges/iniMerge';

import { isStarfield, openAppDataPath, openPhotoModePath,
  openSettingsPath, dismissNotifications, linkAsiLoader,
  walkPath, removePluginsFile, forceRefresh } from './util';
import { toggleJunction, setup } from './setup';
import { raiseJunctionDialog, testFolderJunction, testLooseFiles, testDeprecatedFomod, testPluginsEnabler } from './tests';

import { clone, condition, generate, parse, title } from './migrations/collections';

import { settingsReducer } from './reducers/settings';
import Settings from './views/Settings';
import StarfieldData from './views/StarfieldData';

import { getStopPatterns } from './stopPatterns';

import StarFieldLoadOrder from './loadOrder/StarFieldLoadOrder';

import { GAME_ID, SFSE_EXE, MOD_TYPE_DATAPATH, MOD_TYPE_ASI_MOD,
  STEAMAPP_ID, XBOX_ID, TARGET_ASI_LOADER_NAME,
  ASI_LOADER_BACKUP, PLUGINS_TXT, PLUGINS_BACKUP } from './common';

const supportedTools: types.ITool[] = [
  {
    id: 'sfse',
    name: 'Starfield Script Extender',
    executable: () => SFSE_EXE,
    logo: 'sfse.png',
    requiredFiles: [SFSE_EXE],
    shortName: 'SFSE',
    relative: true,
    defaultPrimary: true,
    exclusive: true,
  },
  {
    id: 'bethini-starfield',
    name: 'Bethini Pie',
    executable: () => 'Bethini.exe',
    logo: 'Bethini.ico',
    requiredFiles: ['Bethini.exe'],
  },
  {
    id: 'xedit-sf',
    name: 'SF1Edit',
    executable: () => 'SF1Edit64.exe',
    logo: 'SF1Edit.png',
    requiredFiles: [],
    parameters: [],
  },
];

const gameFinderQuery = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }],
  xbox: [{ id: XBOX_ID }],
};

const removePluginsWrap = (api: types.IExtensionApi) => {
  api.showDialog('question', 'Reset Plugins File', {
    text: 'Are you sure you want to reset the plugins file? This will remove all plugins from your load order, and you will need to re-arrange them!',
  }, [
    { label: 'Cancel' },
    { label: 'Reset', action: () => {
      removePluginsFile()
        .then(() => {
          forceRefresh(api);
        });
    } },
  ], 'starfield-remove-plugins-dialog');
}

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'starfield'], settingsReducer);
  // register a whole game, basic metadata and folder paths
  context.registerGame({
    id: GAME_ID,
    name: 'Starfield',
    mergeMods: true,
    queryArgs: gameFinderQuery,
    queryModPath: () => '.',
    logo: 'gameart.jpg',
    executable: () => 'Starfield.exe',
    requiredFiles: ['Starfield.exe'],
    setup: (discovery) => setup(context.api, discovery) as any,
    supportedTools,
    requiresLauncher: requiresLauncher as any,
    details: {
      supportsSymlinks: false,
      steamAppId: parseInt(STEAMAPP_ID),
      stopPatterns: getStopPatterns(),
    },
  });

  context.registerSettings(
    'Mods',
    Settings,
    () => ({
      t: context.api.translate,
      onSetDirectoryJunction: (enabled: boolean) => {
        if (!enabled) {
          toggleJunction(context.api, enabled);
        } else {
          raiseJunctionDialog(context.api, true);
        }
      },
    }),
    () => selectors.activeGameId(context.api.getState()) === GAME_ID,
    150
  );

  // Bluebird, the bane of my life.
  context.registerTest('starfield-loose-files-check', 'gamemode-activated', () => Promise.resolve(testLooseFiles(context.api)) as any);
  context.registerTest('starfield-deprecated-fomod-check', 'gamemode-activated', () => Promise.resolve(testDeprecatedFomod(context.api)) as any);

  context.registerInstaller('starfield-sfse-installer', 25, testSFSESupported as any, (files) => installSFSE(context.api, files) as any);
  context.registerInstaller('starfield-asi-mod-installer', 20, testASIModSupported as any, (files) => installASIMod(context.api, files) as any);
  context.registerInstaller('starfield-asi-loader-installer', 25, testASILoaderSupported as any, (files) => installASILoader(context.api, files) as any);

  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Settings Folder', openSettingsPath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Application Data Folder', openAppDataPath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('mod-icons', 700, 'open-ext', {}, 'Open Game Photo Mode Folder', openPhotoModePath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('fb-load-order-icons', 150, 'open-ext', {}, 'View Plugins File', openAppDataPath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('fb-load-order-icons', 500, 'remove', {}, 'Reset Plugins File', () => removePluginsWrap(context.api), (gameId?: string[]) => isStarfield(context, gameId));

  context.registerLoadOrder(new StarFieldLoadOrder(context.api));

  context.optional.registerCollectionFeature(
    'starfield_collection_data',
    generate,
    (gameId: string, collection: any) => parse(context.api, gameId, collection),
    (gameId: string, collection: any, from: types.IMod, to: types.IMod) => clone(context.api, gameId, collection, from, to),
    title,
    condition,
    StarfieldData
  );

  context.registerModType(
    MOD_TYPE_DATAPATH,
    10,
    (gameId) => GAME_ID === gameId,
    (game: types.IGame) => getDataPath(context.api, game),
    testDataPath as any,
    { deploymentEssential: true, name: 'Data Folder' }
  );

  context.registerModType(
    MOD_TYPE_ASI_MOD,
    10,
    (gameId) => GAME_ID === gameId,
    (game: types.IGame) => getASIPluginsPath(context.api, game),
    testASIPluginsPath as any,
    { deploymentEssential: true, name: 'ASI Mod' }
  );

  context.registerMerge(testASIMergeIni, mergeASIIni as any, MOD_TYPE_ASI_MOD);

  context.once(() => {
    //context.api.setStylesheet('starfield', path.join(__dirname, 'starfield.scss'));
    context.api.events.on('gamemode-activated', () => onGameModeActivated(context.api));
    context.api.onAsync('will-deploy', (profileId: string, deployment: types.IDeploymentManifest) => onWillDeployEvent(context.api, profileId, deployment));
    context.api.onAsync('did-deploy', (profileId: string, deployment: types.IDeploymentManifest) => onDidDeployEvent(context.api, profileId, deployment));
    context.api.onAsync('will-purge', (profileId: string) => onWillPurgeEvent(context.api, profileId));
    context.api.onAsync('did-purge', (profileId: string) => onDidPurgeEvent(context.api, profileId));
    // context.api.onAsync('intercept-file-changes', (intercepted: types.IFileChange[], cb: (result: types.IFileChange[]) => void) => {
    //   return onInterceptFileChanges(context.api, intercepted, cb);
    // });
  });

  return true;
}

async function onGameModeActivated(api: types.IExtensionApi) {
  const state = api.getState();
  const activeGameId = selectors.activeGameId(state);
  if (activeGameId !== GAME_ID) {
    dismissNotifications(api);
  }
  testPluginsEnabler(api);
  testFolderJunction(api);
  return;
}

async function onDidDeployEvent(api: types.IExtensionApi, profileId: string, deployment: types.IDeploymentManifest): Promise<void> {
  const state = api.getState();
  const gameId = selectors.profileById(state, profileId)?.gameId;
  if (gameId !== GAME_ID) {
    return Promise.resolve();
  }
  await testDeprecatedFomod(api, false);
  await testPluginsEnabler(api);
  await fs.removeAsync(PLUGINS_BACKUP).catch(err => null);
  return Promise.resolve();
}

async function onWillPurgeEvent(api: types.IExtensionApi, profileId: string): Promise<void> {
  return fs.copyAsync(PLUGINS_TXT, PLUGINS_BACKUP, { overwrite: true }).catch(err => null);
}

async function onDidPurgeEvent(api: types.IExtensionApi, profileId: string): Promise<void> {
  return linkAsiLoader(api, ASI_LOADER_BACKUP, TARGET_ASI_LOADER_NAME);
}

async function onWillDeployEvent(api: types.IExtensionApi, profileId: any, deployment: types.IDeploymentManifest): Promise<void> {
  const state = api.getState();
  const pluginEnabler = util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false);
  const profile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID || pluginEnabler === false) {
    return Promise.resolve();
  }
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (!discovery?.path || discovery?.store !== 'xbox') {
    // Game not discovered or not Xbox? bail.
    return Promise.resolve();
  }

  const backupPath = path.join(discovery.path, ASI_LOADER_BACKUP);
  const exists = await fs.statAsync(backupPath).then(() => true).catch(err => false);
  if (!exists) {
    const entries = (await walkPath(discovery.path)).filter((entry) => !entry.isDirectory && path.basename(entry.filePath) === TARGET_ASI_LOADER_NAME);
    const entry = entries.length > 0 ? entries[0] : undefined;
    if (!entry) {
      return Promise.resolve();
    }
    const asiPath = entry.filePath;
    const asiExists = await fs.statAsync(asiPath).then(() => true).catch(err => false);
    if (asiExists) {
      await fs.copyAsync(asiPath, backupPath);
    }
  }
}

// async function onInterceptFileChanges(api: types.IExtensionApi,
//                                       intercepted: types.IFileChange[],
//                                       cb: (result: types.IFileChange[]) => void): Promise<void> {
//   const state = api.getState();
//   const gameId = selectors.activeGameId(state);
//   if (gameId !== GAME_ID) {
//     return Promise.resolve();
//   }
//   cb(intercepted.filter((change) => path.basename(change.filePath) !== TARGET_ASI_LOADER_NAME));
//   return Promise.resolve();
// }

async function requiresLauncher(gamePath: string, store?: string) {
  // If Xbox, we'll launch via Xbox app
  if (store === 'xbox') {
    return Promise.resolve({
      launcher: 'xbox',
      addInfo: {
        appId: XBOX_ID,
        parameters: [{ appExecName: 'Game' }],
      },
    });
  } else {
    return Promise.resolve(undefined);
  }
}

export default main;
