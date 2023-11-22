import { createAction } from 'redux-act';

export const setDirectoryJunctionEnabled = createAction('SET_STARFIELD_JUNCTION_ENABLED', (enabled: boolean) => enabled);

export const setDirectoryJunctionSuppress = createAction('SET_STARFIELD_JUNCTION_SUPPRESS', (suppress: boolean) => suppress);

export const setMigrationVersion = createAction('SET_STARFIELD_MIGRATION_VERSION', (version: string) => version);

export const setPluginsEnabler = createAction('SET_STARFIELD_PLUGIN_ENABLER', (enabled: boolean) => enabled);

export const setManageLoadOrder = createAction('SET_STARFIELD_MANAGE_LOAD_ORDER', (manage: boolean) => manage);