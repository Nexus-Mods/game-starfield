import {
  IExtensionApi,
  IExtensionContext,
  IModInfo,
} from "vortex-api/lib/types/api";
import { RedownloadMode } from "vortex-api/lib/extensions/download_management/DownloadManager";

/**
 *  A wrapper class to strongly type vortex commands that are accessed via api.events.emit
 */
export class VortexCommands {
  private _context: IExtensionContext;

  constructor(context: IExtensionContext) {
    this._context = context;
  }

  public async DeployModsAsync(): Promise<void> {
    // test wrapper around the vortex api command just to get a better async function but without older style callback functions

    return new Promise((resolve, reject) => {
      this._context.api.events.emit("deploy-mods", (error: Error) => {
        if (error) {
          console.error("Vortex_DeployModsAsync Error " + error);
          reject();
        }
      });
    });
  }

  public async PurgeModsAsync(allowFallback: boolean): Promise<void> {
    // test wrapper around the vortex api command just to get a better async function but without older style callback functions

    return new Promise((resolve, reject) => {
      this._context.api.events.emit(
        "purge-mods",
        allowFallback,
        (error: Error) => {
          if (error) {
            console.error("Vortex_PurgeModsAsync Error " + error);
            reject();
          }
        },
      );
    });
  }

  public async StartDownloadAsync(
    url: string,
    modInfo: IModInfo,
    fileName: string,
    redownload: RedownloadMode,
  ): Promise<string> {
    // test wrapper around the vortex api command just to get a better async function but without older style callback functions

    return new Promise((resolve, reject) => {
      //upload the file, then call the callback with the location of the file
      this._context.api.events.emit(
        "start-download",
        [url],
        modInfo,
        fileName,
        (error: Error, id: string) => {
          if (error) {
            console.error("Vortex_StartDownloadAsync Error " + error);
            reject();
          }

          console.log("Vortex_StartDownloadAsync Complete id=" + id);
          resolve(id);
        },
        redownload,
      );
    });
  }
}
