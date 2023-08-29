import path from "path";
import {
  actions,
  fs,
  log,
  selectors,
  types,
  util,
} from "vortex-api";
import * as VortexUtils from "./VortexUtils";
import { IProps } from "./types";

// IDs for different stores and nexus
import { GAME_ID, STEAMAPP_ID, XBOX_ID } from './common';


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
    requiresLauncher: requiresLauncher,
  });

  context.once(() => {
    //
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