import path from 'path';
import { util } from 'vortex-api';

export const LOCAL_APP_DATA = path.join(util.getVortexPath('localAppData'), 'Starfield');
export const PLUGINS_TXT = path.join(LOCAL_APP_DATA, 'plugins.txt');
export const PLUGINS_BACKUP = path.join(util.getVortexPath('temp'), path.basename(PLUGINS_TXT) + '.bak');
export const PLUGINS_ENABLER_FILENAME = 'SFPluginsTxtEnabler';
export const NS = 'game-starfield';
export const GAME_ID = 'starfield';
export const XBOX_ID = 'BethesdaSoftworks.ProjectGold';
export const XBOX_APP_X_MANIFEST = 'appxmanifest.xml';
export const STEAMAPP_ID = '1716740';

export const MOD_TYPE_ASI_MOD = 'starfield-asi-mod';
export const MOD_TYPE_DATAPATH = 'starfield-data-folder';
export const JUNCTION_NOTIFICATION_ID = 'starfield-junction-notif';
export const MY_GAMES_DATA_WARNING = 'starfield-my-games-data-warning';
export const INSTALLING_REQUIREMENTS_NOTIFICATION_ID = 'starfield-installing-requirements';

// Below constraint is used for the GAME version. Not the extension.
export const PLUGIN_ENABLER_CONSTRAINT = '<1.12.0';

// This is the order we expect the native plugins to be arranged.
export const NATIVE_PLUGINS = ['starfield.esm', 'blueprintships-starfield.esm', 'oldmars.esm', 'constellation.esm'];
export const NATIVE_MID_PLUGINS = ['sfbgs003.esm', 'sfbgs006.esm', 'sfbgs007.esm', 'sfbgs008.esm'];
export const ALL_NATIVE_PLUGINS = [].concat(NATIVE_PLUGINS, NATIVE_MID_PLUGINS);

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
  'Interface',
];

export const TOP_LEVEL_COMPATIBILITY_FOLDERS = ['root', 'Starfield', 'Starfield root'];

export const DATA_PLUGINS = ['.esm', '.esp', '.esl'];
export const DATA_EXTENSIONS = ['.ba2', ...DATA_PLUGINS];

export const DLL_EXT = '.dll';
export const ASI_EXT = '.asi';
export const ROOT_FILE_EXTENSIONS = [ASI_EXT, '.ini', '.exe', '.txt'];

//ASI loader uses this... e.g. https://www.nexusmods.com/starfield/mods/252
export const ASI_ROOT_FOLDERS = ['Scripts', 'Plugins'];

export const MODULE_CONFIG = 'moduleconfig.xml';

// Known top level files - from an executable point of view we can probably assume
//  that all executables are destined for the root folder. Dlls are a bit more complicated
//  as they can be SFSE plugins. Fortunately we can specify a couple of well known
//  assemblies that are generally used for content loading.
export const SFSE_EXE = 'sfse_loader.exe';

// The ASI loader comes in a variety of flavours - yum.
export const ASI_LOADER_ASSEMBLIES = [
  'd3d8.dll',
  'd3d9.dll',
  'd3d10.dll',
  'd3d11.dll',
  'd3d12.dll',
  'ddraw.dll',
  'dinput.dll',
  'dinput8.dll',
  'dsound.dll',
  'msacm32.dll',
  'msvfw32.dll',
  'version.dll',
  'wininet.dll',
  'winmm.dll',
  'winhttp.dll',
  'xlive.dll',
  'binkw32.dll',
  'bink2w64.dll',
  'vorbisfile.dll',
  'binkw32hooked.dll',
  'bink2w64hooked.dll',
  'vorbishooked.dll',
];

export const ASI_LOADER_BACKUP = 'bink2w64hooked.dll';

// Whatever flavour of ASI loader the user downloads, we'll always use this name when installing it.
export const TARGET_ASI_LOADER_NAME = 'bink2w64.dll';

// In order for ASI mods to load global sets, the ini file needs to match the name of the assembly we use.
export const ASI_MOD_INI_NAME = TARGET_ASI_LOADER_NAME.replace('dll', 'ini');

export const ROOT_ASSEMBLIES = [...ASI_LOADER_ASSEMBLIES, 'vcruntime140_1.dll'];

export const SFCUSTOM_INI = 'StarfieldCustom.ini';
export const SFPREFS_INI = 'StarfieldPrefs.ini';

export const SFCUSTOM_INI_TEXT = '[Archive]\nbInvalidateOlderFiles=1\nsResourceDataDirsFinal=\n\n';

export const JUNCTION_TEXT =
  '[style=dialog-danger-text]IMPORTANT:[/style] Using a file syncing cloud drive service such as OneDrive, Google Drive or Dropbox are known to cause issues with this method due to the inconsistencies in how they handle folder junctions. The most severe of these issues can lead to the loss of data. For compatibility information about individual services, please click [url=https://modding.wiki/en/vortex/users/starfield-folder-junction-issues]https://modding.wiki/en/vortex/users/starfield-folder-junction-issues[/url] before continuing with this fix.[br][/br][br][/br]' +
  'Starfield breaks the Bethesda-game trend by having a secondary data folder at "Documents\\My Games\\Starfield\\Data" which, in most case, overrides the regular Data folder in the game installation. To get around this, Vortex can create a specific type of shortcut (called a folder junction) between the regular Data folder and the one in the My Games folder. This tricks the game engine into using the same Data folder and simplifies mod installation.[br][/br][br][/br]' +
  'Existing contents of the My Games folder will be copied over to the game data folder and backed up. To remove the folder junction in future, please go to Settings > Mods and disable "Use Folder Junction".';
