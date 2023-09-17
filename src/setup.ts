import { fs, log, types, util } from "vortex-api";
import { mergeFolderContents } from './util';
import path from "path";
import { SFCUSTOM_INI, SFCUSTOM_INI_TEXT } from "./common";

const customINITemplate = path.join(__dirname, 'StarfieldCustom.ini');

// This code executes when the user first manages Starfield AND each time they swap from another game to Starfield. 
export default async function setup(discovery: types.IDiscoveryResult): Promise<void> {
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
  
  // We want to clean up the additional "Data" folder in "My Games" and create a junction pointing back to the game folder. 
  let createSymlink = true;

  // See if the "Data" folder exists
  try {
    const myGamesContents = await fs.readdirAsync(myGamesFolder);
    if (myGamesContents.find(f => f.toLowerCase() === 'data')) {
      const dataFolderStat: fs.Stats = await fs.lstatAsync(myGamesData);

      // Check to see if it's already a symlink.
      if (!dataFolderStat.isSymbolicLink()) {
        await mergeFolderContents(myGamesData, gameDataFolder, true);
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

  // Check for StarfieldCustom.ini and add it if it doesn't exist. 
  const customINIPath = path.join(myGamesFolder, SFCUSTOM_INI);
  try {
    await fs.statAsync(customINIPath);
    const INIValues = await fs.readFileAsync(customINIPath, { encoding: 'utf8' });
    // If the INI lacks the archive section, add it to the top. 
    if (!INIValues.includes(`[Archive]`)) {
        const newINI = `${SFCUSTOM_INI_TEXT}${INIValues}`;

        await fs.writeFileAsync(customINIPath, newINI);
    }
  }
  catch(err) {
    if ((err as { code: string }).code === 'ENOENT') {
        log('debug', 'Creating StarfieldCustom.ini as it is missing!');
        await fs.copyAsync(customINITemplate, customINIPath);
    }
  }
}