/* eslint-disable */
import path from 'path';
import { actions, fs, types, selectors, util } from 'vortex-api';

import { GAME_ID, MOD_TYPE_DATAPATH } from '../common';
import { IStarfieldCollectionsData, ICollection } from '../types';
import { getExtensionVersion, doesModRequireMigration, migrateMod, isDataPathMod, purge } from '../util';

export async function generate(gameId: string, includedMods: string[]): Promise<IStarfieldCollectionsData> {
  if (gameId !== GAME_ID) {
    return Promise.resolve(undefined);
  }
  const extensionVersion = await getExtensionVersion();
  return Promise.resolve({ extensionVersion });
}

export async function parse(api: types.IExtensionApi, gameId: string, collection: ICollection): Promise<void> {
  if (gameId !== GAME_ID || collection.extensionVersion !== undefined) {
    return Promise.resolve();
  }
  const state = api.getState();
  const collectionMods: types.IMod[] = collectionToMods(api, collection);
  const installationPath = selectors.installPathForGame(state, gameId);
  const batchedActions = [];
  if (collectionMods.length > 0) {
    await purge(api);
  }
  for (const mod of collectionMods) {
    const modPath = path.join(installationPath, mod.installationPath);
    const needsMigrating = await doesModRequireMigration(modPath);
    if (needsMigrating) {
      await migrateMod(modPath);
    }
    const dataPathMod = await isDataPathMod(modPath);
    if (dataPathMod) {
      batchedActions.push(actions.setModType(gameId, mod.id, MOD_TYPE_DATAPATH));
    }
  }

  util.batchDispatch(api.store, batchedActions);
  return Promise.resolve();
}

export async function clone(api: types.IExtensionApi, gameId: string, collection: ICollection, from: types.IMod, to: types.IMod): Promise<void> {
  if (gameId !== GAME_ID || collection.extensionVersion !== undefined) {
    return Promise.resolve();
  }
  const state = api.getState();
  const collectionMods: types.IMod[] = collectionToMods(api, collection);
  const installationPath = selectors.installPathForGame(state, gameId);
  const batchedActions = [];
  for (const mod of collectionMods) {
    const dataPath = path.join(installationPath, mod.installationPath, 'Data');
    const hasData = await fs.statAsync(dataPath).then(() => true).catch(() => false);
    if (hasData) {
      const rule = to.rules.find(r => mod.archiveId === r.reference.archiveId);
      if (rule) {
        batchedActions.push(actions.removeModRule(gameId, to.id, rule));
        const newRule = { ...rule };
        newRule['extra'] = {
          ...newRule['extra'],
          ['type']: MOD_TYPE_DATAPATH
         };
        batchedActions.push(actions.addModRule(gameId, to.id, newRule));
      }
    }
  }

  util.batchDispatch(api.store, batchedActions);

  return Promise.resolve();
}

export function title(t: types.TFunction): string {
  return t('Starfield Data');
}

export function condition(state: types.IState, gameId: string): boolean {
  return GAME_ID === gameId;
}

function collectionToMods(api: types.IExtensionApi, collection: ICollection): types.IMod[] {
  const state = api.getState();
  const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const collectionMods: types.IMod[] = Object.values(collection.mods).reduce((accum, iter) => {
    const reference: types.IModReference = {
      description: iter.name,
      fileMD5: iter.source.md5,
      fileSize: iter.source.fileSize,
      logicalFileName: iter.source.logicalFilename,
      fileExpression: iter.source.fileExpression,
      tag: iter.source.tag,
    };
    reference['md5Hint'] = iter.source.md5;
    const mod = util.findModByRef(reference, mods);
    if (mod !== undefined) {
      accum.push(mod);
    }
    return accum;
  }, []);
  return collectionMods;
}