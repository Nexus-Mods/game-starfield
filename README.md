# Vortex Extension for Starfield

This is an extension for [Vortex](https://www.nexusmods.com/about/vortex/) to add support for Starfield. This is available for the PC on [Xbox & Game Pass](https://www.xbox.com/en-GB/games/starfield) and [Steam](https://store.steampowered.com/app/1716740/Starfield/).

# Features

- Correct setup of StarfieldCustom.ini
- Supports both `Data` folders through the use of folder junctions
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

Vortex users no longer need to worry about this. Upon managing Starfield, Vortex will now copy all the files already installed to `Documents\My Games\Starfield\Data` into the game `Data` directory, then create a junction that tricks the game into redirecting any files it would read to or write from the Documents folder to use the game folder instead. This neat trick means that your mods will always load correctly and as an added bonus this method works for both the Steam and Xbox Game Pass releases of the game. 

Similar to Fallout 4, Starfield requires certain INI tweaks to be set in order to properly load loose files (i.e. those not packed in BA2 archives). There are a lot of mods out there which provide instructions for users to add these tweaks to a StarfieldCustom.ini file in the Document\My Games\Starfield folder. Vortex now creates this file and will validate that the "bInvalidateOlderFiles" and "sResourceDataDirsFinal" settings are correct on each startup. If they are wrong, they will be corrected automatically (without changing any other settings you might've added manually). Additionally, Vortex will apply a tweak to re-route your Photo Mode captures to Data\Textures\Photos and there is now a button inside Vortex to quickly open this folder. 

# Known Issues

- Mod management isn't an exact science so [please report any mods](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/) that don't install correctly so we can continue to increase our compatibility and coverage
- Starfield Script Extender (SFSE) doesn't currently work with the Xbox Game Pass version

# See also

- [Download the Extension (Nexus Mods)](https://www.nexusmods.com/site/mods/634)
- [Mods for Starfield (Nexus Mods)](https://www.nexusmods.com/starfield)
- [Starfield Mod Compatibility Megathread (Nexus Mods)](https://forums.nexusmods.com/index.php?/topic/13262847-starfield-mod-compatibility-megathread/)
- [Vortex Forum (Nexus Mods)](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/)
- [Download Vortex (Nexus Mods)](https://www.nexusmods.com/about/vortex/)
- [Vortex Knowledge Base (Nexus Mods)](https://wiki.nexusmods.com/index.php/Category:Vortex)

# Thanks

- [BOTLANNER](https://github.com/BOTLANNER)

# Changelog 

Please check out [CHANGELOG.md](/CHANGELOG.md)