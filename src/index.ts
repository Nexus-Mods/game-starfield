import { log, types, util, fs } from "vortex-api";
import { testSupported, install } from './installers/starfield-default-installer';

import { parse, stringify } from 'ini';
import path from 'path';

// IDs for different stores and nexus
import { GAME_ID, SFSE_EXE, STEAMAPP_ID, XBOX_ID } from './common';

const supportedTools: types.ITool[] = [
  {
    id: 'sfse',
    name: 'Starfield Script Extender',
    executable: () => SFSE_EXE,
    logo: 'sfse.png',
    requiredFiles: [
      SFSE_EXE
    ],
    shortName: 'SFSE',
    relative: true,
    defaultPrimary: true,
    exclusive: true,
  }
]

const gameFinderQuery = {
  steam: [ { id: STEAMAPP_ID, prefer: 0 } ],
  xbox: [ { id: XBOX_ID } ],
}

async function startLooseFilesCheck(context: types.IExtensionContext) {
  const archiveInvalidationTag = '[ARCHIVE INVALIDATION]';  
  try {
    log('debug',`${archiveInvalidationTag} - Starting check`);
    await context.api.awaitUI();

    const iniPath = path.join(util.getVortexPath('documents'), 'My Games', 'Starfield', 'StarfieldCustom.ini');

    // Ensure file is created if it does not exist.
    await fs.ensureFileAsync(iniPath);
    
    let fixAction :(dismiss: types.NotificationDismiss) => Promise<void>;

    // Load ini and parse as object
    let iniContent = (await fs.readFileAsync(iniPath,'utf-8')) ?? '';
    log('info',`${archiveInvalidationTag} - Found INI: \n${iniContent}`);
    let ini = parse(iniContent);
    log('info',`${archiveInvalidationTag} - Loaded INI`, ini);

    if (ini?.Archive?.bInvalidateOlderFiles !== '1' || ini?.Archive?.sResourceDataDirsFinal !== '') {

      // Required settings not configured. Loose files would not be loaded correctly.
      log('warn',`${archiveInvalidationTag} - INI not setup: ${iniPath}`);
      fixAction = async (dismiss: types.NotificationDismiss) => {
        try {
          // Reload ini in case external changes has happened in the meantime.
          iniContent = (await fs.readFileAsync(iniPath,'utf-8')) ?? '';
          ini = parse(iniContent);
          log('info',`${archiveInvalidationTag} - Setting up INI: ${iniPath}`, ini);

          // Allow modifying file even if it was flagged read-only.
          fs.makeFileWritableAsync(iniPath);

          if (!ini.Archive) {
            log('debug',`${archiveInvalidationTag} - No [Archive] section. Adding...`);
            ini.Archive = {};
          }

          // Set required settiings on ini object and convert back to writeable string
          ini.Archive.bInvalidateOlderFiles = '1';
          ini.Archive.sResourceDataDirsFinal = '';
          const newIniContent = stringify(ini);
          log('info',`${archiveInvalidationTag} - New INI: \n${newIniContent}`, ini);

          // Save updates to StarfieldCustom.ini and dismiss the notification as it has been resolved.
          await fs.writeFileAsync(iniPath, newIniContent, {
            encoding: 'utf-8'
          });
          dismiss();
        } catch (err) {
          log('error',`${archiveInvalidationTag} - Failed fix`, err);
        }
      }
    }

    if (fixAction) {

      // Archive Invalidation not configured, notify the user and provide a "Fix" button to automatically resolve it.
      log('info',`${archiveInvalidationTag} - Fix available`);
        context.api.sendNotification({
          // Treat as warning. Doesnt prevent all mods so not a complete error, but still a recommended fix.
          type: 'warning',
          message: 'Loose file loading in "StarfieldCustom.ini" not configured. Some mods might not work as intended.',
          title: 'Loose mod loading not enabled',
          // User can choose "Do not show again" if they really dont care about this.
          allowSuppress: true,

          // Only add the "Fix" button, a "X" (Dismiss) is already available.
          actions: [
            {
              title: 'Fix',
              action: util.toBlue(fixAction)
            }
          ]
        });
    }
  } catch (err) {
    log('error',`${archiveInvalidationTag} - Failed check`, err);
  }
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
    supportedTools,
    requiresLauncher: requiresLauncher,
    details: {
      supportsSymlinks: false,
      steamAppId: parseInt(STEAMAPP_ID)
    },
    setup: util.toBlue(async (discovery) => {

      // Run Archive Invalidation check when Vortex starts for Starfield, or switches to Starfield
      await startLooseFilesCheck(context);
    }),
  });

  context.registerInstaller('starfield-default-installer', 25, testSupported, install);

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
