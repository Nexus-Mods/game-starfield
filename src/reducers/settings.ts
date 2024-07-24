import { types, util } from 'vortex-api';
import { setDirectoryJunctionEnabled, setDirectoryJunctionSuppress,
         setIgnoreSaveGameVersion,
         setLoadOrderManagementType,
         setMigrationVersion, setPluginsEnabler } from '../actions/settings';

export const settingsReducer: types.IReducerSpec = {
  reducers: {
    [setDirectoryJunctionEnabled as any]: (state, payload) => util.setSafe(state, ['enableDirectoryJunction'], payload),
    [setDirectoryJunctionSuppress as any]: (state, payload) => util.setSafe(state, ['suppressDirectoryJunctionTest'], payload),
    [setMigrationVersion as any]: (state, payload) => util.setSafe(state, ['migrationVersion'], payload),
    [setPluginsEnabler as any]: (state, payload) => util.setSafe(state, ['pluginEnabler'], payload),
    [setIgnoreSaveGameVersion as any]: (state, payload) => util.setSafe(state, ['ignoreSaveVersion'], payload),
    [setLoadOrderManagementType as any]: (state, payload) => {
      const { profileId, type } = payload;
      return util.setSafe(state, ['loadOrderManagementType', profileId], type);
    },
  },
  defaults: {
    pluginEnabler: false,
    enableDirectoryJunction: false,
    suppressDirectoryJunctionTest: false,
    migrationVersion: '0.0.0',
    ignoreSaveVersion: false,
  },
};