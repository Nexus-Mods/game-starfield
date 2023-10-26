import { createAction } from 'redux-act';

export const setDirectoryJunctionEnabled = createAction('SET_STARFIELD_JUNCTION_ENABLED', (enabled: boolean) => enabled);

export const setDirectoryJunctionSuppress = createAction('SET_STARFIELD_JUNCTION_SUPPRESS', (suppress: boolean) => suppress);