import { fs, log, types, util } from "vortex-api";
import { mergeFolderContents } from './util';
import path from "path";
import { SFCUSTOM_INI, SFCUSTOM_INI_TEXT } from "./common";

import { parse, stringify } from 'ini';

const customINITemplate = path.join(__dirname, 'StarfieldCustom.ini');

// This code executes when the user first manages Starfield AND each time they swap from another game to Starfield. 
export default async function setup(discovery: types.IDiscoveryResult, context: types.IExtensionContext): Promise<void> {
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
  await fs.ensureDirAsync(myGamesFolder);
  
  // The game has a secondary data folder at My Games\Starfield\Data which overrides the Data folder in the game installation.
  // To get around this, we create a symbolic link between the "real" Data folder and the one in the My Games folder.
  // This will trick the game engine into using the same Data folder for all textures.
  // Existing contents of this folder will be copied over to the game install folder and backed up. 
  await symlinkMyGamesDataFolder(myGamesFolder, myGamesData, gameDataFolder);

  // Check for StarfieldCustom.ini and loose file setup. 
  const customINIPath = path.join(myGamesFolder, SFCUSTOM_INI);
  await startLooseFilesCheck(context, customINIPath);
}

async function symlinkMyGamesDataFolder(myGamesFolder: string, myGamesData: string, gameDataFolder: string) {
  // We want to clean up the additional "Data" folder in "My Games" and create a junction pointing back to the game folder. 
  let createSymlink = true;

  // See if the "Data" folder exists
  try {
    const myGamesContents = await fs.readdirAsync(myGamesFolder);

    if (myGamesContents.find(f => f.toLowerCase() === 'data')) {
      const dataFolderStat: fs.Stats = await fs.lstatAsync(myGamesData);

      // Check to see if it's already a symlink.
      if (!dataFolderStat.isSymbolicLink()) {

        // merge both the 'my games' and 'main' data folders
        await mergeFolderContents(myGamesData, gameDataFolder, true); 

        // make a backup (just in case), timestamped so we dont worry about unique renaming
        await fs.renameAsync(myGamesData, `${myGamesData}-backup-${Date.now()}`);

        // await fs.moveAsync(myGamesData, gameDataFolder, { overwrite: false });
      }
      else {
        createSymlink = false;
        log('debug', 'My Games Folder for Starfield has a symbolic link for "Data" already.');
      }
    }
    else {
      log('debug', 'My Games folder for Starfield does not contain a "Data" folder yet.')
    }

    // Create a symlink to trick the game into using the game data folder. 
    if (createSymlink) await fs.symlinkAsync(gameDataFolder, myGamesData, 'junction')
  }
  catch(err) {
    log('error', 'Error checking for My Games Data path for Starfield', err);
  }
}

async function startLooseFilesCheck(context: types.IExtensionContext, iniPath: string) {
  const archiveInvalidationTag = '[ARCHIVE INVALIDATION]';  
  try {

    // Ensure file is created if it does not exist.
    await fs.ensureFileAsync(iniPath);

    // Load ini and parse as object
    let iniContent = (await fs.readFileAsync(iniPath,'utf-8')) ?? '';
    let ini = parse(iniContent);

    if (ini?.Archive?.bInvalidateOlderFiles !== '1' || ini?.Archive?.sResourceDataDirsFinal !== '' || ini?.General?.sPhotoModeFolder !== 'Photos') {

      // Required settings not configured. Loose files would not be loaded correctly.
      log('warn',`${archiveInvalidationTag} - INI not setup: ${iniPath}`);
      try {
        // Reload ini in case external changes has happened in the meantime.
        iniContent = (await fs.readFileAsync(iniPath,'utf-8')) ?? '';
        ini = parse(iniContent);
        log('info',`${archiveInvalidationTag} - Setting up INI: ${iniPath}`, ini);

        // Allow modifying file even if it was flagged read-only.
        await fs.makeFileWritableAsync(iniPath);

        if (!ini.Archive) {
          ini.Archive = {};
        }
        if (!ini.General) {
          ini.General = {};
        }

        // Set required settiings on ini object and convert back to writeable string
        ini.Archive.bInvalidateOlderFiles = '1';
        ini.Archive.sResourceDataDirsFinal = '';
        ini.General.sPhotoModeFolder = 'Photos';
        const newIniContent = stringify(ini);
        log('info',`${archiveInvalidationTag} - New INI: \n${newIniContent}`, ini);

        // Save updates to StarfieldCustom.ini and dismiss the notification as it has been resolved.
        await fs.writeFileAsync(iniPath, newIniContent, {
          encoding: 'utf-8'
        });
      } catch (err) {
        log('error',`${archiveInvalidationTag} - Failed fix`, err);
      }
    }

  } 
  catch (err) {
    log('error',`${archiveInvalidationTag} - Failed check`, err);
    try {
      await fs.statAsync(iniPath);
      const INIValues = await fs.readFileAsync(iniPath, { encoding: 'utf8' });
      // If the INI lacks the archive section, add it to the top. 
      if (!INIValues.includes(`[Archive]`)) {
          const newINI = `${SFCUSTOM_INI_TEXT}${INIValues}`;

          await fs.writeFileAsync(iniPath, newINI);
      }
    }
    catch(err) {
      if ((err as { code: string }).code === 'ENOENT') {
          log('debug', 'Creating StarfieldCustom.ini as it is missing!');
          await fs.copyAsync(customINITemplate, iniPath);
      }
    }
  }
}