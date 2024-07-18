import { selectors, types } from 'vortex-api';
import { SavePageProps } from './pages/SavePage';
import { GAME_ID } from '../../common';

export class SavePageOptions implements types.IMainPageOptions {
  private context: types.IExtensionContext;

  public id = 'starfield-saves';
  public hotkey = 'A';
  public group: 'dashboard' | 'global' | 'per-game' | 'support' | 'hidden' = 'per-game';

  constructor(context: types.IExtensionContext) {
    this.context = context;
  }

  public visible = (): boolean => {
    if (!this.context.api.store) {
      return false;
    }
    return selectors.activeGameId(this.context.api.getState()) === GAME_ID;
  };
  public props = (): SavePageProps => ({
    api: this.context.api,
  });
}
