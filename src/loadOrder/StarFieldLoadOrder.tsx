/* eslint-disable */
import React from 'react';
import path from 'path';
import { fs, selectors, types, util } from 'vortex-api';

import { IPluginRequirement } from '../types';
import {
  GAME_ID, PLUGINS_TXT, PLUGINS_BACKUP, MOD_TYPE_ASI_MOD, PLUGINS_ENABLER_FILENAME, NATIVE_PLUGINS,
  DLL_EXT, ASI_EXT, MOD_TYPE_DATAPATH, SFSE_EXE, TARGET_ASI_LOADER_NAME, DATA_PLUGINS, MISSING_PLUGINS_NOTIFICATION_ID,
} from '../common';
import { download } from '../downloader';
import InfoPanel from '../views/InfoPanel';
import { walkPath, findModByFile, forceRefresh } from '../util';

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
  public clearStateOnPurge?: boolean | undefined;
  public usageInstructions?: React.ComponentType<{}>;
  public noCollectionGeneration?: boolean | undefined;

  private mApi: types.IExtensionApi;
  private mOnInstallPluginsEnabler: () => void;

  constructor(api: types.IExtensionApi) {
    this.gameId = GAME_ID;
    this.clearStateOnPurge = true;
    this.toggleableEntries = true;
    this.noCollectionGeneration = true;
    this.usageInstructions = () => (<InfoPanel onInstallPluginsEnabler={this.mOnInstallPluginsEnabler} />);
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

    const invalidEntries = [];
    const loadOrder: types.LoadOrder = [];

    // TODO: merge the test file migration with the deserialized LO - having these separate is a bit messy.

    // Find out which plugins are actually deployed to the data folder.
    const fileEntries = await walkPath(path.join(dataPath, 'Data'), { recurse: false });
    const plugins = fileEntries.filter(file => DATA_PLUGINS.includes(path.extname(file.filePath)));
    const isInDataFolder = (plugin: string) => plugins.some(file => path.basename(file.filePath).toLowerCase() === plugin.toLowerCase());
    const isModEnabled = (modId: string) => {
      const state = this.mApi.getState();
      const profile = selectors.activeProfile(state);
      return util.getSafe(profile, ['modState', modId, 'enabled'], false);
    };
    const testFiles = await migrateTestFiles(this.mApi);
    if (testFiles.length > 0) {
      for (const file of testFiles) {
        const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, file);
        const invalid = !mod && !isInDataFolder(file);
        const loEntry = {
          enabled: !invalid,
          id: file,
          name: file,
          modId: !!mod?.id ? isModEnabled(mod.id) ? mod.id : undefined : undefined,
          locked: invalid,
          data: {
            isInvalid: invalid,
          }
        }
        if (invalid) {
          invalidEntries.push(loEntry);
        } else {
          loadOrder.push(loEntry);
        }
      }
    }

    const currentLO = await this.deserializePluginsFile();
    for (const plugin of currentLO) {
      if (currentLO.indexOf(plugin) === 0 && plugin.startsWith('#')) {
        continue;
      }
      const name = plugin.replace(/\#|\*/g, '');
      const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, name);
      // Plugin is invalid if it doesn't exist in the data folder. (And isn't a Vortex mod)
      const invalid = !mod && !isInDataFolder(name);
      const enabled = plugin.startsWith('*');
      const loEntry: types.ILoadOrderEntry = {
        enabled: enabled && !invalid,
        id: name,
        name: name,
        modId: !!mod?.id ? isModEnabled(mod.id) ? mod.id : undefined : undefined,
        locked: invalid,
        data: {
          isInvalid: invalid,
        }
      }
      if (invalid) {
        invalidEntries.push(loEntry);
      } else {
        if (isInDataFolder(name)) {
          loadOrder.push(loEntry);
        }
      }
    }

    for (const plugin of plugins) {
      const pluginName = path.basename(plugin.filePath);
      if (loadOrder.find(entry => entry.name === pluginName)) {
        continue;
      }
      const mod = await findModByFile(this.mApi, MOD_TYPE_DATAPATH, pluginName);
      const loEntry: types.ILoadOrderEntry = {
        enabled: true,
        id: pluginName,
        name: pluginName,
        modId: !!mod?.id ? isModEnabled(mod.id) ? mod.id : undefined : undefined,
      }
      loadOrder.push(loEntry);
    }

    let nativeIdx = 0;
    const nextNativeIdx = () => nativeIdx++;
    for (const plugin of NATIVE_PLUGINS) {
      // Make sure the native plugin is deployed to the game's data folder.
      let idx = plugins.findIndex(entry => path.basename(entry.filePath.toLowerCase()) === plugin);
      if (idx === -1) {
        continue;
      }

      // At this point we know that the native plugin is deployed to the data folder.
      idx = loadOrder.findIndex(entry => entry.name.toLowerCase() === plugin);
      let nativePlugin: types.ILoadOrderEntry[] = loadOrder.splice(idx, 1);
      nativePlugin[0].locked = true;
      loadOrder.splice(nextNativeIdx(), 0, nativePlugin[0]);
    }

    if (invalidEntries.length > 0) {
      this.mApi.sendNotification({
        type: 'warning',
        title: 'Missing Plugins Detected',
        message: 'Some plugins are missing from your data folder. These plugins will be commented out in your plugins file. To remove them, modify your plugins.txt file manually or click the "Reset Plugins File" button.',
        id: MISSING_PLUGINS_NOTIFICATION_ID,
      });
    } else {
      this.mApi.dismissNotification(MISSING_PLUGINS_NOTIFICATION_ID);
    }

    const result = [].concat(loadOrder);

    // This is a bit hacky but necessary to keep the native plugins at the top of the load order.
    await this.serializeLoadOrder(result, []);
    return Promise.resolve(result);
  }

  public async validate(prev: types.LoadOrder, current: types.LoadOrder): Promise<types.IValidationResult> {
    // if (!this.isLOManagedByVortex()) {
    //   return Promise.resolve(undefined);
    // }

    // const state = this.mApi.getState();
    // const discovery = selectors.discoveryByGame(state, GAME_ID);
    // const gamePath = !!discovery?.path ? discovery.path : undefined;
    // if (gamePath === undefined) {
    //   return Promise.resolve({ invalid: [{ id: GAME_ID, reason: 'Game is not discovered' }]} );
    // }
    // const invalid = [];
    // const dataPath = path.join(gamePath, 'Data');
    // for (const entry of current) {
    //   try {
    //     await fs.statAsync(path.join(dataPath, entry.name));
    //   } catch (err) {
    //     invalid.push({ id: entry.id, reason: 'File not found' });
    //   }
    // }

    // return invalid.length > 0 ? Promise.resolve({ invalid }) : Promise.resolve(undefined);
    return Promise.resolve(undefined);
  }

  public async onFixInvalidPlugins(): Promise<void> {
    const deserialzed = await this.deserializeLoadOrder();
    const valid = deserialzed.filter(entry => entry.data?.isInvalid !== true);
    await this.serializeLoadOrder(valid, []);
    return Promise.resolve();
  }

  private async onInstallPluginsEnabler(): Promise<void> {
    const discovery = selectors.discoveryByGame(this.mApi.getState(), GAME_ID);
    // Default to the steam store if we can't figure out the store.
    const gameStore = !!discovery?.store ? discovery.store : 'steam';
    const requiredMods = PLUGIN_REQUIREMENTS[gameStore];
    try {
      await download(this.mApi, requiredMods);
      this.mApi.store.dispatch(setPluginsEnabler(true));
      forceRefresh(this.mApi);
    } catch (err) {
      this.mApi.showErrorNotification('Failed to download required mods.', err);
    }
  }

  private async serializePluginsFile(plugins: types.ILoadOrderEntry[]): Promise<void> {
    const data = plugins.map(plugin => {
      // Strip the native plugins from whatever we write to the file as it's uneccessary.
      if (NATIVE_PLUGINS.includes(plugin.name.toLowerCase())) {
        return '';
      }
      const invalid = plugin.data?.isInvalid ? '#' : '';
      const enabled = plugin.enabled ? '*' : '';
      return `${invalid}${enabled}${plugin.name}`
    });
    data.splice(0, 0, '# This file was automatically generated by Vortex. Do not edit this file.');
    await fs.writeFileAsync(PLUGINS_TXT, data.filter(plug => !!plug).join('\n'), { encoding: 'utf8' });
  }

  private async deserializePluginsFile(): Promise<string[]> {
    try {
      const targetFile = await fs.statAsync(PLUGINS_BACKUP)
        .then(() => PLUGINS_BACKUP)
        .catch(() => PLUGINS_TXT);
      const data = await fs.readFileAsync(targetFile, 'utf8');
      const lines = data.split('\n').filter(line => line.trim().length > 0);
      return Array.from(new Set(lines));
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