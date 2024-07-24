/* eslint-disable */
import path from 'path';
import { fs, log, types, util } from 'vortex-api';
import { ISaveGame, ISaveList } from './types';
import { useTranslation } from 'react-i18next';
import { mygamesPath, walkPath } from '../../util';
import { outputJSON, outputStdout } from '../../SFSaveToolWrapper';

import { IEntry } from 'turbowalk';

const createSaveGame = async (api: types.IExtensionApi, saveFilePath: string): Promise<ISaveGame> => {
  const state = api.getState();
  const ignoreSaveVersion = util.getSafe(state, ['settings', 'starfield', 'ignoreSaveVersion'], undefined);
  return outputStdout(api, { saveFilePath, ignoreSaveVersion });
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
      failedSaves.push(path.basename(file.filePath));
      log('error', `sfSaveTool failed: ${path.basename(file.filePath)} - ${err.message}`);
      return accum;
    }
    return accum;
  }, Promise.resolve({}));
  const t = api.translate;
  if (failedSaves.length > 0) {
    api.sendNotification({
      id: 'starfield-failed-parsing-saves',
      type: 'warning',
      message: `Failed to read ${failedSaves.length} ${failedSaves.length == 1 ? 'save' : 'saves'}`,
      actions: [
        {
          title: 'More',
          action: (dismiss) => {
            api.showDialog(
              'info',
              `Failed to read ${failedSaves.length} ${failedSaves.length == 1 ? 'save' : 'saves'}`,
              {
                text: `This issue is likely (but not definitely) due to the ${
                  failedSaves.length == 1 ? 'file' : 'files'
                } being created before the 1.12.30 game update as Vortex only supports saves created with that version or later. Any save file created prior to this update has a version number lower than 122, which Vortex does not process by default. Please refer to the log for further details.`,
                message: failedSaves.join('\n'),
              },
              [
                {
                  label: 'Open Saves Folder',
                  action: () => {
                    dismiss();
                    util.opn(path.join(mygamesPath(), 'Saves')).catch(() => null);
                  },
                },
                { label: 'Close', action: () => dismiss() },
              ]
            );
          },
        },
      ],
    });
  }
  log('debug', `Finished reading saves directory, found ${Object.keys(saves).length} saves`);
  return Promise.resolve(saves);
};
