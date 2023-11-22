/* eslint-disable */
import React from 'react';
import path from 'path';
import { fs, selectors, types, util } from 'vortex-api';

import { IPluginRequirement } from '../types';
import {
  GAME_ID, PLUGINS_TXT, MOD_TYPE_ASI_MOD, PLUGINS_ENABLER_FILENAME,
  DLL_EXT, ASI_EXT, MOD_TYPE_DATAPATH, SFSE_EXE, TARGET_ASI_LOADER_NAME, DATA_PLUGINS,
} from '../common';
import { download } from '../downloader';
import InfoPanel from '../views/InfoPanel';
import { walkPath, findModByFile } from '../util';

import { migrateTestFiles } from './testFileHandler';
import { setPluginsEnabler } from '../actions/settings';

type PluginRequirements = { [gameStore: string]: IPluginRequirement[] };
export const PLUGIN_REQUIREMENTS: PluginRequirements = {
  steam: [
    {
      fileName: SFSE_EXE,
      modType: '',
      modId: 106,
      modUrl: 'https://www.nexusmods.com/starfield/mods/106?tab=files',
      findMod: (api: types.IExtensionApi) => findModByFile(api, '', SFSE_EXE),
    },
    {
      fileName: PLUGINS_ENABLER_FILENAME + DLL_EXT,
      modType: MOD_TYPE_DATAPATH,
      modId: 4157,
      modUrl: 'https://www.nexusmods.com/starfield/mods/4157?tab=files',
      findMod: (api: types.IExtensionApi) => findModByFile(api, MOD_TYPE_DATAPATH, PLUGINS_ENABLER_FILENAME + DLL_EXT),
      fileFilter: (file: string) => file.toLowerCase().includes('sfse')
    }
  ],
  xbox: [
    {
      fileName: TARGET_ASI_LOADER_NAME,
      modType: '',
      userFacingName: 'Ultimate ASI Loader',
      githubUrl: 'https://api.github.com/repos/ThirteenAG/Ultimate-ASI-Loader',
      findMod: (api: types.IExtensionApi) => findModByFile(api, '', TARGET_ASI_LOADER_NAME),
    },
    {
      fileName: PLUGINS_ENABLER_FILENAME + ASI_EXT,
      modType: MOD_TYPE_ASI_MOD,
      modId: 4157,
      modUrl: 'https://www.nexusmods.com/starfield/mods/4157?tab=files',
      findMod: (api: types.IExtensionApi) => findModByFile(api, MOD_TYPE_ASI_MOD, PLUGINS_ENABLER_FILENAME + ASI_EXT),
      fileFilter: (file: string) => file.toLowerCase().includes('gamepass'),
    }
  ],
}

class StarFieldLoadOrder implements types.ILoadOrderGameInfo {
  public gameId: string;
  public toggleableEntries?: boolean | undefined;
  public usageInstructions?: React.ComponentType<{}>;
  public noCollectionGeneration?: boolean | undefined;
  private mApi: types.IExtensionApi;
  private mOnInstallPluginsEnabler: () => void;
  constructor(api: types.IExtensionApi) {
    this.gameId = GAME_ID;
    this.toggleableEntries = true;
    this.noCollectionGeneration = true;
    this.usageInstructions = () =>
    (<InfoPanel
      onInstallPluginsEnabler={this.mOnInstallPluginsEnabler}
    />);
    this.mApi = api;
    this.deserializeLoadOrder = this.deserializeLoadOrder.bind(this);
    this.serializeLoadOrder = this.serializeLoadOrder.bind(this);
    this.validate = this.validate.bind(this);
    this.mOnInstallPluginsEnabler = this.onInstallPluginsEnabler.bind(this);

  }

  public async serializeLoadOrder(loadOrder: types.LoadOrder, prev: types.LoadOrder): Promise<void> {
    if (!this.isLOManagedByVortex()) {
      return Promise.resolve();
    }
    await fs.ensureDirWritableAsync(path.dirname(PLUGINS_TXT));
    return this.serializePluginsFile(loadOrder);
  }

  public async deserializeLoadOrder(): Promise<types.LoadOrder> {
    if (!this.isLOManagedByVortex()) {
      return Promise.resolve([]);
    }
    const state = this.mApi.getState();
    const discovery = selectors.discoveryByGame(state, GAME_ID);
    const dataPath = !!discovery?.path ? discovery.path : undefined;
    if (dataPath === undefined) {
      return Promise.resolve([]);
    }

    const loadOrder: types.LoadOrder = [];
    const testFiles = await migrateTestFiles(this.mApi);
    if (testFiles.length > 0) {
      for (const file of testFiles) {
        const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, file);
        const loEntry = {
          enabled: true,
          id: mod?.id ?? file,
          name: file,
          modId: mod?.id,
        }
        loadOrder.push(loEntry);
      }
    }
    const currentLO = await this.deserializePluginsFile();
    for (const plugin of currentLO) {
      if (plugin.startsWith('#')) {
        continue;
      }
      const enabled = plugin.startsWith('*');
      const name = enabled ? plugin.substring(1) : plugin;
      const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, name);
      const loEntry: types.ILoadOrderEntry = {
        enabled: enabled,
        id: mod?.id ?? name,
        name: name,
        modId: mod?.id,
      }
      loadOrder.push(loEntry);
    }
    // Check if there are any plugins that aren't in the plugins.txt file
    const fileEntries = await walkPath(path.join(dataPath, 'Data'), { recurse: false });
    const plugins = fileEntries.filter(file => DATA_PLUGINS.includes(path.extname(file.filePath)));
    for (const plugin of plugins) {
      const pluginName = path.basename(plugin.filePath);
      if (loadOrder.find(entry => entry.name === pluginName)) {
        continue;
      }
      const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, pluginName);
      const loEntry: types.ILoadOrderEntry = {
        enabled: true,
        id: mod?.id ?? pluginName,
        name: pluginName,
        modId: mod?.id,
      }
      loadOrder.push(loEntry);
    }

    return Promise.resolve(loadOrder);
  }

  public async validate(prev: types.LoadOrder, current: types.LoadOrder): Promise<types.IValidationResult> {
    if (!this.isLOManagedByVortex()) {
      return Promise.resolve(undefined);
    }

    const state = this.mApi.getState();
    const discovery = selectors.discoveryByGame(state, GAME_ID);
    const gamePath = !!discovery?.path ? discovery.path : undefined;
    if (gamePath === undefined) {
      return Promise.resolve({ invalid: [{ id: GAME_ID, reason: 'Game is not discovered' }]} );
    }
    const invalid = [];
    const dataPath = path.join(gamePath, 'Data');
    for (const entry of current) {
      try {
        await fs.statAsync(path.join(dataPath, entry.name));
      } catch (err) {
        invalid.push({ id: entry.id, reason: 'File not found' });
      }
    }

    return invalid.length > 0 ? Promise.resolve({ invalid }) : Promise.resolve(undefined);
  }

  private async onInstallPluginsEnabler(): Promise<void> {
    const discovery = selectors.discoveryByGame(this.mApi.getState(), GAME_ID);
    // Default to the steam store if we can't figure out the store.
    const gameStore = !!discovery?.store ? discovery.store : 'steam';
    const requiredMods = PLUGIN_REQUIREMENTS[gameStore];
    this.mApi.store.dispatch(setPluginsEnabler(true));
    try {
      await download(this.mApi, requiredMods);
    } catch (err) {
      this.mApi.showErrorNotification('Failed to download required mods.', err);
    }
  }

  private async serializePluginsFile(plugins: types.ILoadOrderEntry[]): Promise<void> {
    const data = plugins.map(plugin => {
      const enabled = plugin.enabled ? '*' : '';
      return `${enabled}${plugin.name}`
    });
    data.splice(0, 0, '# This file was automatically generated by Vortex. Do not edit this file.');
    await fs.writeFileAsync(PLUGINS_TXT, data.join('\n'), { encoding: 'utf8' });
  }

  private async deserializePluginsFile(): Promise<string[]> {
    try {
      const data = await fs.readFileAsync(PLUGINS_TXT, 'utf8');
      return data.split('\n').filter(line => line.trim().length > 0);
    } catch (err) {
      return [];
    }
  }

  private isLOManagedByVortex(): boolean {
    const state = this.mApi.getState();
    return util.getSafe(state, ['settings', 'starfield', 'pluginEnabler'], false);
  }
}

export default StarFieldLoadOrder;