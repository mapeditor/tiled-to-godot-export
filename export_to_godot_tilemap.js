/*global tiled, TextFile */
class GodotTilemapExporter {

    constructor(map, fileName) {
        this.map = map;
        this.fileName = fileName;
        // noinspection JSUnresolvedFunction
        this.projectRoot = this.map.property("projectRoot");
    };

    _tileOffset = 65536;

    write(map, fileName) {

        // noinspection JSUnresolvedFunction
        let projectRoot = map.property("projectRoot");
        let poolIntArrayString = '';
        let tilesets = '';

        // noinspection JSUnresolvedVariable
        map.tilesets.forEach((tileset,index)=> {
            let tilesetId = index + 1;
            // noinspection JSUnresolvedVariable
            let tilesetPath = tileset.asset.fileName.replace(projectRoot, "").replace('.tsx', '.tres');
            tilesets += customTileMapFormat.getTilesetResourceTemplate(tilesetId, tilesetPath);
        });

        // noinspection JSUnresolvedVariable
        for (let i = 0; i < map.layerCount; ++i) {

            // noinspection JSUnresolvedFunction
            let layer = map.layerAt(i);

            // noinspection JSUnresolvedVariable
            if (layer.isTileLayer) {

                // noinspection JSUnresolvedVariable
                let boundingRect = layer.region().boundingRect;

                for (let y = boundingRect.y; y < boundingRect.height; ++y) {
                    for (let x = boundingRect.x; x < boundingRect.width; ++x) {

                        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        let tileId = layer.cellAt(x, y).tileId;

                        //check and dont export blank tiles
                        if(tileId !== -1) {

                            // Godot has some strange cordiante using 65536
                            let firstParam = x + (y * this._tileOffset);
                            let secondParam = 0;

                            poolIntArrayString += firstParam + ", " + secondParam + ", " + tileId + ", ";
                        }
                    }
                }
            }
        }

        // Remove trailing commas and blank
        poolIntArrayString = poolIntArrayString.replace(/,\s*$/, "");

        let tileMapName = "TileMap";

        // noinspection JSUnresolvedVariable
        let file = new TextFile(fileName, TextFile.WriteOnly);
        let tileMapTemplate = customTileMapFormat.getSceneTemplate(tileMapName, tilesets, poolIntArrayString);

        file.write(tileMapTemplate);
        file.commit();
        file.close();

    }

    getSceneTemplate(tileMapName, tilesets, poolIntArrayString){
        return `[gd_scene load_steps=2 format=2]
${tilesets}

[node name="Node2D" type="Node2D"]

[node name="${tileMapName}" type="TileMap" parent="."]
tile_set = ExtResource( 1 )
cell_size = Vector2( 16, 16 )
cell_custom_transform = Transform2D( 16, 0, 0, 16, 0, 0 )
format = 1
tile_data = PoolIntArray( ${poolIntArrayString} )
`;
    }

    getTilesetResourceTemplate(id, path) {
        return `[ext_resource path="res://${path}" type="TileSet" id=${id}]
`;
    }

}

const customTileMapFormat = {
    name: "Godot Tilemap format",
    extension: "tscn",

    write: function (map, fileName) {
        const exporter = new GodotTilemapExporter(map, fileName);
        exporter.write();
    }
};

// noinspection JSUnresolvedFunction
tiled.registerMapFormat("Godot", customTileMapFormat);
