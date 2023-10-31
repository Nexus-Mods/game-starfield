/* eslint-disable */
import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { setMigrationVersion } from '../actions/settings';
import { DATA_SUBFOLDERS ,GAME_ID, MOD_TYPE_DATAPATH } from '../common';
import { deploy, nuclearPurge } from '../util';

const DEBUG = false;

// Migrations should be self contained - do not let any errors escape from them.
//  if a migration fails, it should allow the user to fallback to his previous state,
//  or to retry the migration.
export async function migrateExtension(api: types.IExtensionApi) {
  if (DEBUG) debugger;
  const state = api.getState();
  if (selectors.activeGameId(state) !== GAME_ID) {
    return Promise.resolve();
  }

  const infoFile = JSON.parse(await fs.readFileAsync(path.join(__dirname, 'info.json')));
  const currentVersion = infoFile.version;
  if (DEBUG || semver.gt('0.5.0', currentVersion)) {
    await migrate050(api);
  }
  api.store?.dispatch(setMigrationVersion(currentVersion));
}

export async function migrate050(api: types.IExtensionApi) {
  const state = api.getState();
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  try {
    await nuclearPurge(api, GAME_ID);
  } catch (err) {
    api.showErrorNotification('Failed to migrate extension - please re-install all mods', err, { allowReport: false });
    return Promise.resolve();
  }
  const dataPathDirectories = DATA_SUBFOLDERS.map(f => f.toLowerCase());
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const batchedActions = [];
  for (const mod of Object.values(mods)) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files = await fs.readdirAsync(modPath).catch(() => []);
    for (const file of files.map(f => f.toLowerCase())) {
      if (dataPathDirectories.includes(file)) {
        batchedActions.push(actions.setModType(GAME_ID, mod.id, MOD_TYPE_DATAPATH));
        break;
      }
    }
  }
  util.batchDispatch(api.store, batchedActions);

  await deploy(api);
}