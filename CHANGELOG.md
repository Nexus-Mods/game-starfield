# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

<!-- ## [Unreleased] - YYYY-MM-DD -->

## [0.1.0] - 2023-08-29

- Initial release for basic mod support

## [0.2.0] - 2023-09-04

- Added a custom installer to restructure mod archives that aren't packed relative to the game root. 
- Supports the installation of Starfield Script Extender.
- Starfield Script Extender has been added as a tool on the dashboard.
- Now supports mods without a "Data" top level folder. 
- Supports use of "root", "Starfield" or "Starfield root" folders to signal Vortex to extract the files to the game root folder. 
- Attempt to support ASI plugins (although they need to have a "Plugins" level to be installed properly).

## [0.3.0] - 2023-09-07

- Fixed a mistake in the code which lead root folder files to be deployed to the Data folder.

## [0.4.0] - 2023-09-14

- Fixed an issue installing replacers where the folder name matches a plugin (e.g. Starfield.esm). This allows mods such as [this](https://www.nexusmods.com/starfield/mods/2176/?tab=files) to install correctly. 
- Anything in the Documents/My Games/Starfield/Data will be automatically moved to the game installation Data folder and a junction created that tricks the game into using that folder for all textures. 
- A StarfieldCustom.ini will be created with minimal values if is not already present. 
- Symlink support has been re-enabled as this appears to work (it didn't in Fallout 4/Skyrim).
- Add a warning when installing Starfield Script Extender on Xbox Game Pass. 