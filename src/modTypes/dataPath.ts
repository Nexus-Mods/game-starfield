import path from 'path';
import { selectors, types } from 'vortex-api';

import { getStopPatterns, getTopLevelPatterns } from '../stopPatterns';

export function getDataPath(api: types.IExtensionApi, game: types.IGame) {
  const discovery = selectors.discoveryByGame(api.getState(), game.id);
  if (!discovery || !discovery.path) {
    return '.';
  }
  const dataPath = path.join(discovery.path, 'Data');
  return dataPath;
}

export function testDataPath(instructions: types.IInstruction[]): Promise<boolean> {
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
}