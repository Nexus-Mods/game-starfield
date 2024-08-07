/* eslint-disable */
import path from 'path';
import { parse, stringify } from 'ini-comments';
import { GAME_ID, ASI_MOD_INI_NAME } from '../common';
import { sanitizeIni, deepMerge } from '../util';
import { fs, log, types } from 'vortex-api';

export function testASIMergeIni(game: types.IGame, discovery:
                             types.IDiscoveryResult): types.IMergeFilter | undefined {
  if (game.id !== GAME_ID) {
    return undefined;
  }
  return {
    baseFiles: (deployedFiles: types.IDeployedFile[]) =>
      deployedFiles.map(f => ({
        in: f.source,
        out: ASI_MOD_INI_NAME
      })),
    filter: filePath => path.extname(filePath) === '.ini',
  };
}

export async function mergeASIIni(filePath: string, mergeDir: string): Promise<void> {
  const mergedFilePath = path.join(mergeDir, ASI_MOD_INI_NAME);
  const iniContent = (await fs.readFileAsync(filePath, 'utf-8').catch(err => ''));
  const mergedContent = (await fs.readFileAsync(mergedFilePath, 'utf-8').catch(err => ''));
  try {
    const ini = parse(iniContent, { retainComments: true });
    const mergedIni = parse(mergedContent, { retainComments: true });
    const merged = deepMerge(mergedIni, ini);
    const newIniContent = sanitizeIni(stringify(merged, { retainComments: true, whitespace: true }));
    await fs.writeFileAsync(mergedFilePath, newIniContent, {
      encoding: 'utf-8'
    });
    return Promise.resolve();
  } catch (err) {
    log('error', 'Error merging INI', { message: err.message, filePath, mergeDir });
    return Promise.reject(err);
  }
}
