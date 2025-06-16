# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.10.5] - 2025-06-16

- Fixes inability to correctly sort via loot in Vortex 1.14

## [1.10.4] - 2024-12-09

- Fixed deployment event handlers executing while other games are managed

## [1.10.3] - 2024-11-07
- Fixed engine injectors (SFSE excluded) being erroneously flagged as the Game Pass ASI Loader

## [1.10.2] - 2024-09-30

- Fixed CC plugins being detected as native.
- Minor fix to the deprecated FOMOD warning text.

## [1.10.1] - 2024-09-30

- Added ability to resolve native plugins through regexp patterns
- Added Shattered Space DLC plugin

## [1.10.0] - 2024-09-02

- Add support for latest save game version that was added in the August update

## [1.9.1] - 2024-08-14

- Fixed inability to report _some_ loot sorting errors

## [1.9.0] - 2024-08-12

- Versioning tidy up

## [0.8.8] - 2024-08-12

- Improved error logging for failed ASI INI merges
- Improved error handling of LOOT errors
- Fixed potential attempts to write invalid mod entries to plugins file

## [0.8.7] - 2024-07-30

- Fixed native plugins added to plugins.txt file when Starfield.ccc is present

## [0.8.6] - 2024-07-29

- Adding fallback to playtime parser. ([#16139](https://github.com/Nexus-Mods/Vortex/issues/16139))

## [0.8.5] - 2024-07-29

- Fixed hanging sort activity if LOOT is unavailable
- Refactored plugin enabler requirement check on migration
- Switch between the load order management methods, Drag and Drop (Default) or Rules-based (Classic).
- Added Sort via LOOT button to the Drag and Drop action bar to allow sorting.
- Added Save Games page using new Starfield Save Tool
- Vortex will now now attempt to ascertain LO using `Starfield.ccc` file (if it exists)

## [0.7.1] - 2024-06-12

- Fixed user facing names of requirements missing from different dialogs and notifications.
- Fixed Vortex incorrectly reporting about missing plugins

## [0.7.0] - 2024-06-11

- Tweaks to support latest Starfield update (v1.12)
- Added Creation Kit as a tool
- Added new native plugins to locked list
- SFSE/ASI Loader are now optional and can be downloaded via a notification at startup
- Fixed game version resolution issues for Xbox Game Pass

## [0.6.7] - 2024-03-19

- Removed all logic pertaining to the sPhotoModeFolder ini entry (Please add/remove/modify the ini entry manually if needed)

## [0.6.6] - 2023-12-20

- Added warning when resetting the plugins file.
- Load order is no longer removed when purging mods.

## [0.6.5] - 2023-12-14

- Added Xbox Game Pass specific information to help users avoid/fix the "This library isn't supported" error
- Fixed original bink file not hooked correctly for Xbox Game Pass

## [0.6.4] - 2023-12-13

- Fixed error when merging data folders as part of the directory junction functionality

## 0.6.3 - 2023-12-11

- Fixed instance where plugins were still displayed as managed even when the mod was disabled
- Modified invalid/missing entries are no longer displayed in the load order page

## [0.6.2] - 2023-11-30

- Fixed error/crash when installing collections w/bundled mods.
- Guess what, the native plugins are back visually - still not written to the plugins.txt file though!

## 0.6.1 - 2023-11-29

- Fixed "sTestFile" pattern matching skipping every other entry.
- Fixed UI issue where plugins deployed relative to the game's root were not considered to be managed by Vortex
- Modified native plugins are no longer serialized into the plugins.txt file

## 0.6.0 - 2023-11-15

- Added ASI Loader installer
- Added ASI mod support
- Added support for merging INI files for ASI mods
- Added automatic plugin enabled downloader
- Added load order page
- Added ability to migrate sTestFile entries to the load order page during deserialization
- Added ability to enable/disable Vortex plugin management through the settings page
- Added Starfield stylesheet
- Added button to allow users to reset their plugins.txt file
- Modified build scripts to deploy stylesheets

## 0.5.8 - 2023-12-13

- Fixed error when merging data folders as part of the directory junction functionality

## [0.5.7] - 2023-11-23

- Updated notification and dialog text

## [0.5.6] - 2023-11-06

- Modified stop patterns to install known injector type assemblies to the game's root folder
- Improved the stop patterns to deploy ini and txt files to root (also executables!)
- Starfield notifications now dismissed on game mode change

## 0.5.5 - 2023-11-02

- Added migration capabilities for collections created with 0.4
- Added missing "sound" stop pattern

## 0.5.4 - 2023-11-01

- Improved junction suppression/my games notification flow
- Fix for [Add a notification for when Data folder exists in My Games](https://github.com/Nexus-Mods/game-starfield/issues/24)
- Fix for [SFSE installer false positives](https://github.com/Nexus-Mods/game-starfield/issues/25)
- Improved invalid fomod detection

## 0.5.3 - 2023-10-31

- Fomod install check will now only run for data folder modtype.
- Added a notification specifying the changes in the extension to the users.

## 0.5.2 - 2023-10-31

- Mods installation logic now use stop patterns.
- Fix for [Cater for mods that have redundant top-level folders](https://github.com/Nexus-Mods/game-starfield/issues/14)
- Removed deprecated starfield installer.
- Added Data folder modType to support the new installation logic.
- Added check for incorrectly installed fomods.
- Added migration logic to seamlessly migrate 0.4 users to the new 0.5 stop patterns installation functionality.

## 0.4.5 - 2023-11-07

- Fixed crash if Vortex is unable to create the folder junction.
- Improved error handling when merging mod directories.

## [0.4.4] - 2023-10-26

- Fix for [An uncoverable error occurred - clicking on Use Junction](https://github.com/Nexus-Mods/game-starfield/issues/22)
- Updated text for ini check notification and dialog

## 0.4.3 - 2023-10-25

- Folder junction is tested and user is asked with a lot of warnings if they'd like to use this feature.
- Documentation added to [modding.wiki](https://modding.wiki/en/vortex/users/starfield-folder-junction-issues) for OneDrive and other cloud drive service issues

## 0.4.2 - 2023-10-22

- The user is notified if `StarfieldCustom.ini` doesn't contain the bare minimum to enable modding.
- If the ini file is fixed, it is done so without removing comments and `sPhotoModeFolder=Photos` is added to the `[Display]` section instead of `[General]`.
- Fix for [BA2/ESM files have other files stripped on install](https://github.com/Nexus-Mods/game-starfield/issues/15)
- Fix for [Does not install mods with BAT files AND valid data properly](https://github.com/Nexus-Mods/game-starfield/issues/17)
- [Symlink support has been disabled](https://github.com/Nexus-Mods/game-starfield/pull/12) due to inconsistencies with files working\not working.

## 0.4.1 - 2023-09-22

- Hotfix to disable the My Games Data folder workaround and StarfieldCustom.ini management from the previous release due to unforeseen issues.

## 0.4.0- 2023-09-21

- Anything in the Documents/My Games/Starfield/Data will be automatically moved to the game installation Data folder and a junction created that tricks the game into using that folder for all textures.
- A StarfieldCustom.ini will be created with minimal values if is not already present.
- Symlink support has been re-enabled as this appears to work (it didn't in Fallout 4/Skyrim).
- Fixed installing EXEs to the game root incorrectly.
- Warn the user if they try to install SKSE to a non-Steam version of Starfield.
- Added menu option to open photo mode folder

## 0.3.0 - 2023-09-17

- Fixed a mistake in the code which lead root folder files to be deployed to the Data folder.
- Fixed an issue with files that start with "Starfield", "Root" or "Starfield Root" being extracted to the wrong place.
- Fixed an issue installing replacers where the folder name matches a plugin (e.g. Starfield.esm). This allows mods such as [this](https://www.nexusmods.com/starfield/mods/2176/?tab=files) to install correctly.
- Added toolbar option to open the Settings and AppData folders.

## 0.2.0 - 2023-09-05

- Added a custom installer to restructure mod archives that aren't packed relative to the game root.
- Supports the installation of Starfield Script Extender.
- Starfield Script Extender has been added as a tool on the dashboard.
- Now supports mods without a "Data" top level folder.
- Supports use of "root", "Starfield" or "Starfield root" folders to signal Vortex to extract the files to the game root folder.
- Attempt to support ASI plugins (although they need to have a "Plugins" level to be installed properly).

## 0.1.0 - 2023-08-29

- Initial release for basic mod support

[1.10.2]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.10.2
[1.10.1]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.10.1
[1.10.0]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.10.0
[1.9.1]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.9.1
[1.9.0]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v1.9.0
[0.8.8]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.8.8
[0.8.7]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.8.7
[0.8.6]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.8.6
[0.8.5]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.8.5
[0.7.1]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.7.1
[0.7.0]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.7.0
[0.6.7]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.6.7
[0.6.6]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.6.6
[0.6.5]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.6.5
[0.6.4]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.6.4
[0.6.2]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.6.2
[0.5.7]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.5.7
[0.5.6]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.5.6
[0.4.4]: https://github.com/Nexus-Mods/game-starfield/releases/tag/v0.4.4
