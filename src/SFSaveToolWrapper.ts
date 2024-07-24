/* eslint-disable */
import * as path from 'path';
import { log, types, util } from 'vortex-api';

import { ISaveGame } from './views/Saves/types';

import * as nodeUtil from 'util';
import * as child_process from 'child_process';

const exec = nodeUtil.promisify(child_process.exec);

const concurrencyLimiter: util.ConcurrencyLimiter = new util.ConcurrencyLimiter(20, () => true);

// This is probably overkill - mod extraction shouldn't take
//  more than a few seconds.
const TIMEOUT_MS = 10000;
const SAVE_TOOL_EXEC = 'StarfieldSaveTool.exe';

type SFSaveToolAction = 'output-json-file' | 'output-raw-file' | 'output-stdout';
interface ISFSaveToolOptions {
  saveFilePath: string;
  ignoreSaveVersion?: boolean;
}

export class SFSaveToolMissing extends Error {
  constructor() {
    super('SFSaveTool executable is missing - re-install the extension.');
    this.name = 'SFSaveToolMissing';
  }
}

export class SFSaveToolMissingDotNet extends Error {
  constructor() {
    super('SFSaveTool requires .NET 8 Desktop Runtime to be installed.');
    this.name = 'SFSaveToolMissingDotNet';
  }
}

export class SFSaveToolTimedOut extends Error {
  constructor() {
    super('SFSaveTool process timed out');
    this.name = 'SFSaveToolTimedOut';
  }
}

const execOpts: child_process.ExecOptions = {
  timeout: TIMEOUT_MS,
};

async function runSFSaveTool(api: types.IExtensionApi, action: SFSaveToolAction, opts: ISFSaveToolOptions): Promise<ISaveGame> {
  return new Promise((resolve, reject) =>
    concurrencyLimiter.do(async () => {
      const startTime = performance.now();
      let endTime: number;

      try {
        const result = await sfSaveTool(api, action, opts, execOpts);
        endTime = performance.now();
        log('debug', `sfSaveTool took ${(endTime - startTime).toFixed(2)} milliseconds to run. ${opts.saveFilePath}`);
        return resolve(result);
      } catch (err) {
        return reject(err);
      } finally {
      }
    })
  );
}

async function sfSaveTool(api: types.IExtensionApi, action: SFSaveToolAction, opts: ISFSaveToolOptions, execOpts: child_process.ExecOptions): Promise<ISaveGame> {
  return new Promise<ISaveGame>(async (resolve, reject) => {
    const exe = path.join(__dirname, SAVE_TOOL_EXEC);
    const args = action === 'output-stdout' ? [] : [`--${action}`];

    if (opts.ignoreSaveVersion) {
      args.push('--ignore-version');
    }
    try {
      const command = `"${exe}" "${opts.saveFilePath}" ${args.join(' ')}`;
      const { stdout, stderr } = await exec(command, execOpts);
      if (!!stderr) {
        return reject(new Error(`StarfieldSaveTool.exe failed: ${stderr}`));
      }
      if (['error', 'fatal'].some((x) => stdout.toLowerCase().startsWith(x))) {
        // Really?
        return reject(new Error(`StarfieldSaveTool.exe failed: ${stdout}`));
      } else {
        const save: ISaveGame = JSON.parse(stdout);
        return resolve(save);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        return reject(new SFSaveToolMissing());
      }

      if (err.message.includes('You must install or update .NET')) {
        return reject(new SFSaveToolMissingDotNet());
      }

      const error = new Error(`StarfieldSaveTool.exe failed: ${err.message}`);
      error['attachLogOnReport'] = true;
      return reject(error);
    }
  });
}

export async function outputStdout(api: types.IExtensionApi, opts: ISFSaveToolOptions) {
  return runSFSaveTool(api, 'output-stdout', opts);
}

export async function outputRaw(api: types.IExtensionApi, opts: ISFSaveToolOptions) {
  return runSFSaveTool(api, 'output-raw-file', opts);
}

export async function outputJSON(api: types.IExtensionApi, opts: ISFSaveToolOptions): Promise<ISaveGame> {
  let res;
  try {
    res = await runSFSaveTool(api, 'output-json-file', opts);
  } catch (error) {
    if (error instanceof SFSaveToolMissingDotNet) {
      log('error', 'Missing .NET', error.message);
      api.dismissNotification('sfsavetool-activity');
      api.showErrorNotification(
        'SFSaveTool requires .NET 8',
        'SFSaveTool requires .NET 8 Desktop Runtime to be installed.' +
          '[br][/br][br][/br]' +
          '[list=1][*]Download and Install [url=https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-desktop-8.0.3-windows-x64-installer].NET 8.0 Desktop Runtime from Microsoft[/url]' +
          '[*]Close Vortex' +
          '[*]Restart Computer' +
          '[*]Open Vortex[/list]',
        { id: 'sfsavetool-dotnet-error', allowReport: false, isBBCode: true }
      );
    }
  }

  //logDebug(`listPackage res=`, res);
  const lines = (res?.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length !== 0);

  //logDebug(`listPackage lines=`, lines);

  return lines;
}
