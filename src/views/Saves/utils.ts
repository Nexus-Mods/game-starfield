/* eslint-disable */
import path from 'path';
import { fs, log, types, util } from 'vortex-api';
import { ISaveGame, ISaveList } from './types';
import { useTranslation } from 'react-i18next';
import { mygamesPath, walkPath } from '../../util';
import { outputJSON, outputStdout } from '../../SFSaveToolWrapper';

import { IEntry } from 'turbowalk';

const createSaveGame = async (api: types.IExtensionApi, saveFilePath: string): Promise<ISaveGame> => {
  try {
    const result = await outputStdout(api, saveFilePath);
    return result;
  } catch (err) {
    api.showErrorNotification('Failed to read savegame', err);
    return null;
  }
};

export const generateSaveName = (save: ISaveGame): string => {
  return !!save ? `${save.Header.PlayerName} (${save.Header.PlayerLevel}) - ${save.Header.PlayerLocation}` : 'No Save Selected';
}

export const getSaves = async (api: types.IExtensionApi): Promise<ISaveList> => {
  const saveLocation = path.join(mygamesPath(), 'Saves');
  const filePaths: IEntry[] = await walkPath(saveLocation, { recurse: false, skipLinks: true, skipInaccessible: true, skipHidden: true });
  const saveFilePaths: IEntry[] = filePaths.filter(file => path.extname(file.filePath) === '.sfs');
  const saves: ISaveList = await saveFilePaths.reduce(async (accumP, file) => {
    const accum = await accumP;
    try {
      const save = await createSaveGame(api, file.filePath);
      if (save) {
        accum[path.basename(file.filePath)] = save;
      }
    } catch (err) {
      log('error', 'Failed to read savegame', err);
      return accum;
    }
    return accum;
  }, Promise.resolve({}));
  return Promise.resolve(saves);
}