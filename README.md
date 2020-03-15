# Tiled To Godot Export

Tiled plugins for exporting Tilemaps and Tilesets in Godot 3.2 format

 - export_to_godot_tilemap.js
 - export_to_godot_tileset.js
 - utils.js
 
 More information about the Tilemap structure of Godot can be found here:
 
 * [Using Tilemaps](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html)
 * [API Class Tilemap](https://docs.godotengine.org/en/stable/classes/class_tilemap.html#tilemap)
  
 And also I made a simple legend explaining the tile encoding in a tilemap.
 * [Godot Tilemap Encoding & Limits](https://docs.google.com/spreadsheets/d/1YbGAVgySB3jr5oKeHHEPHbqmRkrVUs_YN_ftAEaOfBA/)
 

## Tiled Extensions
Tiled can be extended with the use of JavaScript. Scripts can be used to implement custom map formats, custom actions and new tools. Scripts can also automate actions based on signals.

More information about this:
* [Tiled Scripting Docs](https://github.com/mapeditor/tiled-extensions)

## Installation

When you want to add these plugins to your Tiled installation:

* Open Tiled and go to _Edit > Preferences > Plugins_ and click the "Open"
  button to open the extensions directory.

* [Download](https://github.com/MikeMnD/tiled-to-godot-export/archive/master.zip)
  the files in this repository and extract them to that location. The scripts
  can be placed either directly in the extensions directory or in a
  subdirectory.

  (Alternatively, clone this git repository into the extensions directory)
  
  Tiled extension directory is:
  
  - **Windows**
   `C:/Users/<USER>/AppData/Local/Tiled/extensions/`
  - **macOS**
  `~/Library/Preferences/Tiled/extensions/`
  - **Linux**	
  `~/.config/tiled/extensions/`

* When using a version older than Tiled 1.3.3, restart Tiled.

  (This was necessary because Tiled only watched existing scripts for
  changes. No restarts are necessary when making changes to existing script
  files, since it will trigger an automatic reloading of the scripts.)

## How to use this extensions

After you open a Tilemap or Tileset you need to add this custom property:
`"projectRoot" : string`
Than set the value to the projectRoot of your Godot project.
For example: `D:/work/GodotProjects/game_one/`

**_!!! Pay attention to the "/" instead of standart windows "\\".
Single Backslash "\\" is used for escaping special symbols._**

This is needed so when you export to a subfolder in your Godot project all the relative 
paths for the resources `(res://)` are set correctly and relative to the custom property 
you've added `"projectRoot"`;

If everything is fine when you go to _File -> Export As_, a new option should exist:

`Gotod Tilemap format (*.tscn)`

and for tilesets respectivly:

`Godot Tileset format (*.tres)`

### Nice to know! (...if something doesn't work)

It's better to keep the Tiled files in the same folder as the exported ones since then all the paths will
be the same as in your Godot project.

Tiled and Godot has some differences in the Tileset concept.
Tiled's Tileset can have only one sprite image (texture) but a Tiled Tilemap can have multiple tilesets.
Tiled's Tilemap can have multiple layers and each layer can have tiles from different tilesets

Godot's Tileset on the other hand can have multiple images and textures and multiple tile atlases.
Godot's Tilemap can have only one tileset.

So these impose the following limitations when exporting from Tiled.

Each tileset will be exported as standalone Tileset.
Each Layer should use only tiles form one tileset.
Each layer will become a Tilemap in Godot with single Tileset.
(This is automaticly set based on the first tile detected, so if you use more tha one tileset in a layer only the one
holding the first detected tile will be mapped.)
 

When you re export a map Godot only needs to reload the scene. You can add something like this in your
godot script:

```
if Input.is_action_just_pressed("reload_scene"):
 	get_tree().reload_current_scene()
```
Don't forget to add a key/mouse/controller mapping for the "reload_scene" action ;)

## Why should I use it?

The main focus was easily editing and creating of new maps and tilesets.
Godot added the ability to create Tilesets with Atlas Tiles.
This is more efficient than one Tileset object instead of 500 singe tiles.
The Atlas needs a region and tile size - these are automatically taken from the Tiled editor.

Alternative is: [Godot Import Plugin for Tiled Map Editor](https://github.com/vnen/godot-tiled-importer)
But beware it's a bit old and has some performance issues since it makes single tiles.
More about my struggles can be read in Tiled Forum or Godot redit.
Check the Contact section.

## Features list:

- [x] Export Tiled file as a Godot scene. Each layer in Tiled is a TileMap in Godot.
- [x] Export TileSets from Tiled standalone tileset files.
- [x] Orthogonal maps
- [ ] Isometric, staggered, and hexagonal maps.
- [ ] Export visibility and opacity from layers.
- [x] Export collision shapes (\* based on Tiled object type).
- [ ] Export occluder shapes (\* based on Tiled object type).
- [ ] Export navigation shapes (\* based on Tiled object type).
- [ ] Support for one-way collision shapes.
- [ ] Support for image layers.
- [ ] Support for object layers, which are exported as StaticBody2D, Area2D or LightOccluder2D for shapes (depending on the type property) and as Sprite for tiles.
- [ ] Support for group layers, which are exported as Node2Ds.
- [ ] Custom properties for maps, layers, tilesets, and objects are exported as metadata. Custom properties on tiles can be Exported into the TileSet resource.
- [ ] Map background Exported as a parallax background

\* (Godot tileset editor supports only Rectangle and Polygon. That's Tiled are supported and are converted to polygons in Godot.)

## What's the long term?
I'm making a 2D platformer and I'm gonna focus on these needs for now.
Generally i would like to support everything Tiled offers because it's a very good level editor.

If you are using the plugins and have some problems or feature request or found some bugs.
Just open an issue here in the gitHub repo.

#### Customizing or contributing tips

If you want to debug something you can use the utils.js
There are three useful functions:
 - log() - shortcut for the console.log (infinite parameters)
 - logf() - logs with flattening circular objects (single parameter)
 - logk() - logs the keys of a object (single parameter)

## Contacts:

**Tiled forum:**

https://discourse.mapeditor.org/t/tiled-editor-map-and-tileset-integration-with-godot-3-2/4347

**Reddit topic:**

https://www.reddit.com/r/godot/comments/f1wh4a/tiled_editor_map_and_tileset_integration_with/

**Cheers! And happy game making with Godot.**
