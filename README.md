# Tiled To Godot Export

Tiled plugins for exporting Tilemaps and Tilesets in Godot 3.2 format

 - export_to_godot_tilemap.js
 - export_to_godot_tileset.js
 - utils.js

The plugin requires Tiled version 1.3.4 or newer.

More information about the Tilemap structure of Godot can be found here:

 * [Using Tilemaps](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html)
 * [API Class Tilemap](https://docs.godotengine.org/en/stable/classes/class_tilemap.html#tilemap)

 And also I made a simple legend explaining the tile encoding in a tilemap.
 * [Godot Tilemap Encoding & Limits](https://docs.google.com/spreadsheets/d/1YbGAVgySB3jr5oKeHHEPHbqmRkrVUs_YN_ftAEaOfBA/)

## Tiled Extensions
Tiled can be extended with the use of JavaScript. Scripts can be used to implement custom map formats, custom actions and new tools. Scripts can also automate actions based on signals.

More information:
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

* If using a version older than Tiled 1.3.3, restart Tiled, but better update your Tiled installation

  (This was necessary because Tiled only watched existing scripts for
  changes. No restarts are necessary when making changes to existing script
  files, since it will trigger an automatic reloading of the scripts.)

## How to use this extension

If you prefer watching check the video in YouTube:

[How to export from Tiled To Godot 3.2](https://youtu.be/4jSFAXIa_Lo)

### Setting projectRoot `res://`

The exporter needs to know where `res://` is. By default, it's in the same directory where the Tiled files are being saved.
You can override it with a tile/map custom property `projectRoot : string` that is either relative to the file you are exporting (starting with a `.`), or absolute path,
Either way the value of projectRoot is transformed to a resource path which Godot use.

**_!!! Pay attention to the "/" instead of standard windows "\\".
Single Backslash "\\" is used for escaping special symbols._**

This is needed so when you export to a subfolder in your Godot project all the relative
paths for the resources `(res://)` are set correctly and relative to the custom property
you've added `"projectRoot"`;

If everything is fine when you go to _File -> Export As_, a new option should exist:

`Godot Tilemap format (*.tscn)`

and for tilesets respectively:

`Godot Tileset format (*.tres)`

### Nice to know! (...in case something goes wrong)

It's better to keep the Tiled files in the same folder as the exported ones because then all the paths will
be the same as in your Godot project.

* Tiled and Godot have some differences in the Tileset concept.
* Tiled's Tileset can have only one sprite image (texture) but a Tiled Tilemap can have multiple tilesets.
* Tiled's Tilemap can have multiple layers and each layer can have tiles from different tilesets
* Godot's Tileset on the other hand can have multiple images and textures and multiple tile atlases.
* Godot's Tilemap can have only one tileset.

So, these impose the following limitations when exporting from Tiled:

* Each tileset will be exported as a stand-alone Tileset.
* Each layer will become a Tilemap in Godot with a single Tileset.
* If you use more than one tileset in a layer, each tiles from the tileset will be exported as child tilemap
to the first one.

When you export a map Godot only needs to reload the scene. You can add something like this in your
godot script:

```
if Input.is_action_just_pressed("reload_scene"):
 	get_tree().reload_current_scene()
```
Don't forget to add key/mouse/controller mapping for the "reload_scene" action ;)

### Tile layer z index

Can set the z-index for the tilelayer by adding a custom property `z_index`, this will set the z-index of the tile layer in the scene file.

### Tileset objects for collisions & navigation

To setup a collision shape for a tile, first edit the tileset in Tiled:

- Select the tile in the tileset file
- You should see a side panel "Tile Collision Editor", use the menu above it to create a new shape. Use rectangle or polygon only.

For navigation, do the same thing, but with the Object shape selected, set the `Type` field to `navigation`.

## Why use it?

The main focus was easily editing and creating new maps and tilesets.

An alternative is the [Godot Import Plugin for Tiled Map Editor](https://github.com/vnen/godot-tiled-importer), but beware - it's a bit old and has some performance issues since it makes single tiles.
Godot added the ability to create Tilesets with Atlas Tiles.
This is more efficient than one Tileset object with 500 singe tiles.
The Atlas needs a region and tile size - these are automatically taken from the Tiled editor.
More about my struggles can be read in Tiled Forum or Godot reddit. Check the Contacts section.

## Features list:

- [x] Export Tiled file as a Godot scene. Each layer in Tiled is a TileMap in Godot
- [x] Export TileSets from Tiled standalone tileset files
- [x] Orthogonal maps
- [ ] Isometric, staggered, and hexagonal maps
- [x] Export visibility and opacity from layers
- [x] Export collision shapes<sup>*</sup>
- [ ] Export occluder shapes<sup>*</sup>
- [x] Export navigation shapes<sup>*</sup>
- [ ] Support for one-way collision shapes
- [ ] Support for image layers
- [x] Support for tile objects, which are exported to Godot as Sprite nodes. (Other types of objects are not yet included.)
- [ ] Full support for object layers, which are exported as StaticBody2D, Area2D or LightOccluder2D for shapes (depending on the type property) and as Sprite for tiles
- [ ] Support for group layers, which are exported as Node2Ds
- [ ] Custom properties for maps, layers, tilesets, and objects are exported as metadata. Custom properties on tiles can be exported into the TileSet resource
- [ ] Map background layer exported as a parallax background

Legend: ticked = done, unticked = to do

\* The Godot tileset editor supports only Rectangle and Polygon. That's Tiled are supported and are converted to polygons in Godot.

## Supported entity types

Creating entities with these types will result in specific nodes to be created :

- type `Area2D`

  Creates an `Area2D` node in the scene, containing a `CollisionShape2D` with the rectangle set in the tiled map.

  You can add `collision_layer` and `collision_mask` integer custom properties to set these properties for Godot.

- type `Node2D`

  Creates an empty `Node2D` at the specified position. Can be useful for defining spawn points for example.

If present, the `groups` custom string property will add the generated entity to the specified Godot scene groups. Accepts multiple groups via comma separation: `Group1, Group2`.

## Long term plans

I'm making a 2D platformer and I'm gonna focus on these needs for now.
Generally, I would like to support everything Tiled offers because it's a very good level editor.

If you are using the plugins and have any problems, feature requests or have found any bugs - just open an issue here in the gitHub repo.

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
