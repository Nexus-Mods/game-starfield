/* eslint-disable */
import { DATA_EXTENSIONS, DATA_SUBFOLDERS, TOP_LEVEL_COMPATIBILITY_FOLDERS, SFSE_EXE, ROOT_ASSEMBLIES, ROOT_FILE_EXTENSIONS } from './common';

function dirToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  return escape ? `(^|\/)${input}(\/|$)` : `(^|/)${input}(/|$)`;
}

function extToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  return escape ? `[^\/]*\\${input}$` : `[^/]*\\${input}$`;
}

function fileEndToWordExp(input: string) {
  return input + '$';
}


const gamebryoFileTopLevel: string[] = [].concat([...ROOT_ASSEMBLIES, SFSE_EXE].map(fileEndToWordExp));

export function getStopPatterns(escape: boolean = false) {
  const gamebryoSubLevel = DATA_SUBFOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));
  const gamebryoFilePatterns = DATA_EXTENSIONS.map((val, idx, arr) => extToWordExp(val.toLowerCase(), idx, arr, escape));
  const uniPatterns: string[] = ['fomod'].map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));
  const endPatterns: string[] = ['sfse'].map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));
  gamebryoFilePatterns.push('fomod/ModuleConfig.xml$');
  return [].concat(uniPatterns, gamebryoFilePatterns, gamebryoSubLevel, endPatterns);
}

export function getTopLevelPatterns(escape: boolean = false) {
  const gamebryoTopExtensions = ROOT_FILE_EXTENSIONS.map((val, idx, arr) => extToWordExp(val.toLowerCase(), idx, arr, escape));
  const gamebryoTopLevel = TOP_LEVEL_COMPATIBILITY_FOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, escape));
  return [].concat(gamebryoTopLevel, gamebryoFileTopLevel, gamebryoTopExtensions);
}