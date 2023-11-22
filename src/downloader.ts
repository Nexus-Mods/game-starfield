/* eslint-disable */

import path from 'path';
import { actions, fs, selectors, types, util } from 'vortex-api';
import axios from 'axios';

import { GAME_ID } from './common';
import { IPluginRequirement } from './types';

export async function download(api: types.IExtensionApi, requirements: IPluginRequirement[]) {
  api.sendNotification({
    id: 'plugins-enabler-installing',
    message: 'Installing plugin enabler',
    type: 'activity',
    noDismiss: true,
    allowSuppress: false,
  });

  try {
    for (const req of requirements) {
      if (await req.findMod(api) !== undefined) {
        continue;
      }
      if (req?.modId !== undefined) {
        await downloadNexus(api, req);
      } else {
        const url = await getLatestReleaseDownloadUrl(api, req);
        const tempPath = path.join(util.getVortexPath('temp'), req.userFacingName ?? req.fileName + '.zip');
        await doDownload(url, tempPath);
        await importAndInstall(api, tempPath);
      }
    }
  } catch (err) {
    // Fallback here.
  } finally {
    api.dismissNotification('plugins-enabler-installing');
  }
}

async function importAndInstall(api: types.IExtensionApi, filePath: string) {
  api.events.emit('import-downloads', [filePath], (dlIds: string[]) => {
    const id = dlIds[0];
    if (id === undefined) {
      return;
    }
    api.events.emit('start-install-download', id, true, (err, modId) => {
      if (err !== null) {
        api.showErrorNotification('Failed to install repo', err, { allowReport: false });
      }
  
      const state = api.getState();
      const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
      const batch = [
        actions.setModAttributes(GAME_ID, modId, {
          installTime: new Date(),
          name: 'Plugin Enabler',
        }),
        actions.setModEnabled(profileId, modId, true),
      ];
      util.batchDispatch(api.store, batch);
      return Promise.resolve();
    });
  });
}

async function downloadNexus(api: types.IExtensionApi, requirement: IPluginRequirement) {
  if (api.ext?.ensureLoggedIn !== undefined) {
    await api.ext.ensureLoggedIn();
  }
  try {
    const modFiles = await api?.ext?.nexusGetModFiles(GAME_ID, requirement.modId);

    const fileTime = (input: any) => Number.parseInt(input.uploaded_time, 10);
    const file = modFiles
      .filter(file => requirement.fileFilter !== undefined ? requirement.fileFilter(file.file_name) : true)
      .filter(file => file.category_id === 1)
      .sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];

    if (file === undefined) {
      throw new util.ProcessCanceled('File not found');
    }

    const dlInfo = {
      game: GAME_ID,
      name: requirement.fileName,
    };

    const nxmUrl = `nxm://${GAME_ID}/mods/${requirement.modId}/files/${file.file_id}`;
    const dlId = await util.toPromise<string>(cb =>
      api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, 'never', { allowInstall: false }));
    const modId = await util.toPromise<string>(cb =>
      api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
    const profileId = selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
    await actions.setModsEnabled(api, profileId, [modId], true, {
      allowAutoDeploy: false,
      installed: true,
    });
  } catch (err) {
    api.showErrorNotification('Failed to download/install requirement', err);
    util.opn(requirement?.modUrl || requirement.githubUrl).catch(() => null);
  } finally {
    api.dismissNotification('plugins-enabler-installing');
  }
}

async function getLatestReleaseDownloadUrl(api: types.IExtensionApi, requirement: IPluginRequirement): Promise<string | null> {
  try {
    const response = await axios.get(`${requirement.githubUrl}/releases/latest`);
    if (response.status === 200) {
      const release = response.data;
      if (release.assets.length > 0) {
        return release.assets[0].browser_download_url;
      }
    }
  } catch (error) {
    api.showErrorNotification(
      'Error fetching the latest release url for {{repName}}',
      error, { allowReport: false, replace: { repName: requirement.fileName } });
  }

  return null;
}

export async function doDownload(downloadUrl: string, destination: string): Promise<void> {
  const response = await axios({
    method: 'get',
    url: downloadUrl,
    responseType: 'arraybuffer',
    headers: {
      "Accept-Encoding": "gzip, deflate",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    },
  });
  await fs.writeFileAsync(destination, Buffer.from(response.data));
}