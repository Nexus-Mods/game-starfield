# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.5.2] - 2023-10-31

- Mods installation logic now use stop patterns.
- Removed deprecated starfield installer.
- Added Data folder modType to support the new installation logic.
- Added check for incorrectly installed fomods.
- Added migration logic to seamlessly migrate 0.4.x users to the new 0.5.x stop patterns installation functionality.

## [0.4.4] - 2023-10-26

- Fix for [An uncoverable error occurred - clicking on Use Junction](https://github.com/Nexus-Mods/game-starfield/issues/22)
- Updated text for ini check notification and dialog

## [0.4.3] - 2023-10-25

- Folder junction is tested and user is asked with a lot of warnings if they'd like to use this feature.
- Documentation added to [modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for OneDrive and other cloud drive service issues 

## [0.4.2] - 2023-10-22

- The user is notified if `StarfieldCustom.ini` doesn't contain the bare minimum to enable modding.
- If the ini file is fixed, it is done so without removing comments and `sPhotoModeFolder=Photos` is added to the `[Display]`  section instead of `[General]`.
- Fix for [BA2/ESM files have other files stripped on install](https://github.com/Nexus-Mods/game-starfield/issues/15)
- Fix for [Does not install mods with BAT files AND valid data properly](https://github.com/Nexus-Mods/game-starfield/issues/17)


## [0.4.1] - 2023-09-22

- Hotfix to disable the My Games Data folder workaround and StarfieldCustom.ini management from the previous release due to unforeseen issues.

## [0.4.0] - 2023-09-21

- Anything in the Documents/My Games/Starfield/Data will be automatically moved to the game installation Data folder and a junction created that tricks the game into using that folder for all textures. 
- A StarfieldCustom.ini will be created with minimal values if is not already present. 
- Symlink support has been re-enabled as this appears to work (it didn't in Fallout 4/Skyrim).
- Fixed installing EXEs to the game root incorrectly. 
- Warn the user if they try to install SKSE to a non-Steam version of Starfield. 
- Added menu option to open photo mode folder

## [0.3.0] - 2023-09-17

- Fixed a mistake in the code which lead root folder files to be deployed to the Data folder.
- Fixed an issue with files that start with "Starfield", "Root" or "Starfield Root" being extracted to the wrong place.
- Fixed an issue installing replacers where the folder name matches a plugin (e.g. Starfield.esm). This allows mods such as [this](https://www.nexusmods.com/starfield/mods/2176/?tab=files) to install correctly.
- Added toolbar option to open the Settings and AppData folders.

## [0.2.0] - 2023-09-05

- Added a custom installer to restructure mod archives that aren't packed relative to the game root.
- Supports the installation of Starfield Script Extender.
- Starfield Script Extender has been added as a tool on the dashboard.
- Now supports mods without a "Data" top level folder.
- Supports use of "root", "Starfield" or "Starfield root" folders to signal Vortex to extract the files to the game root folder.
- Attempt to support ASI plugins (although they need to have a "Plugins" level to be installed properly).

## [0.1.0] - 2023-08-29

- Initial release for basic mod support