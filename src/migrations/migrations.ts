/* eslint-disable */
import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { setMigrationVersion } from '../actions/settings';
import { DATA_SUBFOLDERS ,GAME_ID, MOD_TYPE_DATAPATH, NS } from '../common';
import { deploy, nuclearPurge } from '../util';

const DEBUG = true;

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
    await migrate050(api, currentVersion);
  }
  api.store?.dispatch(setMigrationVersion(currentVersion));
}

export async function migrate050(api: types.IExtensionApi, version: string) {
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
  const t = api.translate;
  api.sendNotification({
    message: t('Starfield extension has been updated to V{{newVersion}}', { replace: { newVersion: version }, ns: NS }),
    noDismiss: true,
    allowSuppress: false,
    type: 'success',
    id: 'starfield-update-notif-0.5.0',
    actions: [
      {
        title: t('More', { ns: NS }),
        action: () => api.showDialog('success', 'Starfield Extension Update', {
          bbcode: t('The Starfield extension has been updated to V{{newVersion}}.[br][/br][br][/br]'
                  + 'The default installer in 0.4.X has been deprecated in 0.5.X due to:[br][/br][br][/br]'
                  + '- Flaws in its logic which could potentially strip out mod files, causing issues in-game.[br][/br]'
                  + '- Limited support for different mod packaging patterns.[br][/br]'
                  + '- Incorrect installation of FOMODs requiring mod authors to cater for different mod managers separately (MO2/Vortex)[br][/br][br][/br]'
                  + 'What to expect:[br][/br][br][/br]'
                  + '- As part of the migration, Vortex will purge all your mods as soon as Starfield is activated and will run checks to ensure your existing mods deploy correctly.[br][/br]'
                  + '- Mods installed with 0.4.X should still function as they previously did. If for any reason you suspect the mod has missing files, simply re-install it and the new installation logic will ensure that the mod is installed correctly.', { replace: { newVersion: version }, ns: NS }),
        }, [
          {
            label: t('Close', { ns: NS }),
            action: () => {
              api.dismissNotification('starfield-update-notif-0.5.0');
              api.suppressNotification('starfield-update-notif-0.5.0');
            }
          }
        ], 'starfield-update-0.5.0')
      }
    ],
  });
}