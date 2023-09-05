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
