/* eslint-disable */
import { fs, types, selectors, util } from 'vortex-api';
import { isJunctionDir, createJunction, removeJunction } from './util';
import path from 'path';

import { setDirectoryJunctionEnabled } from './actions/settings';
import { GAME_ID, MY_GAMES_DATA_WARNING } from './common';
import { IJunctionProps } from './types';

import { migrateExtension } from './migrations/migrations';

// This code executes when the user first manages Starfield AND each time they swap from another game to Starfield. 
export async function setup(api: types.IExtensionApi,
                            discovery: types.IDiscoveryResult): Promise<void> {
  if (!discovery || !discovery.path) return;
  const gameDataFolder = path.join(discovery.path, 'Data');
  // Build the Starfield path in My Games
  const myGamesFolder = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  const myGamesData = path.join(myGamesFolder, 'Data');
  // If the user has pointed Vortex to the MY Documents folder, we should abort!
  if (myGamesData.toLowerCase() === gameDataFolder.toLowerCase()) {
    throw new Error('Starfield is not detected correctly, please update the location of the game in the "Games" tab. It must point to the folder where the game is installed and not the My Documents folder.');
  }
  // Make sure the folder exists
  await fs.ensureDirWritableAsync(myGamesFolder);
  await fs.ensureDirWritableAsync(path.join(discovery.path, 'Plugins'));
  await migrateExtension(api);
}

export async function toggleJunction(api: types.IExtensionApi, enable: boolean): Promise<void> {
  api.sendNotification({
    type: 'activity',
    id: 'starfield-junction-activity',
    message: enable ? 'Creating Junction' : 'Removing Junction',
    allowSuppress: false,
    noDismiss: true,
    progress: 0,
  });
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve();
  }
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  if (!discovery || !discovery.path) {
    return Promise.reject(new util.SetupError('Starfield is not discovered'));
  }

  const gameDataFolder = path.join(discovery.path, 'Data');
  const myGamesFolder = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  const myGamesData = path.join(myGamesFolder, 'Data');

  const props: IJunctionProps = { api, discovery, profile, state,
    gameDataFolder, myGamesData, myGamesFolder };
  const func = enable ? enableJunction : disableJunction;
  await func(props);
  api.dismissNotification('starfield-junction-activity');
  api.dismissNotification(MY_GAMES_DATA_WARNING);
  return Promise.resolve();
}

async function disableJunction(props: IJunctionProps): Promise<void> {
  const { api, myGamesData } = props;
  try {
    await removeJunction(myGamesData);
    api.store.dispatch(setDirectoryJunctionEnabled(false));
  } catch (err) {
    api.showErrorNotification('Failed to disable directory junction', err);
    return Promise.resolve();
  }
}

async function enableJunction(props: IJunctionProps): Promise<void> {
  const { api, myGamesData, gameDataFolder } = props;
  try {
    const isJunction = await isJunctionDir(myGamesData);
    if (!isJunction) {
      api.sendNotification({
        type: 'activity',
        id: 'starfield-junction-activity',
        message: 'Merging Mod Directories',
        allowSuppress: false,
        noDismiss: true,
        progress: 50,
      });
      const needsBackup = await fs.statAsync(myGamesData).then(() => true).catch(err => false);
      await createJunction(myGamesData, gameDataFolder, needsBackup);
    }
    api.store.dispatch(setDirectoryJunctionEnabled(true));
  } catch (err) {
    api.showErrorNotification('Failed to enable directory junction', err);
    return Promise.resolve();
  }
}