# Vortex Extension for Hogwarts Legacy

This is an extension for [Vortex](https://www.nexusmods.com/about/vortex/) to add support for Hogwarts Legacy. This is available for the PC on [Steam](https://store.steampowered.com/app/990080/Hogwarts_Legacy/) and [Epic](https://store.epicgames.com/en-US/p/hogwarts-legacy).

# Features

- Support for PAK-based mods
- Support for BK2-based mods (movie files)
- Support for UE4SS Blueprint\Lua mods
- Support for load order of PAK mods
- Support for Lua mods enabling and disabling
- Automatic game detection
<!-- - Installation of archives which include more than one mod.
- Automatic detection of ModBuddy (the XCOM 2 modding toolkit).
  Load order management (including Steam Workshop entires) -->

# Installation

This extension requires Vortex >= 1.7.5. To install, click the Vortex button at the top of the page to open this extension within Vortex, and then click Install.

You can also manually install it by downloading the main file and dragging it into the 'drop zone' labelled Drop File(s) in the Extensions tab at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Hogwarts Legacy mods with Vortex.

If updating an extension, migration occurs that purges your mods folder and reinstalls any mods.

# Game detection

The Hogwarts Legacy game extension enables Vortex to automatically locate installs from the Steam and Epic apps.

It is also possible to manually set the game folder if the auto detection doesn't find the correct installation. A valid Hogwarts Legacy game folder contains:

- `HogwartsLegacy.exe`
- `/Engine`
- `/Phoenix`

If your game lacks these files/folders then it is likely that your installation has become corrupted somehow.

# Mod Management

By default, Vortex will deploy files to the game's root folder and extracts the archive while preserving the folder structure.

Vortex will deploy files to the game's mod folder (`/Phoenix/Content/Paks/~mods`) if only `.pak` files are detected and extracts all nested files in the archive to their own individual within this one, ignoring archive folder structure. Each mod folder will be prefixed based on the users load order set within Vortex. Any files that are overwritten are backed up for when the mod is disabled or removed.

This extension also supports mods that overwrite the games movie files, located within subfolders under `/Phoenix/Content/Movies`. When a mod is added that contains at least 1 `.bk2` file, the `hogwarts-modtype-movies` installer is used. This searches through the movies folder within the game and attempts to match anything that matches inside of the mod archive. If found, Vortex overwrites them (after backing up the originals) and if any `pak` files are also found within a movie mod, then these are processed the same as a pak-only mod.

# Load Order

The load order of mods can now be set within Vortex to allow greater control over what mods are loaded before other mods. This is important so as multiple mods can change the same thing and so load order can be used to minimize collisions. Mods loaded last will have priority over mods loaded first.

<!--Individual mod entries can be enabled/disabled from the load order section.


## Load Order Management

This extension utilises the "File Based Load Order (FBLO)" framework provided by the core Vortex application. A list of `XComMod` installations present in the game folder is generated and each entry can be re-ordered, enabled or disabled.

A list of enabled mods in the load order is automatically written to the `DefaultModOptions.ini` file, which tells the game which mods to load and in what order.

## Steam Workshop detection

The load order section will also detect mods installed from the Steam Workshop and display them in the load order. These entries can be managed like any other, however, the mod files themselves are not managed by Vortex and must be managed by Steam. You can also use the [Import from Steam Workshop](https://www.nexusmods.com/site/mods/114) extension to import these mods into Vortex.-->

# See also

<!--- [Source Code (GitHub)](https://github.com/insomnious/game-halothemasterchiefcollection)-->

- [Download the Extension (Nexus Mods)](https://www.nexusmods.com/site/mods/520)
- [Mods for Hogwarts Legacy (Nexus Mods)](https://www.nexusmods.com/hogwartslegacy)
- [Download Vortex (Nexus Mods)](https://www.nexusmods.com/about/vortex/)
- [Vortex Knowledge Base (Nexus Mods)](https://wiki.nexusmods.com/index.php/Category:Vortex)

# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.3.5] - 2023-05-24

### Changed
- Stop processing Lua mods if the game isn't installed (or the active profile isn't for Hogwarts Legacy)

## [0.3.4] - 2023-03-31

New installers and bug fixes

### Added
- Added an installer for UE4SS Blueprints that need to be installed to LogicMods.
- Added an installer for Lua mods

### Changed
- Made the Lua mods list scrollable.

### Fixed
- Fixed a bug refreshing the Lua mods load order when there is no active profile in Vortex
- Fixed a layout bug for Lua mods with exceedingly long names
## [0.3.3] - 2023-03-28

Bug fix

### Fixed

- Fixed bug where PAK mods weren't correctly being identified

## [0.3.2] - 2023-03-28

Bug fix

### Fixed

- Fixed bug where Lua file change event was being raised with null data 

## [0.3.1] - 2023-03-23

Bug fixes

### Fixed

- Fixes potential file permission error when purging Lua mods.  

## [0.3.0] - 2023-03-22

Expanded support for Lua mods and ability to enable/disable inside of Vortex. Refactored code and some bug fixes.

### Added

- New page to enable/disable Lua mods

### Fixed

- Fixed bug with 'Open Save Folder...' menu action being visible when managing other games. 
- Refactored code and fixed some eslint issues


## [0.2.11] - 2023-03-08

Created new mod type for regular PAK mods and made the default type now more generic to support UE4SS.

### Added

- Created new installer for regular PAK mods

### Changed

- Changed default mod type to be installed to the root game folder instead of the PAK folder. This allows experimental support for UE4SS or any other mod that doesn't involve movies or PAKs.


## [0.2.10] - 2023-02-23

Support mods that replace movie files in the `Phoenix/Content/Movies` folder. Also supports mods that contain both movie and pak files in the same archive. Added menu item to open the save game folder.

### Added

- Support for mods that replace the `.bk2` movies like those in picture frames and newspapers. Folder structure of the archive doesn't matter as the files to replace are searched for based on what is in the mod. This allows us not to have to set a strict mod format however it does rely on the files being in the game already to replace, any `bk2` files not found to replace are just ignored. If a mod contains both movie files and `pak`/`utoc`/`ucas` files, this is also supported and works with load ordering.
- Added 'Open Save Game Folder' to the 'Open...' menu on the Mods page. This opens the save game folder normally located at `%AppData%\Local\HogwartsLegacy\Saved\SaveGames`.

### Changed

- Updated metadata to display the extension name correctly within Vortex

## [0.1.2] - 2023-02-16

Bug fixes

### Changed

- Fixed migration bug when it was the first time the extension was installed

## [0.1.1] - 2023-02-15

Load order added so that mods can be rearranged without the need to disable them completely. Migration to this version will happen automatically my purging the `/~mods` folder and redeploying the mods.

### Added

- Load Order has been added for mods.

### Changed

- Mods are now deployed into individual folders inside of the games `/~mods` folder
- Symlink deployment method has been disabled due to visual mods not working 100% of the time when it's used.

## [0.0.1] - 2023-02-09

Initial release for basic mod support
