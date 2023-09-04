import { log, types } from 'vortex-api'
import { DATA_EXTENSIONS, DATA_SUBFOLDERS, GAME_ID, ROOT_EXTENSIONS, ROOT_FOLDERS, SFSE_EXE, TOP_LEVEL_COMPATIBILITY_FOLDERS } from '../common';
import path from 'path';


function testSupported(files: string[], gameId: string): Promise<types.ISupportedResult> {
    return Promise.resolve({
        supported: gameId === GAME_ID,
        requiredFiles: []
    });
}

async function install(
    files: string[], 
    // destinationPath: string, 
    // gameId: string, 
    // progressDelegate: ProgressDelegate, 
    // choices?: any, 
    // unattended?: boolean, 
    // archivePath?: string
): Promise<types.IInstallResult> {

    // Filter out folders as this breaks the installer.
    files = files.filter(f => path.extname(f) !== '');

    // Make a copy of the file list we can edit. 
    let editableFiles = [... files];
    // let instructions: types.IInstruction[] = [];
    
    // Is this SFSE?
    const SFSE = files.find(f => f.toLowerCase().endsWith(SFSE_EXE))
    if (SFSE) {
        // Install all files at the same level as SFSE to the root folder
        const idx = SFSE.toLowerCase().indexOf(SFSE_EXE);
        
        // Check for unecessary nesting.
        const parentFolder = idx === 0 ? '' :  SFSE.substring(0, idx);

        const installables = files.filter(f => f.toLowerCase().startsWith(parentFolder.toLowerCase()));

        const SFSEinstructions: types.IInstruction[] = installables.map(f => (
            {
                type: 'copy',
                source: f,
                target: parentFolder !== '' ? f.replace(parentFolder, ''): f
            }
        ));

        log('info', 'Starfield Script Extender install detected')

        return { instructions: SFSEinstructions };
    }

    // Contains a "Starfield" or "root" folder. This is included because MO2 users want to do it their own way.

    // Store a copy of these files without thier parent directory. 
    let topLevelNoParent: string[] = [];
    // filter down to files that have any of the parent directories.
    const topLevel: string[] = TOP_LEVEL_COMPATIBILITY_FOLDERS.reduce((p, c) => {
        const list = files.filter(f => f.toLowerCase().startsWith(c.toLowerCase()));
        if (list.length) {
            const noParent = list.map(f => f.toLowerCase().replace(c, ''));
            topLevelNoParent = [...topLevelNoParent, ...noParent];
            p = [...p, ...list];
        }
        return p;
    }, []);

    // If there are files in these top level directories, filter them into the root and map everything else to Data.
    if (topLevel.length) {
        editableFiles = editableFiles.filter(f => !topLevel.includes(f));
        const topLevelInstructions: types.IInstruction[] = topLevelNoParent.map(f => ({
            type: 'copy',
            source: f,
            target: f
        }));
        const leftOverInstructions: types.IInstruction[] = editableFiles.map(f => ({
            type: 'copy',
            source: f,
            target: path.join('Data', f)
        }));

        log('info', 'Starfield mod detected as including a top level directory (not packaged relative to the root)')
        return { instructions: [ ...topLevelInstructions, ...leftOverInstructions ] }
    }

    // Archive contains a "Data" folder?
    const dataFolderFiles: string[] = files.filter(f => f.toLowerCase().startsWith('data'));
    if (dataFolderFiles.length) {
        // See where in the file tree the data folder exists
        const idx = dataFolderFiles[0].toLowerCase().indexOf('data');
        const dataParent = idx !== 0 ? dataFolderFiles[0].substring(0, idx)  : '';
        const dataFolderInstructions: types.IInstruction[] = dataFolderFiles.map(f => ({
            type: 'copy',
            source: f,
            target: dataParent !== '' ? f.toLowerCase().replace(dataParent.toLowerCase(), 'Data'): f
        }));

        log('info', 'Starfield mod detected with data subfolder (packed relative to game root)')
        return { instructions: dataFolderInstructions };
    }

    // Archive contains a file expected inside Data
    const dataFiles = DATA_EXTENSIONS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().endsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have an ESP/ESM/BA2/ESL/etc so anything on that level can go into the data folder.
    if (dataFiles.length) {
        // check if it's nested
        const idx = dataFiles[0].indexOf(path.basename(dataFiles[0]));
        const baseFolder = idx !== 0 ? dataFiles[0].substring(0, idx) : '';

        // Map everything in that folder to "Data".
        const dataFilesInstructions: types.IInstruction[] = dataFiles.map((f: string) => ({
            type: 'copy',
            source: f,
            target: path.join('Data', baseFolder !== '' ? f.substring(idx) : f)
        }));
        
        
        log('info', 'Starfield mod detected with plugin or BA2 file, mapping to data folder');
        return { instructions: dataFilesInstructions };
    }

    // Archive contains a folder expected inside Data
    const dataSubfolderFiles = DATA_SUBFOLDERS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().startsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have a textures/meshes/scripts/etc folder, so use that as the base. 
    if (dataSubfolderFiles.length) {
        // Map everything in that folder to 'Data'
        const dataSFInstructions: types.IInstruction[] = dataSubfolderFiles.map(f => ({
            type: 'copy',
            source: f,
            target: path.join('Data', f)
        }));

        log('info', 'Starfield mod detected with data subfolder, mapping to data folder');
        return { instructions: dataSFInstructions };
    }

    // Archive contains a file expected in the root folder (.exe, .ini, .dll)
    const rootFiles = ROOT_EXTENSIONS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().endsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have an ESP/ESM/BA2/ESL/etc so anything on that level can go into the data folder.
    if (rootFiles.length) {
        // check if it's nested
        const idx = rootFiles[0].indexOf(path.basename(rootFiles[0]));
        const baseFolder = idx !== 0 ? rootFiles[0].substring(0, idx) : '';

        // Map everything in that folder to "Data".
        const dataFilesInstructions: types.IInstruction[] = rootFiles.map((f: string) => ({
            type: 'copy',
            source: f,
            target: path.join('Data', baseFolder !== '' ? f.substring(idx) : f)
        }));
        
        
        log('info', 'Starfield mod detected with INI, DLL or EXE, mapping to root folder');
        return { instructions: dataFilesInstructions };

        // TODO: Improve this handler to tell the user the mod is packed weirdly and prompt them for a solution.
        // It might be possible to have them open the .installing folder, restructure it and have Vortex then install those files, but that's risky.
    }


    // Archive contains a folder expected in the root. (Plugins for ASI loader)
    const rootFolderFiles = ROOT_FOLDERS.reduce((p, c) => {
        const matchingFiles = files.filter(f => f.toLowerCase().startsWith(c.toLowerCase()));
        if (matchingFiles.length) p = [...p, ...matchingFiles];
        return p;
    }, []);

    // We have a pluigins folder, so use that as the base. 
    if (rootFolderFiles.length) {
        // Map everything in that folder to 'Data'
        const rootFolderInstructions: types.IInstruction[] = rootFolderFiles.map(f => ({
            type: 'copy',
            source: f,
            target: f
        }));

        log('info', 'Starfield mod detected with root subfolder, mapping to root folder');
        return { instructions: rootFolderInstructions };
    }


    // Unrecognised archive. 
    log('warn', 'Unrecognised archive for Starfield, installing all files to game root.')
    return { instructions: files.map(f => ({ type: 'copy', source: f, target: f }))};

}

export { testSupported, install };
