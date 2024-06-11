/* eslint-disable */
import path from 'path';
import semver from 'semver';
import { actions, fs, selectors, types, util } from 'vortex-api';
import { setMigrationVersion, setPluginsEnabler } from '../actions/settings';
import { DATA_SUBFOLDERS, GAME_ID, MOD_TYPE_DATAPATH, NS, PLUGIN_ENABLER_CONSTRAINT } from '../common';
import { deploy, nuclearPurge, getExtensionVersion, requiresPluginEnabler } from '../util';

// Migrations should be self contained - do not let any errors escape from them.
//  if a migration fails, it should allow the user to fallback to his previous state,
//  or to retry the migration.
export async function migrateExtension(api: types.IExtensionApi) {
  const state = api.getState();
  if (selectors.activeGameId(state) !== GAME_ID) {
    return Promise.resolve();
  }

  const currentVersion = util.getSafe(state, ['settings', 'starfield', 'migrationVersion'], '0.0.0');
  const newVersion = await getExtensionVersion();
  if (semver.gt('0.7.0', currentVersion)) {
    await migrate070(api, newVersion);
  } else if (semver.gt('0.6.0', currentVersion)) {
    await migrate060(api, newVersion);
  } else if (semver.gt('0.5.0', currentVersion)) {
    await migrate050(api, newVersion);
  }

  api.store?.dispatch(setMigrationVersion(newVersion));
}

export async function migrate070(api: types.IExtensionApi, version: string) {
  const enablePlugins = await requiresPluginEnabler(api);
  if (!enablePlugins) {
    api.store.dispatch(setPluginsEnabler(false));
  }

  const notificationId = 'starfield-update-notif-0.7.0';
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
        action: () => api.showDialog('success', 'Starfield Extension Update v{{newVersion}}', {
          parameters: {
            newVersion: version
          },
          bbcode: t('As of version "{{cutoff}}" of the game, the plugin enabler is no longer required as the game '
                  + 'now fully supports plugins on its own. If your game crashes, please disable "SFSE" or the "ASI Loader"'
                  + 'mods and wait for them to be updated.', { replace: { cutoff: PLUGIN_ENABLER_CONSTRAINT.slice(1) } }),
        }, [
          {
            label: t('Close', { ns: NS }),
            action: () => {
              api.dismissNotification(notificationId);
              api.suppressNotification(notificationId, true);
            }
          }
        ], 'starfield-update-0.7.0')
      }
    ],
  });
}

export async function migrate060(api: types.IExtensionApi, version: string) {
  const notificationId = 'starfield-update-notif-0.6.0';
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
        action: () => api.showDialog('success', 'Starfield Extension Update v{{newVersion}}', {
          parameters: {
            newVersion: version
          },
          bbcode: t('An interim load ordering solution for Starfield has been added in 0.6.X while we wait for official mod support.[br][/br][br][/br]'
                  + 'What to expect:[br][/br][br][/br]'
                  + '- By default Vortex will not touch your "sTestFileX=" configuration or plugins.txt file.[br][/br]'
                  + '- To use Vortex\'s load ordering solution, please go to the "Load Order" page, and click the "Enable" button.[br][/br]'
                  + '- Once enabled, Vortex will download the appropriate plugins.txt file enabler alongside SFSE or the ASI Loader, depending on the game store used for your copy of Starfield.[br][/br]'
                  + '- Any "sTestFileX=" entries will be migrated and removed from your INI files if discovered (they conflict with the plugins.txt file).[br][/br]'
                  + '- You can stop managing the load order through Vortex at any time by going to Settings -> Mods and disable the "Manage Load Order" toggle.[br][/br]'
                  + '- For more information including how to view the plugins.txt file, please refer to the load order page'),
        }, [
          {
            label: t('Close', { ns: NS }),
            action: () => {
              api.dismissNotification(notificationId);
              api.suppressNotification(notificationId, true);
            }
          }
        ], 'starfield-update-0.6.0')
      }
    ],
  });
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
