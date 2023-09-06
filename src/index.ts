import { types } from "vortex-api";
import { testSupported, install } from './installers/starfield-default-installer';

// IDs for different stores and nexus
import { GAME_ID, SFSE_EXE, STEAMAPP_ID, XBOX_ID } from './common';

const supportedTools: types.ITool[] = [
  {
    id: 'sfse',
    name: 'Starfield Script Extender',
    executable: () => SFSE_EXE,
    logo: 'sfse.png',
    requiredFiles: [
      SFSE_EXE
    ],
    shortName: 'SFSE',
    relative: true,
    defaultPrimary: true,
    exclusive: true,
  }
]


const gameFinderQuery = {
  steam: [ { id: STEAMAPP_ID, prefer: 0 } ],
  xbox: [ { id: XBOX_ID } ],
}

function main(context: types.IExtensionContext) {

  // register a whole game, basic metadata and folder paths
  context.registerGame({
    id: GAME_ID,
    name: "Starfield",
    mergeMods: true,
    queryArgs: gameFinderQuery,
    queryModPath: () => '.',
    logo: 'gameart.jpg',
    executable: () => 'Starfield.exe',
    requiredFiles: [
      'Starfield.exe',
    ],
    supportedTools,
    requiresLauncher: requiresLauncher,
    details: {
      supportsSymlinks: false,
      steamAppId: parseInt(STEAMAPP_ID)
    }
  });
  const getSFDocPath = (game) => {
    const winapi = require('winapi-bindings');
    var docPath = winapi.RegGetValue('HKEY_CURRENT_USER','Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders','Personal');
        return docPath.value+'\\My Games\\Starfield';
  };
  
  context.registerInstaller('starfield-default-installer', 25, testSupported, install);
  context.registerModType('Starfield Data Mod', 25, (gameId) => gameId === GAME_ID, getSFDocPath, testData);

  context.once(() => {
    //
  });

  return true;
}

function testData(instructions) {
    return Promise.resolve(instructions.find(instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('Data')) !== undefined);
}

async function requiresLauncher(gamePath: string, store?: string) {

  // If Xbox, we'll launch via Xbox app
  if (store === 'xbox') {
    return Promise.resolve({
      launcher: 'xbox',
      addInfo: {
        appId: XBOX_ID,
        parameters: [
          { appExecName: 'Game' }
        ]
      }
    });
  } else {
    return Promise.resolve(undefined);
  }
}

export default main;
