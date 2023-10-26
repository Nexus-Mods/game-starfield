/* eslint-disable */
import { DATA_EXTENSIONS, DATA_SUBFOLDERS, TOP_LEVEL_COMPATIBILITY_FOLDERS, SFSE_EXE } from './common';

function dirToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  return escape ? '(^|\/)' + input + '(\/|$)' : '(^|/)' + input + '(/|$)';
}

const uniPatterns: string[] = ['fomod'].map(dirToWordExp);
function extToWordExp(input: string, index?: number, array?: string[], escape?: boolean): string {
  return escape ? '[^\/]*\\' + input + '$' : '[^/]*\\' + input + '$';
}

function fileEndToWordExp(input: string) {
  return input + '$';
}

const gamebryoTopLevel: string[] = TOP_LEVEL_COMPATIBILITY_FOLDERS.map((val, idx, arr) => dirToWordExp(val.toLowerCase(), idx, arr, true));
const gamebryoFileTopLevel: string[] = [].concat([SFSE_EXE].map(fileEndToWordExp));

const gamebryoSubLevel: string[] = DATA_SUBFOLDERS.map(dir => dirToWordExp(dir.toLowerCase()));
const gamebryoFilePatterns: string[] = DATA_EXTENSIONS.map(extToWordExp);
gamebryoFilePatterns.push('fomod/ModuleConfig.xml$');

export function getStopPatterns() {
  return [].concat(uniPatterns, gamebryoFilePatterns, gamebryoSubLevel, ['sfse'].map(dirToWordExp));
}

export function getTopLevelPatterns() {
  return [].concat(gamebryoTopLevel, gamebryoFileTopLevel);
}