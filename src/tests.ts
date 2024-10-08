/* eslint-disable */
import path from 'path';
import { GAME_ID, JUNCTION_TEXT, JUNCTION_NOTIFICATION_ID, SFCUSTOM_INI, MOD_TYPE_DATAPATH, MY_GAMES_DATA_WARNING } from './common';
import { PLUGIN_REQUIREMENTS } from './loadOrder/StarFieldLoadOrder';
import { actions, fs, types, log, selectors, util } from 'vortex-api';
import { parse, stringify } from 'ini-comments';

import { isJunctionDir, purge, deploy, migrateMod, sanitizeIni, requiresPluginEnabler } from './util';
import { toggleJunction } from './setup';
import { setDirectoryJunctionSuppress, setDirectoryJunctionEnabled, setPluginsEnabler } from './actions/settings';

export async function testLooseFiles(api: types.IExtensionApi): Promise<types.ITestResult> {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve(undefined);
  }
  let ini;
  const myGamesFolder = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  const iniPath = path.join(myGamesFolder, SFCUSTOM_INI);
  const archiveInvalidationTag = '[ARCHIVE INVALIDATION]';
  const isValid = async () => {
    try {
      // Ensure file is created if it does not exist.
      await fs.statAsync(iniPath).catch(err => fs.ensureFileAsync(iniPath));
      let iniContent = (await fs.readFileAsync(iniPath, 'utf-8')) ?? '';
      ini = parse(iniContent);
      return ini?.Archive?.bInvalidateOlderFiles === '1'
        && ini?.Archive?.sResourceDataDirsFinal === '';
    } catch (err) {
      log('warn', `${archiveInvalidationTag} - INI not setup: ${iniPath}`);
      return false;
    }
  };
  const valid = await isValid();
  return valid
    ? Promise.resolve(undefined)
    : new Promise<types.ITestResult>(async (resolve, reject) => {
      const res: types.ITestResult = {
        description: {
          short: 'StarfieldCustom.ini not configured',
          long: 'Similar to Fallout 4, Starfield requires certain INI tweaks to be set in order to properly load loose files (i.e. those not packed in BA2 archives). There are a lot of mods out there which provide instructions for users to add these tweaks to a "StarfieldCustom.ini" file in the "Documents\\My Games\\Starfield" folder. If Vortex detects that this ini doesn\'t exist or is incorrect, it will notify the user and ask to fix it. If fix is requested, it will add or adjust the "bInvalidateOlderFiles" and "sResourceDataDirsFinal" values without changing any other settings you might\'ve added manually.',
        },
        severity: 'warning',
        automaticFix: ((async () => {
          try {
            // Reload ini in case external changes has happened in the meantime.
            const iniContent = (await fs.readFileAsync(iniPath, 'utf-8')) ?? '';
            ini = parse(iniContent, { retainComments: true });

            log('info', `${archiveInvalidationTag} - Setting up INI: ${iniPath}`, ini);

            // Allow modifying file even if it was flagged read-only.
            await fs.makeFileWritableAsync(iniPath);

            if (!ini.Archive) {
              ini.Archive = {};
            }
            if (!ini.Display) {
              ini.Display = {};
            }

            // Set required settiings on ini object and convert back to writeable string
            ini.Archive.bInvalidateOlderFiles = '1';
            ini.Archive.sResourceDataDirsFinal = '';

            const newIniContent = sanitizeIni(stringify(ini, { retainComments: true, whitespace: true }));
            log('info', `${archiveInvalidationTag} - New INI: \n${newIniContent}`, ini);

            // Save updates to StarfieldCustom.ini and dismiss the notification as it has been resolved.
            await fs.writeFileAsync(iniPath, newIniContent, {
              encoding: 'utf-8'
            });
          } catch (err) {
            log('error', `${archiveInvalidationTag} - Failed fix`, err);
          }
        }) as any),
        onRecheck: ((async () => {
          const valid = await isValid();
          return valid ? resolve(undefined) : resolve(testLooseFiles(api));
        }
        ) as any)
      }
      return res !== undefined ? resolve(res) : resolve(undefined)
    });
}

export async function raiseJunctionDialog(api: types.IExtensionApi, suppress?: boolean): Promise<void> {
  const state = api.getState();
  const suppressed = util.getSafe(state, ['settings', 'suppressDirectoryJunctionTest'], false) || suppress;
  const dismiss = () => {
    api.dismissNotification(JUNCTION_NOTIFICATION_ID);
  };
  const suppressNotif = () => {
    dismiss();
    api.suppressNotification(JUNCTION_NOTIFICATION_ID);
    api.store.dispatch(setDirectoryJunctionSuppress(true));
  };
  const toggle = () => {
    dismiss();
    toggleJunction(api, true);
  };

  const actions = [
    {
      label: 'Never Ask Me Again',
      action: () => {
        suppressNotif();
        hasSuppressedJunctionNotif(api);
      },
    },
    { label: 'Use Junction', action: () => toggle() },
    { label: 'Close', action: () => dismiss(), default: true },
  ].filter((action) => (suppressed ? action.label !== 'Never Ask Me Again' : true));

  api.showDialog(
    'question',
    'Starfield Folder Junction Recommendation',
    {
      bbcode: JUNCTION_TEXT,
    },
    [...actions],
    'starfield-junction-dialog'
  );
}

const hasSuppressedJunctionNotif = (api: types.IExtensionApi) =>
  api.sendNotification({
    message: 'Mods may not load correctly',
    type: 'warning',
    id: MY_GAMES_DATA_WARNING,
    actions: [
      {
        title: 'More',
        action: () =>
          api.showDialog(
            'question',
            'Mods may not load correctly',
            {
              text:
                'Vortex deploys mods to the Data folder in the game\'s installation directory. However, it looks like you have a Data folder ' +
                'in your "Documents/My Games" folder. This will interfere with your modding setup. Please either remove the Data folder in your ' +
                '"Documents/My Games" folder or use Vortex\'s folder junction feature to link the two folders together.',
            },
            [{ label: 'Close', action: () => api.dismissNotification(MY_GAMES_DATA_WARNING) }]
          ),
      },
    ],
  });

export async function testPluginsEnabler(api: types.IExtensionApi): Promise<void> {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve();
  }
  const needsEnabler = await requiresPluginEnabler(api);
  if (!needsEnabler) {
    return Promise.resolve();
  }
  const isModEnabled = (mod: types.IMod) => util.getSafe(profile, ['modState', mod.id, 'enabled'], false);
  const discovery = selectors.discoveryByGame(state, GAME_ID);
  const gameStore = discovery?.store === 'xbox' ? 'xbox' : 'steam';
  const requirements = PLUGIN_REQUIREMENTS[gameStore];
  for (const requirement of requirements) {
    const mod = await requirement.findMod(api);
    if (mod && isModEnabled(mod)) {
      continue;
    } else {
      api.store.dispatch(setPluginsEnabler(false));
      return Promise.resolve();
    }
  }
  return Promise.resolve();
}

export async function testFolderJunction(api: types.IExtensionApi): Promise<void> {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve(undefined);
  }
  const myGamesFolder = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield');
  const dataPath = path.join(myGamesFolder, 'Data');
  const isJunction = await isJunctionDir(dataPath);
  if (isJunction) {
    // Make sure the toggle button is set correctly. (Backwards compatibility?)
    api.store.dispatch(setDirectoryJunctionEnabled(true));
    return Promise.resolve(undefined);
  }

  const suppressed = util.getSafe(state, ['settings', 'starfield', 'suppressDirectoryJunctionTest'], false);
  const dataPathExists = await fs
    .statAsync(dataPath)
    .then(() => true)
    .catch(() => false);
  if (dataPathExists && suppressed) {
    hasSuppressedJunctionNotif(api);
  } else {
    // Not a junction - time to jabber.
    api.sendNotification({
      id: JUNCTION_NOTIFICATION_ID,
      type: 'warning',
      message: 'Folder Junction Recommendation',
      allowSuppress: false,
      noDismiss: true,
      actions: [{ title: 'More', action: () => raiseJunctionDialog(api) }],
    });
  }
}

// Unfortunately our previous installer logic has forced mod authors to branch the destination
//  paths in their fomod installers to cater for either MO2 or Vortex. With the addition of stop
//  patterns this is no longer a problem as Vortex is using the same logic as MO2. The only issue
//  is that any fomods that have been installed using the Vortex plugin option will no longer deploy
//  correctly. This function will detect if the fomod is using the old Vortex plugin option and try
//  to fix it for the user.
export async function testDeprecatedFomod(api: types.IExtensionApi, isApiTest: boolean = true) {
  const state = api.getState();
  const profile: types.IProfile = selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve(undefined);
  }

  const isFomod = (mod: types.IMod) => mod?.attributes?.installerChoices?.type === 'fomod';
  const isDataType = (mod: types.IMod) => mod?.type === MOD_TYPE_DATAPATH;
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const fomods = Object.values(mods).filter((mod) => isFomod(mod) && isDataType(mod));
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  const invalidFomods: types.IMod[] = [];
  for (const fomod of fomods) {
    const fomodPath = path.join(installationPath, fomod.installationPath);
    const content: string[] = await fs.readdirAsync(fomodPath);
    if (content.length === 1 && content[0].toLowerCase() === 'data') {
      invalidFomods.push(fomod);
    }
  }

  return isApiTest ? invalidFomodApiTest(api, invalidFomods, installationPath) : invalidFomodDeployTest(api, invalidFomods, installationPath);
}

const fomodInvalidShortText = (t: types.TFunction, invalidNum: number) => t('Deprecated FOMODs detected ({{num}})', { replace: { num: invalidNum } });

const fomodInvalidLongText = (t: types.TFunction, invalidNum: number) =>
  t(
    'Vortex detected {{num}} FOMODs which are using the deprecated Vortex plugin option. ' +
    'This option is no longer required and will cause the FOMODs to deploy incorrectly. ' +
    'Vortex will attempt to fix the FOMODs for you and it is recommended to inform the mod author to change their configuration file and remove the Vortex flag. ' +
    'Alternatively you can re-install any affected FOMODs manually and select the MO2 plugin option instead.',
    { replace: { num: invalidNum } }
  );

async function invalidFomodApiTest(api: types.IExtensionApi, invalidFomods: types.IMod[], installationPath: string) {
  const t = api.translate;
  return invalidFomods.length === 0
    ? Promise.resolve(undefined)
    : Promise.resolve({
      description: {
        short: fomodInvalidShortText(t, invalidFomods.length),
        long: fomodInvalidLongText(t, invalidFomods.length),
      },
      severity: 'warning',
      automaticFix: async () => fomodFix(api, invalidFomods, installationPath),
    });
}

async function invalidFomodDeployTest(api: types.IExtensionApi, invalidFomods: types.IMod[], installationPath: string) {
  if (invalidFomods.length === 0) {
    return;
  }
  const t = api.translate;
  const onFix = async () => {
    await fomodFix(api, invalidFomods, installationPath);
    api.dismissNotification('invalid-fomods-detected-notif');
  };

  const showDialog = () => {
    return api.showDialog(
      'info',
      'Deprecated FOMODs',
      {
        text: fomodInvalidLongText(t, invalidFomods.length),
      },
      [{ label: 'Fix', action: () => onFix() }]
    );
  };

  api.sendNotification({
    message: fomodInvalidShortText(t, invalidFomods.length),
    type: 'warning',
    allowSuppress: false,
    noDismiss: true,
    id: 'invalid-fomods-detected-notif',
    actions: [
      { title: 'More', action: async () => showDialog() },
      { title: 'Fix', action: async () => onFix() },
    ],
  });
}

async function fomodFix(api: types.IExtensionApi, invalidFomods: types.IMod[], installationPath: string) {
  const batched = [];
  await purge(api);
  try {
    for (const fomod of invalidFomods) {
      const fomodPath = path.join(installationPath, fomod.installationPath);
      await migrateMod(fomodPath);
      batched.push(actions.setModType(GAME_ID, fomod.id, MOD_TYPE_DATAPATH));
    }
    util.batchDispatch(api.store, batched);
  } catch (err) {
    api.showErrorNotification('Failed to fix deprecated fomods - reinstall manually', err, { allowReport: false });
    return Promise.resolve(undefined);
  }
  await deploy(api);
}
