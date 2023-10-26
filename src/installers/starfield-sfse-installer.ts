/* eslint-disable */
import { log, types, selectors, util } from 'vortex-api';
import { GAME_ID, SFSE_EXE } from '../common';

export function testSFSESupported(files: string[], gameId: string): Promise<types.ISupportedResult> {
  const supported = files.reduce((prev, file) => {
    if (gameId !== GAME_ID) {
      return prev;
    }
    if (file.toLowerCase().endsWith(SFSE_EXE)) {
      prev = true;
    }
    return prev;
  }, false);
  return Promise.resolve({
    supported,
    requiredFiles: [SFSE_EXE]
  });
}

export async function installSFSE(api: types.IExtensionApi, files: string[]): Promise<types.IInstallResult> {
  // Warn SFSE doesn't work with the Xbox release. 
  const discovery = selectors.discoveryByGame(api.getState(), GAME_ID);
  if (!discovery || !discovery.path) {
    return Promise.reject(new util.SetupError('Game not discovered'));
  }
  const SFSE = files.find(f => f.toLowerCase().endsWith(SFSE_EXE))
  if ((discovery?.store && discovery?.store !== 'steam') || !discovery.path.toLowerCase().includes('steamapps')) {
    const platform = discovery.store
      ? discovery.store.charAt(0).toUpperCase() + discovery.store.slice(1)
      : 'Unknown (The location was set manually in the Games tab to a non-Steamapps folder)';

    const userChoice = await api.showDialog(
      'info',
      'Starfield Script Extender is not compatible',
      {
        text: 'Starfield Script Extender is only compatible with the Steam release of the game, but it looks like you are playing on a different platform.' +
          `\n\nDetected Platform: ${platform}` +
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
  const parentFolder = idx === 0 ? '' : SFSE.substring(0, idx);

  const installables = files.filter(f => f.toLowerCase().startsWith(parentFolder.toLowerCase()));

  const SFSEinstructions: types.IInstruction[] = installables.map(f => (
    {
      type: 'copy',
      source: f,
      destination: parentFolder !== '' ? f.replace(parentFolder, '') : f
    }
  ));

  log('info', 'Starfield Script Extender install detected')

  return { instructions: SFSEinstructions };
}