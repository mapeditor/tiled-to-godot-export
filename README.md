# Tiled To Godot Export
Tiled plugins for exporting Tilemaps and Tilesets in Godot format

# Tiled Extensions
Tiled can be extended with the use of JavaScript. Scripts can be used to implement custom map formats, custom actions and new tools. Scripts can also automate actions based on signals.

More information about this:

https://github.com/mapeditor/tiled-extensions

## How to use this extensions

First you need to put them in Tiled extension directory.

When you open a Tilemap or Tileset you need to add this custom property:
"projectRoot" : string
Than set the value to the projectRoot of your Godot project.
All of this is needed so when you export to a subfolder in your Godot project 
all the relative paths for the resources (res://) are set corectly and relative to the
custom property you've added "projectRoot";

Than if everything is fine when you go to File -> Export As
A new option should exist:
Gotod Tilemap format (*.tscn)
and for tilesets respectivly:
Godot Tileset format (*.tres)

## How does it work? What is supported ?

The main focus was easily editing and creating of new maps and tilesets.
Godot added the ability to create Tilesets with Atlas Tiles.
This is the most eficient way since a tile map with 500 tiles has one Tileset object instead of 500 tiles.
The Atlas needs a region and tile size - these are automaticly taken form the Tiled editor.

## What's in progress ?
Tilesets with collision information.
Tilemap layers - each layer will be a subscene resource in the main .tscn

## What's long term
All other extras Tiled can offer are not planned for now.
I'm making a 2D platformer and I'm gonna focus on these needs for now.





