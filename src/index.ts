/* eslint-disable */
import path from 'path';
import { types, selectors } from 'vortex-api';
import { testSupported, install } from './installers/starfield-default-installer';
import { testSFSESupported, installSFSE } from './installers/starfield-sfse-installer';
import { isStarfield, openAppDataPath, openPhotoModePath, openSettingsPath } from './util';
import { toggleJunction, setup } from './setup';
import { raiseJunctionDialog, testFolderJunction, testLooseFiles } from './tests';

import { settingsReducer } from './reducers/settings';
import Settings from './views/Settings';

import { getStopPatterns, getTopLevelPatterns } from './stopPatterns';

// IDs for different stores and nexus
import { GAME_ID, SFSE_EXE, STEAMAPP_ID, XBOX_ID } from './common';

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
    name: 'SFEdit',
    executable: () => 'xEdit.exe',
    logo: 'tes5edit.png',
    requiredFiles: [],
    parameters: ['-sf1', '-view'],
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
  context.registerInstaller('starfield-sfse-installer', 25, testSFSESupported as any, (files) => installSFSE(context.api, files) as any);
  // context.registerInstaller('starfield-default-installer', 25, testSupported as any, (files) => install(context.api, files) as any);

  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Settings Folder', openSettingsPath, (gameId?: string[]) => isStarfield(context, gameId));

  context.registerAction('mod-icons', 500, 'open-ext', {}, 'Open Game Application Data Folder', openAppDataPath, (gameId?: string[]) => isStarfield(context, gameId));

  context.registerAction('mod-icons', 700, 'open-ext', {}, 'Open Game Photo Mode Folder', openPhotoModePath, (gameId?: string[]) => isStarfield(context, gameId));

  context.registerModType('starfield-data-folder', 1,
    (gameId) => selectors.activeGameId(context.api.getState()) === gameId,
    (game: types.IGame) => {
      const discovery = selectors.discoveryByGame(context.api.getState(), game.id);
      if (!discovery || !discovery.path) {
        return '.';
      }
      const dataPath = path.join(discovery.path, 'Data');
      return dataPath;
    }, (instructions: types.IInstruction[]) => {
      const topLevelPatterns = getTopLevelPatterns();
      const isTopLevel = (inst: types.IInstruction) => {
        for (const pattern of topLevelPatterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(inst.destination)) {
            return true;
          }
        }
        return false;
      };
      const supported: boolean = instructions.reduce((prev, inst) => {
        if (!prev) {
          return prev;
        }
        if (inst.type === 'copy' && (isTopLevel(inst))) {
          prev = false;
        }
        return prev;
      }, true);
      return Promise.resolve(supported) as any;
    },
    { deploymentEssential: true, name: 'Data Folder' });

  context.once(() => {
    context.api.events.on('gamemode-activated', () => testFolderJunction(context.api));
  });

  return true;
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
