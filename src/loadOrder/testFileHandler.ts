/* eslint-disable */
// This script intends to cater for sTestFile entries in Starfield's INI files.
//  It will search for an established "Load Order" and attempt to migrate them to the new plugins.txt format.
import path from 'path';
import { fs, selectors, types, util } from 'vortex-api';

import { GAME_ID, SFCUSTOM_INI, SFPREFS_INI } from '../common';

export async function migrateTestFiles(api: types.IExtensionApi): Promise<any> {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve(undefined);
  }
  const myGamesFolder = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  const customPath = path.join(myGamesFolder, SFCUSTOM_INI);
  const prefsPath = path.join(myGamesFolder, SFPREFS_INI);
  const regex = new RegExp('sTestFile.*=(.*)', 'igm');
  const loadOrder = await [customPath, prefsPath].reduce(async (accumP, iniPath) => {
    const accum = await accumP;
    try {
      const fileData = await fs.readFileAsync(iniPath, 'utf8');
      const lines = fileData.split(/\r?\n/);
      for (const line of lines) {
        const match = regex.exec(util.deBOM(line).trim());
        if (match && match.length > 1) {
          const testFile = match[1];
          accum[`${path.basename(iniPath)}`].push(testFile);
        }
      }
      const newData = fileData.replace(regex, '');
      await fs.writeFileAsync(iniPath, newData, { encoding: 'utf8' });
    } catch (err) {
      // nop
    } finally {
      return Promise.resolve(accum);
    }
  }, Promise.resolve({ [`${SFCUSTOM_INI}`]: [], [`${SFPREFS_INI}`]: [], }));
  
  // There may have been test file entries in both files - we're going to assume that the
  //  one with most entries is the "active" one.
  const loadOrderFiles = Object.keys(loadOrder).reduce((prev, key) => {
    const order = loadOrder[key];
    if (order.length > prev.length) {
      return order;
    } else {
      return prev;
    }
  }, []);
  return Array.from(new Set(loadOrderFiles));
}