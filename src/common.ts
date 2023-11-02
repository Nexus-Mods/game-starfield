export const NS = 'game-starfield';
export const GAME_ID = 'starfield';
export const XBOX_ID = 'BethesdaSoftworks.ProjectGold';
export const STEAMAPP_ID = '1716740';

export const MOD_TYPE_DATAPATH = 'starfield-data-folder';
export const JUNCTION_NOTIFICATION_ID = 'starfield-junction-notif';
export const MY_GAMES_DATA_WARNING = 'starfield-my-games-data-warning';

export const DATA_SUBFOLDERS = [
  'Meshes',
  'Textures',
  'FaceGen',
  'Music',
  'Sound',
  'Sounds',
  'MaxHeights',
  'VIS',
  'Grass',
  'Strings',
  'Materials',
  'LODSettings',
  'Misc',
  'ShadersFX',
  'PlanetData',
  'Space',
  'Terrian',
  'GeoExporter',
  'Noise',
  'Particles',
  'Geometries',
  'Scripts',
  'SFSE',
  'LOD',
  'Video',
  'Interface'
];

export const TOP_LEVEL_COMPATIBILITY_FOLDERS = [
  'root',
  'Starfield',
  'Starfield root'
];

export const DATA_EXTENSIONS = [
  '.ba2', '.esm', '.esp', '.esl'
];

export const ROOT_EXTENSIONS = [
  // '.ini',
  '.dll',
  '.exe'
];

export const ROOT_FOLDERS = [
  'Plugins', //ASI loader uses this... e.g. https://www.nexusmods.com/starfield/mods/252
  'Tools'
];

export const MODULE_CONFIG = 'moduleconfig.xml';
export const SFSE_EXE = 'sfse_loader.exe';

export const SFCUSTOM_INI = 'StarfieldCustom.ini';

export const SFCUSTOM_INI_TEXT = '[Archive]\nbInvalidateOlderFiles=1\nsResourceDataDirsFinal=\n\n';

export const JUNCTION_TEXT = '[color=red]IMPORTANT:[/color] Using a file syncing cloud drive service such as OneDrive, Google Drive or Dropbox are known to cause issues with this method due to the inconsistencies in how they handle folder junctions. The most severe of these issues can lead to the loss of data. For compatibility information about individual services, please click [url=https://modding.wiki/en/vortex/users/starfield-folder-junction-issues]https://modding.wiki/en/vortex/users/starfield-folder-junction-issues[/url] before continuing with this fix.[br][/br][br][/br]'
                           + 'Starfield breaks the Bethesda-game trend by having a secondary data folder at "Documents\\My Games\\Starfield\\Data" which, in most case, overrides the regular Data folder in the game installation. To get around this, Vortex can create a specific type of shortcut (called a folder junction) between the regular Data folder and the one in the My Games folder. This tricks the game engine into using the same Data folder and simplifies mod installation.[br][/br][br][/br]'
                           + 'Existing contents of the My Games folder will be copied over to the game data folder and backed up. To remove the folder junction in future, please go to Settings > Mods and disable "Use Folder Junction".';