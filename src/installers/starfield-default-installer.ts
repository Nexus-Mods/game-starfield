import { log, types, util } from 'vortex-api'
import { DATA_EXTENSIONS, DATA_SUBFOLDERS, GAME_ID, ROOT_EXTENSIONS, ROOT_FOLDERS, SFSE_EXE, TOP_LEVEL_COMPATIBILITY_FOLDERS } from '../common';
import path from 'path';


function testSupported(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return Promise.resolve({
        supported: gameId === GAME_ID,
        requiredFiles: []
    });
}

async function install(
    api: types.IExtensionApi,
    files: string[], 
    // destinationPath: string, 
    // gameId: string, 
    // progressDelegate: ProgressDelegate, 
    // choices?: any, 
    // unattended?: boolean, 
    // archivePath?: string
): Promise<types.IInstallResult> {

    // Filter out folders as this breaks the installer.
    files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
    
    // SFSE INSTALL
    const SFSE = files.find(f => f.toLowerCase().endsWith(SFSE_EXE))
    if (SFSE) return installSFSE(api, files, SFSE);
    // END SFSE INSTALL

    // EXPLICIT ROOT FOLDER(S)
    // Contains a "Starfield" or "root" folder. This is included because MO2 users want to do it their own way.

    // Store a copy of these files without thier parent directory. 
    let topLevelNoParent: string[] = [];
    // filter down to files that have any of the parent directories.
    const topLevel: string[] = TOP_LEVEL_COMPATIBILITY_FOLDERS.reduce((p, c) => {
        const prefix = `${c.toLowerCase()}${path.sep}` //e.g. "root/"
        const list = files.filter(f => f.toLowerCase().startsWith(prefix));
        if (list.length) {
            const noParent = list.map(f => f.toLowerCase().replace(c, ''));
            topLevelNoParent = [...topLevelNoParent, ...noParent];
            p = [...p, ...list];
        }
        return p;
    }, []);

    // If there are files in these top level directories, filter them into the root and map everything else to Data.
    if (topLevel.length) return installExplicitTopLevel(files, topLevel, topLevelNoParent);

    // END EXPLICIT ROOT FOLDERS

    // RELATIVE TO ROOT FOLDER
    // Archive contains a "Data" folder?
    const dataFolderFiles: string[] = files.filter(f => f.toLowerCase().startsWith('data'));
    if (dataFolderFiles.length) return installWithDataFolder(dataFolderFiles);

    // END RELATIVE TO ROOT FOLDER

    // KNOWN DATA FOLDER FILES
    // Archive contains a file expected inside Data
    const dataFiles = DATA_EXTENSIONS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().endsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have an ESP/ESM/BA2/ESL/etc so anything on that level can go into the data folder.
    if (dataFiles.length) return installDataFolderFiles(dataFiles);

    // END KNOWN DATA FOLDER FILES

    // KNOWN DATA SUBFOLDERS
    // Archive contains a folder expected inside Data
    const dataSubfolderFiles = DATA_SUBFOLDERS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().startsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have a textures/meshes/scripts/etc folder, so use that as the base. 
    if (dataSubfolderFiles.length) return installDataSubFolders(dataSubfolderFiles);

    // END KNOWN DATA SUBFOLDERS

    // GAME FOLDER FILES
    // Archive contains a file expected in the root folder (.exe, .ini, .dll)
    const rootFiles = ROOT_EXTENSIONS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().endsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have a .dll, .ini, .exe, so we assume files go in the root folder
    if (rootFiles.length) return installGameFolderFiles(rootFiles, files);

    // END GAME FOLDER FILES

    // GAME FOLDER SUBFOLDERS
    // Archive contains a folder expected in the root. (Plugins for ASI loader)
    const rootFolderFiles = ROOT_FOLDERS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().startsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have a pluigins folder, so use that as the base. 
    if (rootFolderFiles.length) return installGameSubFolders(rootFolderFiles);
    // END GAME FOLDER SUBFOLDERS


    // Unrecognised archive. 
    // TODO: Improve this handler to tell the user the mod is packed weirdly and prompt them for a solution.
     // It might be possible to have them open the .installing folder, restructure it and have Vortex then install those files, but that's risky.
    log('warn', 'Unrecognised archive for Starfield, installing all files to game root.')
    return { instructions: files.map(f => ({ type: 'copy', source: f, destination: f }))};

}

/* Install Starfield Script Extender */
async function installSFSE(api: types.IExtensionApi, files: string[], SFSE: string): Promise<types.IInstallResult> {
    // Warn SFSE doesn't work with the Xbox release. 
    const discovery = api.getState().settings?.gameMode?.discovered?.[GAME_ID];
    if ((discovery?.store && discovery?.store !== 'steam') || !discovery.path.toLowerCase().includes('steamapps')) {
        const platform = discovery.store 
            ? discovery.store.charAt(0).toUpperCase() + discovery.store.slice(1) 
            : 'Unknown (The location was set manually in the Games tab to a non-Steamapps folder)';

        const userChoice = await api.showDialog(
            'info', 
            'Starfield Script Extender is not compatible', 
            {
                text: 'Starfield Script Extender is only compatible with the Steam release of the game, but it looks like you are playing on a different platform.'+
                `\n\nDetected Platform: ${platform}`+
                '\n\nYou may continue to install this mod but it is not likely to work correctly.'
            },
            [
                {
                    label: 'Continue',
                },
                {
                    label: 'Cancel',
                    default: true
                }                
            ]
        )

        if (userChoice.action === 'Cancel') throw new util.UserCanceled();
    }

    // Install all files at the same level as SFSE to the root folder
    const idx = SFSE.toLowerCase().indexOf(SFSE_EXE);
    
    // Check for unecessary nesting.
    const parentFolder = idx === 0 ? '' :  SFSE.substring(0, idx);

    const installables = files.filter(f => f.toLowerCase().startsWith(parentFolder.toLowerCase()));

    const SFSEinstructions: types.IInstruction[] = installables.map(f => (
        {
            type: 'copy',
            source: f,
            destination: parentFolder !== '' ? f.replace(parentFolder, ''): f
        }
    ));

    log('info', 'Starfield Script Extender install detected')

    return{ instructions: SFSEinstructions };
}

/* Install any root folder mods (the MO2 way) */
function installExplicitTopLevel(files: string[], topLevel: string[], topLevelNoParent: string[]): types.IInstallResult {
    // Store a copy of these files without thier parent directory. 
    const editableFiles = files.filter(f => !topLevel.includes(f));
        const topLevelInstructions: types.IInstruction[] = topLevelNoParent.map(f => ({
            type: 'copy',
            source: f,
            destination: f
        }));
        const leftOverInstructions: types.IInstruction[] = editableFiles.map(f => ({
            type: 'copy',
            source: f,
            destination: path.join('Data', f)
        }));

        log('info', 'Starfield mod detected as including a top level directory (not packaged relative to the root)')
        return { instructions: [ ...topLevelInstructions, ...leftOverInstructions ] }
}

/* Installs where the archive is packed relative to the game root */
function installWithDataFolder(dataFolderFiles: string[]): types.IInstallResult {
    // See where in the file tree the data folder exists
        const idx = dataFolderFiles[0].toLowerCase().indexOf('data');
        const dataParent = idx !== 0 ? dataFolderFiles[0].substring(0, idx)  : '';
        const dataFolderInstructions: types.IInstruction[] = dataFolderFiles.map(f => ({
            type: 'copy',
            source: f,
            destination: dataParent !== '' ? f.toLowerCase().replace(dataParent.toLowerCase(), 'Data'): f
        }));

        log('info', 'Starfield mod detected with data subfolder (packed relative to game root)')
        return { instructions: dataFolderInstructions };
}

/* Installs where there are known data folder files */
function installDataFolderFiles(dataFiles: string[]): types.IInstallResult {
    // check if it's nested
    const idx = dataFiles[0].indexOf(path.basename(dataFiles[0]));
    const baseFolder = idx !== 0 ? dataFiles[0].substring(0, idx) : '';

    // Map everything in that folder to "Data".
    const dataFilesInstructions: types.IInstruction[] = dataFiles.map((f: string) => ({
        type: 'copy',
        source: f,
        destination: path.join('Data', baseFolder !== '' ? f.substring(idx) : f)
    }));
    
    
    log('info', 'Starfield mod detected with plugin or BA2 file, mapping to data folder');
    return { instructions: dataFilesInstructions };
}

/* Installs where there are known data folder subfolders */
function installDataSubFolders(dataSubfolderFiles: string[]): types.IInstallResult {
    // Map everything in that folder to 'Data'
    const dataSFInstructions: types.IInstruction[] = dataSubfolderFiles.map(f => ({
        type: 'copy',
        source: f,
        destination: path.join('Data', f)
    }));

    log('info', 'Starfield mod detected with data subfolder, mapping to data folder');
    return { instructions: dataSFInstructions };
}

/* Installs where there are known root folder files */
function installGameFolderFiles(rootFiles: string[], allFiles: string[]): types.IInstallResult {
    // check if it's nested
    const idx = rootFiles[0].indexOf(path.basename(rootFiles[0]));
    const baseFolder = idx !== 0 ? rootFiles[0].substring(0, idx) : '';

    // Filter the entire archive to find everything on the same level.
    const modFiles = baseFolder === '' ? allFiles : allFiles.filter(f => f.toLowerCase().startsWith(baseFolder.toLowerCase()));

    // Map everything in that folder to the game root
    const dataFilesInstructions: types.IInstruction[] = modFiles.map((f: string) => ({
        type: 'copy',
        source: f,
        destination: baseFolder !== '' ? f.substring(idx) : f
    }));
    
    
    log('info', 'Starfield mod detected with INI, DLL or EXE, mapping to root folder');
    return { instructions: dataFilesInstructions };
}

/* Installs where there are known root folder subfolders */
function installGameSubFolders(rootFolderFiles: string[]): types.IInstallResult {
    // Map everything in that folder to 'Data'
    const rootFolderInstructions: types.IInstruction[] = rootFolderFiles.map(f => ({
        type: 'copy',
        source: f,
        destination: f
    }));

    log('info', 'Starfield mod detected with root subfolder, mapping to root folder');
    return { instructions: rootFolderInstructions };
}



export { testSupported, install };
