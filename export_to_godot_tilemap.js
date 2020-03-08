var customTileMapFormat = {
    name: "Godot Tilemap format",
    extension: "tscn",

    write: function(map, fileName) {

        let projectRoot = map.property("projectRoot");
        let poolIntArrayString = '';
        let tilesets = '';

        map.tilesets.forEach((tileset,index)=> {
            let tilesetId = index + 1;
            let tilesetPath = tileset.asset.fileName.replace(projectRoot, "").replace('.tsx', '.tres');
            tilesets += customTileMapFormat.getTilesetResourceTemplate(tilesetId, tilesetPath); 
        });

        for (var i = 0; i < map.layerCount; ++i) {
            var layer = map.layerAt(i);

            if (layer.isTileLayer) {

                let boundingRect = layer.region().boundingRect;


                for (y = boundingRect.y; y < boundingRect.height; ++y) {
                    for (x = boundingRect.x; x < boundingRect.width; ++x) {

                        let tileId = layer.cellAt(x, y).tileId;

                        //check and dont export blank tiles
                        if(tileId !== -1) {

                            // Godot has some strange cordiante using 65536
                            let firstParam = x + (y * 65536);
                            let secondParam = 0;

                            poolIntArrayString += firstParam + ", " + secondParam + ", " + tileId + ", ";
                        }
                    }
                }
            }
        }

        // Remove trailling commas and blank
        poolIntArrayString = poolIntArrayString.replace(/,\s*$/, "");

        var tileMapName = "TileMap";

        var file = new TextFile(fileName, TextFile.WriteOnly);
        var tileMapTemplate = customTileMapFormat.getSceneTemplate(tileMapName, tilesets, poolIntArrayString);

        file.write(tileMapTemplate);
        file.commit();
        file.close();

    },

    getSceneTemplate: function(tileMapName, tilesets, poolIntArrayString){
let template =
`[gd_scene load_steps=2 format=2]
${tilesets}

[node name="Node2D" type="Node2D"]

[node name="${tileMapName}" type="TileMap" parent="."]
tile_set = ExtResource( 1 )
cell_size = Vector2( 16, 16 )
cell_custom_transform = Transform2D( 16, 0, 0, 16, 0, 0 )
format = 1
tile_data = PoolIntArray( ${poolIntArrayString} )
`
return template;
;
    },
    getTilesetResourceTemplate: function(id, path) {
let template =
`[ext_resource path="res://${path}" type="TileSet" id=${id}]
`
return template;
    }

}

tiled.registerMapFormat("Godot", customTileMapFormat);