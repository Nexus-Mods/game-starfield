import { types, util } from 'vortex-api';
import { setDirectoryJunctionEnabled, setDirectoryJunctionSuppress, setMigrationVersion } from '../actions/settings';

export const settingsReducer: types.IReducerSpec = {
  reducers: {
    [setDirectoryJunctionEnabled as any]: (state, payload) => util.setSafe(state, ['enableDirectoryJunction'], payload),
    [setDirectoryJunctionSuppress as any]: (state, payload) => util.setSafe(state, ['suppressDirectoryJunctionTest'], payload),
    [setMigrationVersion as any]: (state, payload) => util.setSafe(state, ['migrationVersion'], payload),
  },
  defaults: {
    enableDirectoryJunction: false,
    suppressDirectoryJunctionTest: false,
    migrationVersion: '0.0.0',
  },
};