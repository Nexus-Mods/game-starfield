import { types } from "vortex-api";
import { IMod } from "vortex-api/lib/types/IState";

export type LockedState = "true" | "false" | "always" | "never";
export type LoadOrder = ILoadOrderEntry[];
export type LoadOrderManagementType = 'gamebryo' | 'dnd';

export interface IGithubDownload {
  fileName: string;
  url: string;
}

export interface IProps {
  state: types.IState;
  api: types.IExtensionApi;
  profile: types.IProfile;
  discovery: types.IDiscoveryResult;
  //mods: { [modId: string]: types.IMod };
  mods?: Record<string, IMod>;
}

export interface IDirectoryProps {
  gameDataFolder: string;
  myGamesFolder: string;
  myGamesData: string;
}

export interface IPluginRequirement {
  fileName: string;
  modType: string;
  modId?: number;
  userFacingName?: string;
  githubUrl?: string;
  modUrl?: string;
  findMod: (api: types.IExtensionApi) => Promise<types.IMod>;
  fileFilter?: (file: string) => boolean;
}

export type IJunctionProps = IProps & IDirectoryProps;

// Can use this for INI tweaks in the future too.
export interface IStarfieldCollectionsData {
  extensionVersion?: string;
}

export interface ISerializableData {
  // The prefix we want to add to the folder name on deployment.
  prefix: string;
}

export interface ILoadOrderEntry {
  // An arbitrary unique Id.
  id: string;

  // This property is required by the FBLO API functions.
  // This game will not be using checkboxes so we're just going to
  // assign "true" when we build the load order entry instance.
  enabled: boolean;

  // Human readable name for the mod - this is what we display to the user
  // in the load order page.
  name: string;

  // The modId as stored by Vortex in its application state. Remember, in
  //  other games, 1 modId could have several mod entries in the load order
  //  page that are tied to it. That's why we have two separate id properties.
  modId?: string;

  // Any additional data we want to store in the load order file.
  data?: ISerializableData;
}

// Collections - These should ALL be exported as part of the API!
export type UpdatePolicy = 'exact' | 'latest' | 'prefer';
export type SourceType = 'browse' | 'manual' | 'direct' | 'nexus' | 'bundle';

export interface ICollectionSourceInfo {
  type: SourceType;
  url?: string;
  // textual download/installation instructions (used with source 'manual' and 'browse')
  instructions?: string;
  // numerical mod id (used with source 'nexus')
  modId?: number;
  // numerical file id (used with source 'nexus')
  fileId?: number;
  // determines which file to get if there is an update compared to what's in the mod pack
  // Not supported with every source type
  updatePolicy?: UpdatePolicy;
  adultContent?: boolean;

  md5?: string;
  fileSize?: number;
  logicalFilename?: string;
  fileExpression?: string;
  tag?: string;
}

export interface ICollectionModDetails {
  type?: string;
  category?: string;
}

export interface ICollectionMod {
  name: string;
  version: string;
  optional: boolean;
  domainName: string;
  source: ICollectionSourceInfo;
  // hashes?: types.IFileListItem[];
  hashes?: any;
  // installer-specific data to replicate the choices the author made
  choices?: any;
  patches?: { [filePath: string]: string };
  instructions?: string;
  author?: string;
  details?: ICollectionModDetails;
  phase?: number;
  fileOverrides?: string[];
}

export type RuleType = 'before' | 'after' | 'requires' | 'conflicts' | 'recommends' | 'provides';

export interface ICollectionModRule {
  source: types.IModReference;
  type: RuleType;
  reference: types.IModReference;
}

export interface ICollectionTool {
  name: string;
  exe: string;
  args: string[];
  cwd: string;
  env: { [key: string]: any };
  shell: boolean;
  detach: boolean;
  onStart: 'hide' | 'hide_recover' | 'close';
}

export interface ICollection extends Partial<IStarfieldCollectionsData> {
  mods: ICollectionMod[];
  modRules: ICollectionModRule[];
}

export interface ICollectionAttributes {
  instructions?: { [modId: string]: string };
  source?: { [modId: string]: { type: SourceType, url?: string, instructions?: string } };
  installMode?: { [modId: string]: string };
  saveEdits?: { [modId: string]: boolean };
  fileOverrides?: { [modId: string]: boolean };
}

export interface ICollectionModRuleEx extends ICollectionModRule {
  sourceName: string;
  referenceName: string;
}
