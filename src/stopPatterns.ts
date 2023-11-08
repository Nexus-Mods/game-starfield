/* eslint-disable */
/*
  Hello current and future Vortex developers!
    Stay awhile and listen if you wish to defeat the "evil" that is stop patterns.

  The why: Unlike most modding platforms, Vortex aims to cater for the mod author's patterns when installing mods.
    Unfortunately when it comes to Starfield, mod authors will not follow a standard pattern when packaging their mods. So we need to be able to tell
    Vortex what to look for and where to deploy its files. This is where stop patterns come in, as they're designed to detect the shortest
    possible path prefix using regular expressions, and then deploy the mod's files relative to that path.

  The what: Starfield has a few different patterns that we need to be able to detect, so we'll go through them one by one.
    1. Top level files - these are files that are meant to be deployed to the root folder, and are generally used for executables, assemblies and .txt files.
    2. Data level files - these are the most common files, and are meant to be deployed to the Data folder (includes fomods).
    3. Data level subfiles - these are files that are meant to be deployed to a subfolder of the Data folder, usually plugins for SFSE.
  Mod authors may package these files relative to the game's root path, relative to the Data folder, or even loosely in the archive. 

  The how: We're going to use a few different functions to generate the patterns we need.
    1. dirToWordExp - generates a regex to match a folder name, and optionally a slash at the start and/or end of the string.
    2. extToWordExp - generates a regex to match a file extension, and optionally a slash at the start of the string.
    3. fileEndToWordExp - generates a regex to match a file name at the end of the string.
    4. getStopPatterns - generates the patterns for the Data folder.
    5. getTopLevelPatterns - generates the patterns for the root folder.
*/

// These arrays are used to generate the regexes for the stop patterns. Each array is a list of strings that will be used to generate a regex.
import { DATA_EXTENSIONS, DATA_SUBFOLDERS, TOP_LEVEL_COMPATIBILITY_FOLDERS, SFSE_EXE, ROOT_ASSEMBLIES, ROOT_FILE_EXTENSIONS } from './common';

function dirToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  // Wrap the input in a regex that will match the start and end of the string, and optionally a slash
  //  at the start and/or at the end of the string. This will ensure that we're matching the folder name
  //  regardless of whether it's at the start, middle or end of the path.
  // The escape parameter is optional if we wish to run the regex through a RegExp constructor.
  //  This is needed if we want to use the regex in a RegExp.test() call (which we are when ascertaining the modType of the mod).
  return escape ? `(^|\/)${input}(\/|$)` : `(^|/)${input}(/|$)`;
}

function extToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  // Wrap the input in a regex that will match the start and end of the string, and optionally a slash
  //  at the start of the string. This will ensure that we're matching the file extension regardless of how
  //  nested the file is.
  // the escape parameter is optional if we wish to run the regex through a RegExp constructor.
  return escape ? `[^\/]*\\${input}$` : `[^/]*\\${input}$`;
}

function fileEndToWordExp(input: string) {
  // Wrap the input in a regex that will match a filename _exactly_ at the end of the filepath.
  return input + '$';
}

// These are files we want to deploy to the root folder, fileEndToWordExp will ensure we match them exactly.
const gamebryoFileTopLevel: string[] = [].concat([...ROOT_ASSEMBLIES, SFSE_EXE].map(fileEndToWordExp));

export function getStopPatterns(escape: boolean = false): string[] {
  // There are several well know subfolders of the data folder which we define as DATA_SUBFOLDERS.
  //  e.g. Interface, Materials, Meshes, Scripts, ShadersFX, Sound, Strings, Textures, Video. The detection
  //  of these folders in a filePath is guaranteed to be a data level file, as the fomod_installer extension will modify
  //  the mod archive to ensure that the folders (and files) are deployed relative to the Data folder.
  const gamebryoSubLevel = DATA_SUBFOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));

  // Certain file extensions e.g. BSA, BA2, ESP, ESM, etc need to be deployed to the root of the data folder.
  //  we wrap these known extensions in a regex which is able to match them regardless of how nested they are.
  const gamebryoFilePatterns = DATA_EXTENSIONS.map((val, idx, arr) => extToWordExp(val.toLowerCase(), idx, arr, escape));
  gamebryoFilePatterns.push('fomod/ModuleConfig.xml$');

  // Fomods are a unique case, as they clearly highlight the shortest filepath prefix.
  const uniPatterns: string[] = ['fomod'].map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));

  // The detection of a SFSE directory signifies that we're dealing with a SFSE plugin, which is a data level subfile.
  const endPatterns: string[] = ['sfse'].map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));

  // The order of the patterns is important, as we want to match as quickly as possible and avoid false positives.
  //  1. We start off with the unique patterns first - in this case fomod.
  //  2. We then move onto the data level files - these are the most common files and there are fewer patterns to match.
  //  3. We then move onto the data level subfolders.
  //  4. End patterns are last resort, and should usually be kept for subfiles/folders that are unique to a specific mod.
  return [].concat(uniPatterns, gamebryoFilePatterns, gamebryoSubLevel, endPatterns);
}

export function getTopLevelPatterns(escape: boolean = false): string[] {
  // This function is used to generate the patterns for the root folder.
  //  We use these when attempting to ascertain the mod's modType.
  //  These patterns will be run first, and if they match then we can assume that the mod is a root folder mod.

  // Any EXE's/INI's/TXT's are generally deployed to the root folder.
  const gamebryoTopExtensions = ROOT_FILE_EXTENSIONS.map((val, idx, arr) => extToWordExp(val.toLowerCase(), idx, arr, escape));

  // The top level folders that are known to be deployed to the game's root folder.
  const gamebryoTopLevel = TOP_LEVEL_COMPATIBILITY_FOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));

  // The order still matters here, although we don't want to match too quickly as we may get false positives.
  return [].concat(gamebryoTopLevel, gamebryoFileTopLevel, gamebryoTopExtensions);
}