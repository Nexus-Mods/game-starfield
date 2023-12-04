/* eslint-disable */
import path from 'path';
import { types, selectors } from 'vortex-api';
import { testSFSESupported, installSFSE } from './installers/starfield-sfse-installer';
import { isStarfield, openAppDataPath, openPhotoModePath, openSettingsPath, dismissNotifications } from './util';
import { toggleJunction, setup } from './setup';
import { raiseJunctionDialog, testFolderJunction, testLooseFiles, testDeprecatedFomod } from './tests';

import { clone, condition, generate, parse, title } from './migrations/collections';

import { settingsReducer } from './reducers/settings';
import Settings from './views/Settings';
import StarfieldData from './views/StarfieldData';

import { getStopPatterns, getTopLevelPatterns } from './stopPatterns';

// IDs for different stores and nexus
import { GAME_ID, SFSE_EXE, MOD_TYPE_DATAPATH, STEAMAPP_ID, XBOX_ID, JUNCTION_NOTIFICATION_ID } from './common';

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

  context.registerSettings('Mods', Settings, () => ({
    t: context.api.translate,
    onSetDirectoryJunction: (enabled: boolean) => {
      if (!enabled) {
        toggleJunction(context.api, enabled);
      } else {
        raiseJunctionDialog(context.api, true);
      }
    }
  }), () => selectors.activeGameId(context.api.getState()) === GAME_ID, 150);

  // Bluebird, the bane of my life.
  context.registerTest('starfield-loose-files-check', 'gamemode-activated', () => Promise.resolve(testLooseFiles(context.api)) as any);
  context.registerTest('starfield-deprecated-fomod-check', 'gamemode-activated', () => Promise.resolve(testDeprecatedFomod(context.api)) as any);

  context.registerInstaller('starfield-sfse-installer', 25, testSFSESupported as any, (files) => installSFSE(context.api, files) as any);

  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Settings Folder', openSettingsPath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Application Data Folder', openAppDataPath, (gameId?: string[]) => isStarfield(context, gameId));
  context.registerAction('mod-icons', 700, 'open-ext', {}, 'Open Game Photo Mode Folder', openPhotoModePath, (gameId?: string[]) => isStarfield(context, gameId));

  context.optional.registerCollectionFeature('starfield_collection_data',
    generate,
    (gameId: string, collection: any) => parse(context.api, gameId, collection),
    (gameId: string, collection: any, from: types.IMod, to: types.IMod) => clone(context.api, gameId, collection, from, to),
    title,
    condition,
    StarfieldData);

  context.registerModType(MOD_TYPE_DATAPATH, 10,
    (gameId) => GAME_ID === gameId,
    (game: types.IGame) => {
      const discovery = selectors.discoveryByGame(context.api.getState(), game.id);
      if (!discovery || !discovery.path) {
        return '.';
      }
      const dataPath = path.join(discovery.path, 'Data');
      return dataPath;
    }, (instructions: types.IInstruction[]) => {
      // We want to sort the instructions so that the longest paths are first
      //  this will make the modType recognition faster.
      const sorted = instructions
        .filter(inst => inst.type === 'copy')
        .sort((a, b) => b.destination.length - a.destination.length);
      const dataLevelPatterns = getStopPatterns(true);
      const topLevelPatterns = getTopLevelPatterns(true);
      const runThroughPatterns = (patterns: string[]) => {
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            for (const inst of sorted) {
              const normal = inst.destination.replace(/\\/g, '/');
              if (regex.test(normal)) {
                return true;
              }
            }
          }
        return false;
      };
      const isDataLevel = () => runThroughPatterns(dataLevelPatterns);
      const isTopLevel = () => runThroughPatterns(topLevelPatterns);
      // Make sure the instructions aren't data level first
      const supported = isDataLevel() ? true : isTopLevel() ? false : true;
      return Promise.resolve(supported) as any;
    },
    { deploymentEssential: true, name: 'Data Folder' });

  context.once(() => {
    context.api.events.on('gamemode-activated', () => onGameModeActivated(context.api));
    context.api.onAsync('did-deploy', (profileId, deployment: types.IDeploymentManifest) => onDidDeployEvent(context.api, profileId, deployment));
  });

  return true;
}

async function onGameModeActivated(api: types.IExtensionApi) {
  const state = api.getState();
  const activeGameId = selectors.activeGameId(state);
  if (activeGameId !== GAME_ID) {
    dismissNotifications(api);
  }
  testFolderJunction(api);
  return;
}

async function onDidDeployEvent(api: types.IExtensionApi, profileId: string, deployment: types.IDeploymentManifest) {
  const state = api.getState();
  const gameId = selectors.profileById(state, profileId)?.gameId;
  if (gameId !== GAME_ID) {
    return Promise.resolve();
  }
  await testDeprecatedFomod(api, false);
  return Promise.resolve();
}

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
