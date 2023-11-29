# Vortex Extension for Starfield

This is an extension for [Vortex](https://www.nexusmods.com/about/vortex/) to add support for Starfield. This is available for the PC on [Xbox & Game Pass](https://www.xbox.com/en-GB/games/starfield) and [Steam](https://store.steampowered.com/app/1716740/Starfield/).

The [Steam](https://store.steampowered.com/app/1716740/Starfield/) and [Xbox](https://www.xbox.com/en-GB/games/starfield) versions of Starfield are both supported, although there are differences between the two.

# Development

Clone repo and run `yarn install`

### Main Scripts

- `yarn build` will copy assets to the `/dist` folder, create the `/dist/info.json` from info within `/package.json` and pack the contents of `/dist` into `/out/starfield-x.x.x.zip`
- `yarn copyplugin` will copy contents of `/dist` to the plugins folder of the production build of Vortex. Normally located at `%APPDATA/Roaming/Vortex/plugins`
- `yarn copyplugindev` will copy contents of `/dist` to the plugins folder of the development build of Vortex. Normally located at `%APPDATA/Roaming/vortex_devel/plugins`
- `yarn buildcopydev` will build and contents of `/dist` to the plugins folder of the development build of Vortex. Normally located at `%APPDATA/Roaming/vortex_devel/plugins`

# Testing

Coming Soon

# Features

- Check (and ask to fix) bare minimum setup of `StarfieldCustom.ini`
- Can support both `/Data` folders through the use of a folder junction. Defaults to off but is asked to enable with necessary warnings. Please [read this page on modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for more information.
- Supports SFSE, BethINI and SFEdit

# Installation

This extension requires Vortex **1.9.10** or greater.

To install, click the Vortex button at the top of the [Starfield Extension page on Nexus Mods](https://www.nexusmods.com/site/mods/634), and then click Install.

You can also manually install it by click the Manual button at the top of the page and dragging it into the drop target labelled Drop File(s) in the Extensions page at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Starfield mods with Vortex.

# Game detection

The Starfield game extension enables Vortex to automatically locate installs from the Steam and Xbox apps.

It is also possible to manually set the game folder if the auto detection doesn't find the correct installation. A valid Starfield game folder contains:

- `Starfield.exe`

If your game lacks this file then it is likely that your installation has become corrupted somehow.

## Important note if managing the game through xbox game pass:

Currently the game discovery will resolve to the game's default `WindowsApps` location - Vortex's access to this directory is very limited due to the game store locking the files in a system owned virtual file system. As a workaround, please install the game into an external location, e.g. `C:/XboxGames/` and manually set the game folder inside Vortex to the `C:\XboxGames\Starfield\Content` folder. You should then be able to create the folder junction and mod your game.

# Mod Management

By default, Vortex will deploy files to the game's root folder and extracts the archive while preserving the folder structure.

Starfield breaks the Bethesda-game trend by having a secondary data folder at `Documents\My Games\Starfield\Data` which, in most case, overrides the regular `\Data` folder within the game installation. This has caused quite a bit of confusion in the community with different mods providing instructions to install to the two different folders and a number of community workarounds - some that worked and some less so.

To get around this, Vortex can create a specific type of shortcut (called a folder junction) between the regular Data folder and the one in the My Games folder. This tricks the game engine into using the same Data folder and simplifies mod installation. As an added bonus, this also works for both Steam and Xbox versions. The My Games Data folder is tested on startup and if it isn't a junction already, then the user is notified about potentially enabling this feature along with documentation as to why the user may not want to.

> IMPORTANT: Things aren't all perfect though. Using a file syncing\cloud drive service such as OneDrive, Google Drive or Dropbox are known to cause issues with this method due to the inconsistencies in how they handle folder junctions. The most severe of these issues can lead to the loss of data. For compatibility information about individual services, please [read this page on modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for more information.

Similar to Fallout 4, Starfield requires certain INI tweaks to be set in order to properly load loose files (i.e. those not packed in BA2 archives). There are a lot of mods out there which provide instructions for users to add these tweaks to a `StarfieldCustom.ini` file in the `Documents\My Games\Starfield` folder. If Vortex detects that this ini doesn't exist or is incorrect, it will notify the user and ask to fix it. If fix is requested, it will add or adjust the "bInvalidateOlderFiles" and "sResourceDataDirsFinal" values without changing any other settings you might've added manually. Additionally, Vortex will apply a tweak to re-route your Photo Mode captures to Data\Textures\Photos (unless you've already set it to something else) and there is now a button inside Vortex to quickly open this folder.
current

# Plugin Load Ordering (0.6.X)

The current implementation of the plugin management system in Starfield is temporary while we wait for the official creation kit from Bethesda. This means that we expect certain functionality to change in the future, yet we're confident enough to provide interim support.

A new "Load Order" page has been added to the extension to allow users to view their deployed mods and manage their load order. By default this system is disabled and can only be enabled through the Load Order page. The user can disable this feature at any time through the Settings -> Mods -> Starfield -> Manage Load Order Toggle.

Before enabling the plugin management system keep the following in mind:
  * Vortex will download any required mods/tools for load ordering to function as soon as you enable the plugin management system.
  * Vortex will migrate any "sTestFileX=" entries it finds in the INI files to the plugins.txt file located inside "%APPLOCALDATA%/Starfield". Any INI entries will block the plugin management functionality from work. This is by Bethesda's design.
  * Game Pass version of the game will not be able to use SFSE or its plugins - the ("Ultimate-ASI-Loader")[https://github.com/ThirteenAG/Ultimate-ASI-Loader] is used to load plugins to the game instead.

# Known Issues

- This extension has been tested with all of the most popular mods, installers, script extenders, mod fixers etc. Please see this [Mod Compatibility List](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/) forum post for details.

- Symlink support has been disabled due inconsistencies with some files working and some not. Animation replacers don’t read symlinked, but textures seem ok. This does match the pattern of older Bethesda games which looked for a while like we could avoid.

- Mods that include ini entries to be added won't fully work as functionality for ini merging isn't added yet. Deployment will work fine, but the ini (normally the `StarfieldCustom.ini`) will need to be updated manually. Please see a mod's description for individual installation instructions.

- [Starfield Script Extender (SFSE)](https://www.nexusmods.com/starfield/mods/106) is Steam version only and currently does not work with the Xbox Game Pass version

- [PureDark's StarfieldUpscaler](https://www.nexusmods.com/starfield/mods/111) is manual install only, [this is a good guide](https://www.dexerto.com/tech/how-to-add-dlss-to-starfield-on-pc-step-by-step-mod-guide-2274531/) to follow.

- Mods needing ASI loading will require manual installation due to the complexities. Please see a mod's description for individual installation instructions.

- Mods installed with version 0.4 of this extension may have missing files due to a flaw in the default installer. Please re-install your mods using 0.5 to ensure your mods are installed correctly. (Any missing archives will have to be re-downloaded manually)

- Fomods installed with 0.4 (selecting the "Vortex" flag) will no longer deploy correctly. 0.5 has a test in place to detect these mods and will notify you if any are found; providing you with the ability to fix the installed fomod. Mod authors are no longer required to provide separate Vortex/MO2 destinations for their mod files!

- Migrating this extension from version 0.4 to 0.5 may fail if for any reason the files are being actively manipulated by other tools or the game itself. Please make sure to close any such tools (or the game) before migrating to 0.5

- Modding Starfield's Xbox game pass version does not allow folder junctions when used with the default `WindowsApps\Starfield` folder. Please ensure to install Starfield to an external location e.g. `C:\XboxGames\` Vortex will try to resolve custom game pass locations using the hidden .GamingRoot files which
  the game pass store creates. Alternatively, the location of the game can be set manually. Go to Games tab and find Starfield -> 3 dots top right of the game's thumbnail -> manually select location -> choose the game folder that contains `Starfield.exe`

- Mod management isn't an exact science so [please report any mods](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/) that don't install correctly so we can continue to increase our compatibility and coverage

# Migrating this extension to 0.5

The default installer in 0.4 has been deprecated in 0.5 due to:

- Flaws in its logic which could potentially strip out mod files, causing issues in-game.
- Limited support for different mod packaging patterns.
- Incorrect installation of FOMODs requiring mod authors to cater for different mod managers separately (MO2/Vortex)

What to expect:

- As part of the migration, Vortex will purge all your mods as soon as Starfield is activated and will run checks to ensure your existing mods deploy correctly.
- Mods installed with 0.4 should still function as they previously did. If for any reason you suspect the mod has missing files, simply re-install it and the new installation logic will ensure that the mod is installed correctly.
- Collections that were created before 0.5 will still function correctly on both 0.4 and 0.5; however any collections created in 0.5 is not necessarily backwards compatible with 0.4 and could potentially result in a broken mod setup, especially if the mods included in the collection are known to cause issues in 0.4.
- FOMODs no longer require different file path configuration for different mod managers (MO2/Vortex). The user will be informed of any fomods it detects as misconfigured/outdated and allow them to fix them automatically via a notification.
- INI/TXT files will be deployed to the game's root folder; although the txt files can be executed using the 'bat' command in the game's console, Vortex does not currently offer automatic INI merging, those need to be sorted out manually.

Recommendations:

- Although not necessary if you're happy with your current mod setup, it is highly advisable for ALL 0.5 users to re-install all of their mods to ensure that the new mod type system kicks in.

# Collections in 0.5 and above

Given the changes in 0.5, migration functionality has been introduced to ensure we support collections created before this update. Upon successful installation of a collection, all mods tied to said collection are checked and migrated automatically to use the new system on the user's environment.

What to expect:

- Mods on the curator's machine may have a different mod type than the mods on the user's end, especially if the curator is still using an outdated version of the Starfield extension.
- As mentioned - mods installed as part of a collection on the user's end in 0.5 are automatically migrated to use the new 'Data Folder' mod type (when required). That will ensure the mods load into the game correctly.
- Existing collections downloaded before 0.5 should still be in a functional state.

Recommendations:

- As a curator it is highly advisable to update to 0.5 as soon as possible and re-install any mods you wish to distribute as part of a collection.
- As a user, although existing collections should still be functional - re-installing the collection is recommended as it will update all your mods to the new mod type system.

# Addendum

Vortex 0.6.X load ordering functionality is using INI merging for global datasets defined in ASI mods. At the time of writing this addendum, the deepMerge
utility function was not exported as part of the API. In order to allow users to test this extension without waiting for Vortex 1.9.9+, the extension has
and identical copy of the deepMerge function included - this should be removed once we confirm 1.9.9+ is stable.

# See also

- [Download the Extension (Nexus Mods)](https://www.nexusmods.com/site/mods/634)
- [Mods for Starfield (Nexus Mods)](https://www.nexusmods.com/starfield)
- [Starfield Mod Compatibility Megathread (Nexus Mods)](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/)
- [Vortex Forum (Nexus Mods)](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/)
- [Download Vortex (Nexus Mods)](https://www.nexusmods.com/about/vortex/)
- [Vortex Knowledge Base (Nexus Mods)](https://wiki.nexusmods.com/index.php/Category:Vortex)

# Thanks

- [Discord Testing Group](https://discord.com/channels/215154001799413770/1156219174012584087) for helping get things to a stable place
- [BOTLANNER](https://github.com/BOTLANNER) for helping with INI parsing

# Changelog

Please check out [CHANGELOG.md](/CHANGELOG.md)
