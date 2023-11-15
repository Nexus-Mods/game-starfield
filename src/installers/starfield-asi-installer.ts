/* eslint-disable */
import path from 'path'
import { log, types, selectors, util } from 'vortex-api';
import { ASI_LOADER_ASSEMBLIES, GAME_ID, TARGET_ASI_LOADER_NAME } from '../common';

const findAsiLoader = (files: string[]): string | undefined =>
  files.find(f => ASI_LOADER_ASSEMBLIES.includes(path.basename(f).toLowerCase()));

export function testASILoaderSupported(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  const supported = findAsiLoader(files) !== undefined;
  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}

export async function installASILoader(api: types.IExtensionApi, files: string[]): Promise<types.IInstallResult> {
  const discovery = selectors.discoveryByGame(api.getState(), GAME_ID);
  if (!discovery || !discovery.path) {
    return Promise.reject(new util.SetupError('Game not discovered'));
  }
  const asiLoader = findAsiLoader(files)!;
  const idx = files.indexOf(asiLoader);

  const asiLoaderInstruction: types.IInstruction = {
    type: 'copy',
    source: asiLoader,
    destination: TARGET_ASI_LOADER_NAME
  };

  // Check for unecessary nesting.
  const parentFolder = idx === 0 ? '' : asiLoader.substring(0, idx);
  const filtered = files.filter(f => f.toLowerCase().startsWith(parentFolder.toLowerCase()) && f !== asiLoader);
  const instructions: types.IInstruction[] = filtered.map(f => (
    {
      type: 'copy',
      source: f,
      destination: parentFolder !== '' ? f.replace(parentFolder, '') : f
    }
  ));

  instructions.push(asiLoaderInstruction);

  return { instructions };
}