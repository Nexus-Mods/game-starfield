/* eslint-disable */
import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { setMigrationVersion } from '../actions/settings';
import { DATA_SUBFOLDERS, GAME_ID, MOD_TYPE_DATAPATH, NS } from '../common';
import { deploy, nuclearPurge, getExtensionVersion } from '../util';

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

  const currentVersion = util.getSafe(state, ['settings', 'starfield', 'migrationVersion'], '0.0.0');
  const newVersion = await getExtensionVersion();
  if (DEBUG || semver.gt('0.5.0', currentVersion)) {
    await migrate050(api, newVersion);
  }
  api.store?.dispatch(setMigrationVersion(newVersion));
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
  const dataPathDirectories = DATA_SUBFOLDERS.map((f) => f.toLowerCase());
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const batchedActions = [];
  for (const mod of Object.values(mods)) {
    const modPath = path.join(installationPath, mod.installationPath);
    const files = await fs.readdirAsync(modPath).catch(() => []);
    for (const file of files.map((f) => f.toLowerCase())) {
      if (dataPathDirectories.includes(file)) {
        batchedActions.push(actions.setModType(GAME_ID, mod.id, MOD_TYPE_DATAPATH));
        break;
      }
    }
  }
  util.batchDispatch(api.store, batchedActions);
  const notificationId = 'starfield-update-notif-0.5.0';
  await deploy(api);
  const t = api.translate;
  api.sendNotification({
    message: t('Starfield extension has been updated to v{{newVersion}}', { replace: { newVersion: version }, ns: NS }),
    noDismiss: true,
    allowSuppress: false,
    type: 'success',
    id: notificationId,
    actions: [
      {
        title: t('More', { ns: NS }),
        action: () =>
          api.showDialog(
            'success',
            'Starfield extension has been updated',
            {
              bbcode: t(
                'The Starfield extension has been updated to V{{newVersion}}.[br][/br][br][/br]' +
                  'The default FOMOD installer in 0.4 has been replaced in 0.5 due to:[br][/br][br][/br]' +
                  '- Flaws in its logic which could potentially strip out mod files and cause issues in-game.[br][/br]' +
                  '- Limited support for different mod packaging patterns.[br][/br]' +
                  '- Incorrect installation of FOMODs which forced mod authors to provide different installers for different mod managers (MO2/Vortex).[br][/br][br][/br]' +
                  'What to expect:[br][/br][br][/br]' +
                  '- As part of the migration, Vortex purged all mods when the extension was activated and notified if any deprecated FOMOD installs were found which needed automatically fixing.[br][/br]' +
                  '- Mods installed with 0.4 should still function as they previously did. If for any reason you suspect the mod has missing files, simply re-install it and the new installation logic will ensure that the mod is installed correctly.',
                { replace: { newVersion: version }, ns: NS }
              ),
            },
            [
              {
                label: t('Close', { ns: NS }),
                action: () => {
                  api.dismissNotification(notificationId);
                  api.suppressNotification(notificationId);
                },
              },
            ],
            'starfield-update-0.5.0'
          ),
      },
    ],
  });
}
