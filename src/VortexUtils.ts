import { util } from "vortex-api";
/*

  console.log(`appData=${util.getVortexPath("appData")}`);
  console.log(`localAppData=${util.getVortexPath("localAppData")}`);
  console.log(`application=${util.getVortexPath("application")}`);
  console.log(`temp=${util.getVortexPath("temp")}`);
  console.log(`userData=${util.getVortexPath("userData")}`);
*/

/**
 * @returns Absolute path to users Roaming AppData folder. i.e. C:\Users\<username>\AppData\Roaming
 */
export function GetRoamingAppDataPath(): string {
  return util.getVortexPath("appData");
}

/**
 * @returns Absolute path to users Local AppData folder. i.e. C:\Users\<username>\AppData\Local
 */
export function GetLocalAppDataPath(): string {
  return util.getVortexPath("localAppData");
}

/**
 * @returns Absolute path to Vortex's User Data folder. i.e. C:\Users\<username>\AppData\Roaming\Vortex
 */
export function GetUserDataPath(): string {
  return util.getVortexPath("userData");
}

/**
 * @returns Absolute path to Vortex's Application folder. i.e. C:\Program Files\Black Tree Gaming Ltd\Vortex
 */
export function GetApplicationPath(): string {
  return util.getVortexPath("application");
}

/**
 * @returns Absolute path to Vortex's Temp folder. i.e. C:\Users\<username>\AppData\Roaming\Vortex\temp
 */
export function GetTempPath(): string {
  return util.getVortexPath("temp");
}

export function pad(value: string, padding: string, width: number) {
  return value.length >= width
    ? value
    : new Array(width - value.length + 1).join(padding) + value;
}
