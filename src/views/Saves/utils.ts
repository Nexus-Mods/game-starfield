/* eslint-disable */
import path from 'path';
import { fs, log, types, util } from 'vortex-api';
import { ISaveGame, ISaveList } from './types';
import { useTranslation } from 'react-i18next';
import { mygamesPath, walkPath } from '../../util';
import { outputJSON, outputStdout } from '../../SFSaveToolWrapper';

import { IEntry } from 'turbowalk';

const createSaveGame = async (api: types.IExtensionApi, saveFilePath: string): Promise<ISaveGame> => {
  return outputStdout(api, saveFilePath);
};

export const formatPlaytime = (playtime: string): string => {
  // 0d.0h.4m.0 days.0 hours.4 minutes
  const regexp = /(\d+)d\.(\d+)h\.(\d+)m\.\d+ days\.\d+ hours\.\d+ minutes/g;
  const match = playtime.matchAll(regexp);
  const groups = [...match][0];

  return `${groups[1]}d ${groups[2]}h ${groups[3]}m`;
};

export const formatlastPlayed = (lastPlayed: string): string => {
  // 2023-09-19T17:08:30.7238343Z
  const lastPlayedDate = new Date(lastPlayed);
  return `${lastPlayedDate.toLocaleString()}`;
};

export const generateSaveName = (save: ISaveGame): string => {
  return !!save ? `${save.Filename}` : 'No Save Selected';
  //return !!save ? `${save.Header.PlayerName} (${save.Header.PlayerLevel}) - ${save.Header.PlayerLocation}` : 'No Save Selected';
};

export const getSaves = async (api: types.IExtensionApi): Promise<ISaveList> => {
  const saveLocation = path.join(mygamesPath(), 'Saves');
  const filePaths: IEntry[] = await walkPath(saveLocation, { recurse: false, skipLinks: true, skipInaccessible: true, skipHidden: true });
  const saveFilePaths: IEntry[] = filePaths.filter((file) => path.extname(file.filePath) === '.sfs');
  const failedSaves: string[] = [];
  const saves: ISaveList = await saveFilePaths.reduce(async (accumP, file) => {
    const accum = await accumP;
    try {
      const save = await createSaveGame(api, file.filePath);
      if (save) {
        save.Filename = path.basename(file.filePath);
        accum[path.basename(file.filePath)] = save;
      }
    } catch (err) {
      failedSaves.push(file.filePath);
      log('error', `sfSaveTool failed: ${path.basename(file.filePath)} - ${err.message}`);
      return accum;
    }
    return accum;
  }, Promise.resolve({}));
  const t = api.translate;
  if (failedSaves.length > 0) {
    api.sendNotification({
      type: 'warning',
      message: `Failed to read ${failedSaves.length} savegame(s)`,
      actions: [
        {
          title: 'More', action: (dismiss) => {
            api.showDialog('info', 'Failed to read savegame(s)', {
              text: `Failed to read ${failedSaves.length} savegame(s). This may be simply down to being an old save (< 122). Vortex only works with save games saved since the Creation update. See log for more information.`,
              message: failedSaves.join('\n'),
            }, [
              { label: 'Close', action: () => dismiss() },
            ])
          }
        },
      ]
    })
  }

  return Promise.resolve(saves);
};
