# Tiled To Godot Export

Tiled plugins for exporting Tilemaps and Tilesets in Godot 3.2 format

 - export_to_godot_tilemap.js
 - export_to_godot_tileset.js
 - utils.js

## Tiled Extensions
Tiled can be extended with the use of JavaScript. Scripts can be used to implement custom map formats, custom actions and new tools. Scripts can also automate actions based on signals.

More information about this:

https://github.com/mapeditor/tiled-extensions

## How to use this extensions

First you need to put them in Tiled extension directory.

- **Windows**
 `C:/Users/<USER>/AppData/Local/Tiled/extensions/`
- **macOS**
`~/Library/Preferences/Tiled/extensions/`
- **Linux**	
`~/.config/tiled/extensions/`

After you open a Tilemap or Tileset you need to add this custom property:
`"projectRoot" : string`
Than set the value to the projectRoot of your Godot project.
For example: `D:\work\GodotProjects\game_one`

This is needed so when you export to a subfolder in your Godot project all the relative 
paths for the resources `(res://)` are set correctly and relative to the custom property 
you've added `"projectRoot"`;

If everything is fine when you go to **File -> Export As**, a new option should exist:

`Gotod Tilemap format (*.tscn)`

and for tilesets respectivly:

`Godot Tileset format (*.tres)`

### Nice to know! (...if something doesn't work)

It's better to keep the Tiled files in the same folder as the exported ones since then all the paths will
be the same as in your Godot project.

When you re export a map Godot only needs to reload the scene. You can add something like this in your
godot script:

```
if Input.is_action_just_pressed("reload_scene"):
 	get_tree().reload_current_scene()
```
Don't forget to add a key/mouse/controller mapping for the "reload_scene" action ;)

If you want to debug something you can use the utils.js
There are three usefull functions:
 - log() - shortcut for the console.log (infinite parameters)
 - logf() - logs with flattening circular objects (single parameter)
 - logk() - logs the keys of a object (single parameter)

## What is supported ?

The main focus was easily editing and creating of new maps and tilesets.
Godot added the ability to create Tilesets with Atlas Tiles.
This is more efficient than one Tileset object instead of 500 singe tiles.
The Atlas needs a region and tile size - these are automatically taken from the Tiled editor.

## Features list:

- [x] Export Tiled file as a Godot scene. Each layer in Tiled is a TileMap in Godot.
- [x] Export TileSets from Tiled standalone tileset files.
- [ ] Orthogonal, isometric, staggered, and hexagonal maps.
- [ ] Export visibility and opacity from layers.
- [x] Export collision shapes (based on Tiled object type).
- [ ] Export occluder shapes (based on Tiled object type).
- [ ] Export navigation shapes (based on Tiled object type).
- [ ] Support for one-way collision shapes.
- [ ] Support for image layers.
- [ ] Support for object layers, which are exported as StaticBody2D, Area2D or LightOccluder2D for shapes (depending on the type property) and as Sprite for tiles.
- [ ] Support for group layers, which are exported as Node2Ds.
- [ ] Custom properties for maps, layers, tilesets, and objects are exported as metadata. Custom properties on tiles can be Exported into the TileSet resource.
- [ ] Map background Exported as a parallax background

## What's the long term?
I'm making a 2D platformer and I'm gonna focus on these needs for now.
Generally i would like to support everything Tiled offers because it's a very good level editor.

If you are using the plugins and have some problems or feature request or found some bugs.
Just open an issue here in the gitHub repo.

## Contact me:

**Tiled forum:**

https://discourse.mapeditor.org/t/tiled-editor-map-and-tileset-integration-with-godot-3-2/4347

**Reddit topic:**

https://www.reddit.com/r/godot/comments/f1wh4a/tiled_editor_map_and_tileset_integration_with/

**Cheers! And happy game making with Godot.**
