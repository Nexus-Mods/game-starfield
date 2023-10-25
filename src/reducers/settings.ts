import { types, util } from 'vortex-api';
import { setDirectoryJunctionEnabled, setDirectoryJunctionSuppress } from '../actions/settings';

export const settingsReducer: types.IReducerSpec = {
  reducers: {
    [setDirectoryJunctionEnabled as any]: (state, payload) => util.setSafe(state, ['enableDirectoryJunction'], payload),
    [setDirectoryJunctionSuppress as any]: (state, payload) => util.setSafe(state, ['suppressDirectoryJunctionTest'], payload),
  },
  defaults: {
    enableDirectoryJunction: false,
    suppressDirectoryJunctionTest: false,
  },
};