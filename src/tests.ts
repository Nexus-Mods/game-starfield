/* eslint-disable */
import path from 'path';
import { GAME_ID, JUNCTION_TEXT, JUNCTION_NOTIFICATION_ID, SFCUSTOM_INI, MOD_TYPE_DATAPATH } from './common';
import { actions, fs, types, log, selectors, util } from 'vortex-api';
import { parse, stringify } from 'ini-comments';

import { isJunctionDir, purge, deploy } from './util';
import { toggleJunction } from './setup';
import { setDirectoryJunctionSuppress, setDirectoryJunctionEnabled } from './actions/settings';

const sanitize = (iniStr: string) => {
  // Replace whitespace around equals signs.
  //  Pretty sure the game doesn't care one way or another, but it's nice to be consistent.
  let text = iniStr.replace(/\s=\s/g, '=');
  const escapedQuotes = /\\\"/g;
  if (text.match(escapedQuotes)) {
    // The library has the bad habit of wrapping values with quotation marks entirely,
    //  and escaping the existing quotation marks.
    // We could do some crazy regex here, but it's better to be as simple as possible.
    // Remove all the quotation marks.
    text = text.replace(/\"/g, '');

    // Wherever we have an escape character, it's safe to assume that used to be a quotation
    //  mark so we re-introduce it.
    text = text.replace(/\\/g, '"');
  }
  return text;
}

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
      await fs.ensureFileAsync(iniPath);
      let iniContent = (await fs.readFileAsync(iniPath, 'utf-8')) ?? '';
      ini = parse(iniContent);
      return (ini?.Archive?.bInvalidateOlderFiles === '1'
        && ini?.Archive?.sResourceDataDirsFinal === ''
        && ini?.Display?.sPhotoModeFolder !== undefined);
    } catch (err) {
      log('warn', `${archiveInvalidationTag} - INI not setup: ${iniPath}`);
      return false;
    }
  }
  const valid = await isValid();
  return valid ? Promise.resolve(undefined) : Promise.resolve({
    description: {
      short: 'StarfieldCustom.ini not configured',
      long: 'Similar to Fallout 4, Starfield requires certain INI tweaks to be set in order to properly load loose files (i.e. those not packed in BA2 archives). There are a lot of mods out there which provide instructions for users to add these tweaks to a "StarfieldCustom.ini" file in the "Documents\\My Games\\Starfield" folder. If Vortex detects that this ini doesn\'t exist or is incorrect, it will notify the user and ask to fix it. If fix is requested, it will add or adjust the "bInvalidateOlderFiles" and "sResourceDataDirsFinal" values without changing any other settings you might\'ve added manually. Additionally, Vortex will apply a tweak to re-route your Photo Mode captures to Data\\Textures\\Photos (unless you\'ve already set it to something else) and there is now a button inside Vortex to quickly open this folder.'

    },
    severity: 'warning',
    automaticFix: async () => {
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
        if (ini.Display?.sPhotoModeFolder === undefined) {
          ini.Display.sPhotoModeFolder = 'Photos';
        }
        const newIniContent = sanitize(stringify(ini, { retainComments: true, whitespace: true }));
        log('info', `${archiveInvalidationTag} - New INI: \n${newIniContent}`, ini);

        // Save updates to StarfieldCustom.ini and dismiss the notification as it has been resolved.
        await fs.writeFileAsync(iniPath, newIniContent, {
          encoding: 'utf-8'
        });
      } catch (err) {
        log('error', `${archiveInvalidationTag} - Failed fix`, err);
      }
    },
    onRecheck: async () => {
      const valid = await isValid();
      return valid ? Promise.resolve(undefined) : Promise.resolve(testLooseFiles(api));
    }
  });
}

export async function raiseJunctionDialog(api: types.IExtensionApi, suppress?: boolean): Promise<void> {
  const state = api.getState();
  const suppressed = util.getSafe(state, ['settings', 'suppressDirectoryJunctionTest'], false) || suppress;
  const dismiss = () => {
    api.dismissNotification(JUNCTION_NOTIFICATION_ID);
  }
  const suppressNotif = () => {
    dismiss();
    api.suppressNotification(JUNCTION_NOTIFICATION_ID);
    api.store.dispatch(setDirectoryJunctionSuppress(true));
  }
  const toggle = () => {
    dismiss();
    toggleJunction(api, true);
  }

  const actions = [
    { label: 'Never Ask Me Again', action: () => suppressNotif() },
    { label: 'Use Junction', action: () => toggle() },
    { label: 'Close', action: () => dismiss(), default: true },
  ].filter((action) => suppressed ? action.label !== 'Never Ask Me Again' : true);

  api.showDialog('question', 'Starfield Folder Junction Recommendation', {
    bbcode: JUNCTION_TEXT,
  }, [...actions], 'starfield-junction-dialog');
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

  // Not a junction - time to jabber.
  api.sendNotification({
    id: JUNCTION_NOTIFICATION_ID,
    type: 'warning',
    message: 'Folder Junction Recommendation',
    allowSuppress: false,
    noDismiss: true,
    actions: [
      { title: 'More', action: () => raiseJunctionDialog(api) },
    ],
  });
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
  const fomods = Object.values(mods).filter(mod => isFomod(mod) && isDataType(mod));
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  const invalidFomods: types.IMod[] = [];
  for (const fomod of fomods) {
    const fomodPath = path.join(installationPath, fomod.installationPath);
    const content: string[] = await fs.readdirAsync(fomodPath);
    if (content.length === 1 && content[0].toLowerCase() === 'data') {
      invalidFomods.push(fomod);
    }
  }

  return isApiTest
    ? invalidFomodApiTest(api, invalidFomods, installationPath)
    : invalidFomodDeployTest(api, invalidFomods, installationPath);
}

const fomodInvalidShortText = (t: types.TFunction, invalidNum: number) =>
  t('Deprecated fomods detected ({{num}})', { replace: { num: invalidNum } });

const fomodInvalidLongText = (t: types.TFunction, invalidNum: number) =>
  t('Vortex detected {{num}} fomods which are using the deprecated '
    + 'Vortex plugin option. This option is no longer required and will cause '
    + 'the fomod to deploy incorrectly. Vortex will attempt to fix the fomods '
    + 'for you, and it is recommended to inform the mod author to change his '
    + 'module configuration file and remove the vortex flag. Alternatively you '
    + 'can re-install any affected fomods manually and select the MO2 plugin '
    + 'option instead.', { replace: { num: invalidNum } });

async function invalidFomodApiTest(api: types.IExtensionApi, invalidFomods: types.IMod[], installationPath: string) {
  const t = api.translate;
  return (invalidFomods.length === 0) ? Promise.resolve(undefined) : Promise.resolve({
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
  }

  const showDialog = () => {
    return api.showDialog('info', 'Deprecated Fomods', {
      text: fomodInvalidLongText(t, invalidFomods.length),
    }, [{ label: 'Fix', action: () => onFix() }],
  )};

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
  })
}

async function fomodFix(api: types.IExtensionApi, invalidFomods: types.IMod[], installationPath: string) {
  const batched = [];
  await purge(api);
  try {
    for (const fomod of invalidFomods) {
      const fomodPath = path.join(installationPath, fomod.installationPath);
      await migrateFomod(fomodPath);
      batched.push(actions.setModType(GAME_ID, fomod.id, MOD_TYPE_DATAPATH));
    }
    util.batchDispatch(api.store, batched);
  } catch (err) {
    api.showErrorNotification('Failed to fix deprecated fomods - reinstall manually', err, { allowReport: false });
    return Promise.resolve(undefined)
  }
  await deploy(api);
}

async function migrateFomod(fomodPath: string) {
  const dataPath = path.join(fomodPath, 'Data');
  const files = await fs.readdirAsync(dataPath);
  for (const file of files) {
    const src = path.join(dataPath, file);
    const dest = path.join(fomodPath, file);
    await fs.moveAsync(src, dest, { overwrite: true });
  }
  await fs.rmdirAsync(dataPath);
}