/* eslint-disable */
import path from 'path';
import { GAME_ID, SFCUSTOM_INI } from './common';
import { fs, types, log, selectors, util } from 'vortex-api';
import { parse, stringify } from 'ini-comments';

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
      short: 'Required settings not configured',
      long: 'Required settings not configured. Loose files would not be loaded correctly.\n\n',

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