import { types, util } from 'vortex-api';
import { setDirectoryJunctionEnabled, setDirectoryJunctionSuppress,
         setMigrationVersion, setPluginsEnabler } from '../actions/settings';

export const settingsReducer: types.IReducerSpec = {
  reducers: {
    [setDirectoryJunctionEnabled as any]: (state, payload) => util.setSafe(state, ['enableDirectoryJunction'], payload),
    [setDirectoryJunctionSuppress as any]: (state, payload) => util.setSafe(state, ['suppressDirectoryJunctionTest'], payload),
    [setMigrationVersion as any]: (state, payload) => util.setSafe(state, ['migrationVersion'], payload),
    [setPluginsEnabler as any]: (state, payload) => util.setSafe(state, ['pluginEnabler'], payload),
  },
  defaults: {
    pluginEnabler: false,
    enableDirectoryJunction: false,
    suppressDirectoryJunctionTest: false,
    migrationVersion: '0.0.0',
  },
};