// /* eslint-disable */
// import path from 'path';
// import { parseStringPromise } from 'xml2js';
// import { fs, log, types, selectors, util } from 'vortex-api';
// import { GAME_ID, SFSE_EXE, MODULE_CONFIG } from '../common';
// import { walkPath } from '../util';

// async function cleanUp(tempArc: string) {
//   // Cleanup
//   const tempDir = path.join(util.getVortexPath('temp'), path.basename(tempArc, path.extname(tempArc)));
//   await fs.removeAsync(tempArc).catch(() => null);
//   const filePaths = await walkPath(tempDir);
//   filePaths.sort((a, b) => b.filePath.length - a.filePath.length);
//   for (const f of filePaths) {
//     await fs.removeAsync(f.filePath).catch(() => null);
//   }
// }

// async function readModuleConfig(archivePath: string, moduleFileRelPath: string): Promise<string> {
//   let destDir;
//   const destArc = path.join(util.getVortexPath('temp'), path.basename(archivePath));
//   try {
//     await fs.copyAsync(archivePath, destArc);
//     destDir = path.join(util.getVortexPath('temp'), path.basename(archivePath, path.extname(archivePath)));
//     const seven = new util.SevenZip();
//     await seven.extractFull(destArc, destDir);
//     const moduleConfigFilePath = path.join(destDir, moduleFileRelPath);
//     const fileContents = await fs.readFileAsync(moduleConfigFilePath, 'utf8');
//     await cleanUp(destArc);
//     return fileContents;
//   } catch (err) {
//     await cleanUp(destArc);
//     return Promise.resolve('');
//   }
// }

// async function isDeprecatedFomod(archivePath: string, moduleConfigFilePath: string): Promise<boolean> {
//   try {
//     const moduleConfig = await readModuleConfig(archivePath, moduleConfigFilePath);
//     const regexp = /.*<plugin.* name=(["']Vortex["']|["']vortex['"])>$/gm;
//     if (regexp.test(moduleConfig)) {
//       return Promise.resolve(true);
//     }
//     // Just in case we actually have to sort deeper into the module config's data one day.
//     // const data = await parseStringPromise(moduleConfig);
//   } catch (err) {
//     log('debug', 'Failed to parse module config', err);
//   }

//   return Promise.resolve(false);
// }

// export async function testDeprecatedFomod(files: string[], gameId: string, archivePath: string): Promise<types.ISupportedResult> {
//   const moduleConfig = files.find(f => f.toLowerCase().endsWith(MODULE_CONFIG));
//   let isDeprecated = false;
//   if (moduleConfig) {
//     isDeprecated = await isDeprecatedFomod(archivePath, moduleConfig);
//   }
//   const supported = (gameId !== GAME_ID) && isDeprecated;
//   return Promise.resolve({
//     supported,
//     requiredFiles: []
//   });
// }

// export async function installDeprecatedFomod(api: types.IExtensionApi, files: string[]): Promise<types.IInstallResult> {
//   const discovery = selectors.discoveryByGame(api.getState(), GAME_ID);
//   if (!discovery || !discovery.path) {
//     return Promise.reject(new util.SetupError('Game not discovered'));
//   }
//   const filtered = files.filter(f => f.toLowerCase().endsWith('.fomod'));
//   const instructions: types.IInstruction[] = filtered.map(f => (
//     {
//       type: 'submodule',
//       source: f,
//       destination: f
//     }
//   ));

//   return { instructions };
// }