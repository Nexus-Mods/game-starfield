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

# Features

- Check (and ask to fix) bare minimum setup of `StarfieldCustom.ini`
- Can support both `/Data` folders through the use of a folder junction. Defaults to off but is asked to enable with necessary warnings. Please [read this page on modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for more information.
- Supports SFSE, BethINI and SFEdit

# Installation

This extension requires Vortex 1.8.5 or greater. To install, click the Vortex button at the top of the page to open this extension within Vortex, and then click Install.

You can also manually install it by downloading the main file and dragging it into the drop target labelled Drop File(s) in the Extensions page at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Starfield mods with Vortex.

# Game detection

The Starfield game extension enables Vortex to automatically locate installs from the Steam and Xbox apps.

It is also possible to manually set the game folder if the auto detection doesn't find the correct installation. A valid Starfield game folder contains:

- `Starfield.exe`

If your game lacks this file then it is likely that your installation has become corrupted somehow.

# Mod Management

By default, Vortex will deploy files to the game's root folder and extracts the archive while preserving the folder structure.

Starfield shakes up the traditional loading of mods by having an extra `Data` folder located in `Documents\My Games\Starfield` which is created the first time you open the game. The files provided at this location completely override those found in the `Data` folder where mods would traditionally be installed (`Starfield\Data`). This has caused quite a bit of confusion in the community with different mods providing instructions to install to the two different folders and a number of community workarounds - some that worked and some less so. 

Starfield breaks the Bethesda-game trend by having a secondary data folder at `Documents\My Games\Starfield\Data` which, in most case, overrides the regular `\Data` folder within the game installation. To get around this, Vortex can create a specific type of shortcut (called a folder junction) between the regular Data folder and the one in the My Games folder. This tricks the game engine into using the same Data folder and simplifies mod installation. As an added bonus, this also works for both Steam and Xbox versions. The My Games Data folder is tested on startup and if it isn't a junction already, then the user is notified about potentially enabling this feature along with documentation as to why the user may not want to.

> IMPORTANT: Things aren't all perfect though. Using a file syncing\cloud drive service such as OneDrive, Google Drive or Dropbox are known to cause issues with this method due to the inconsistencies in how they handle folder junctions. The most severe of these issues can lead to the loss of data. For compatibility information about individual services, please [read this page on modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for more information.

Similar to Fallout 4, Starfield requires certain INI tweaks to be set in order to properly load loose files (i.e. those not packed in BA2 archives). There are a lot of mods out there which provide instructions for users to add these tweaks to a `StarfieldCustom.ini` file in the `Documents\My Games\Starfield` folder. If Vortex detects that this ini doesn't exist or is incorrect, it will notify the user and ask to fix it. If fix is requested, it will add or adjust the "bInvalidateOlderFiles" and "sResourceDataDirsFinal" values without changing any other settings you might've added manually. Additionally, Vortex will apply a tweak to re-route your Photo Mode captures to Data\Textures\Photos (unless you've already set it to something else) and there is now a button inside Vortex to quickly open this folder.
current 

# Known Issues

- This extension has been tested with all of the most popular mods, installers, script extenders, mod fixers etc. Please see this [Mod Compatibility List](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/) forum post for details. 

- Mods that include ini entries to be added won't fully work as functionality for ini merging isn't added yet. Deployment will work fine, but the ini (normally the `StarfieldCustom.ini`) will need to be updated manually. Please see a mod's description for individual installation instructions.  

- [Starfield Script Extender (SFSE)](https://www.nexusmods.com/starfield/mods/106) is Steam version only and currently does not work with the Xbox Game Pass version

- [PureDark's StarfieldUpscaler](https://www.nexusmods.com/starfield/mods/111) is manual install only, [this is a good guide](https://www.dexerto.com/tech/how-to-add-dlss-to-starfield-on-pc-step-by-step-mod-guide-2274531/) to follow.

- Mods needing ASI loading will require manual installation due to the complexities. Please see a mod's description for individual installation instructions.

- Mod management isn't an exact science so [please report any mods](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/) that don't install correctly so we can continue to increase our compatibility and coverage

# See also

- [Download the Extension (Nexus Mods)](https://www.nexusmods.com/site/mods/634)
- [Mods for Starfield (Nexus Mods)](https://www.nexusmods.com/starfield)
- [Starfield Mod Compatibility Megathread (Nexus Mods)](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/)
- [Vortex Forum (Nexus Mods)](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/)
- [Download Vortex (Nexus Mods)](https://www.nexusmods.com/about/vortex/)
- [Vortex Knowledge Base (Nexus Mods)](https://wiki.nexusmods.com/index.php/Category:Vortex)

# Thanks

- [BOTLANNER](https://github.com/BOTLANNER) for helping with INI parsing

# Changelog 

Please check out [CHANGELOG.md](/CHANGELOG.md)