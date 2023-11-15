import path from 'path';
import { selectors, types } from 'vortex-api';

export function getASIPluginsPath(api: types.IExtensionApi, game: types.IGame) {
  const discovery = selectors.discoveryByGame(api.getState(), game.id);
  if (!discovery || !discovery.path) {
    return '.';
  }
  const pluginsPath = path.join(discovery.path, 'Plugins');
  return pluginsPath;
}

export function testASIPluginsPath(instructions: types.IInstruction[]): Promise<boolean> {
  // Given ini merging logic - for now this modType will never be assigned automatically.
  //  it's assigned through the installer.
  return Promise.resolve(false);
}