/*global tiled, TextFile */
class GodotTilemapExporter {

    constructor(map, fileName) {
        this.map = map;
        this.fileName = fileName;
        // noinspection JSUnresolvedFunction
        this.projectRoot = this.map.property("projectRoot");
        this.tileOffset = 65536;
        this.tilesetColumns = 0;
        this.tileset = null;
    };

    write() {

        let poolIntArrayString = '';
        let tilesetsString = '';

        // noinspection JSUnresolvedVariable
        for (let index = 0; index < this.map.tilesets.length; ++index) {

            // noinspection JSUnresolvedVariable
            this.tileset = this.map.tilesets[index];

            /**
             * Tileset should expose columns ... but didn't at the moment so we
             * calculate them base on the image width and tileWidth
             **/
            // noinspection JSUnresolvedVariable
            this.tilesetColumns = Math.floor(this.tileset.imageWidth / this.tileset.tileWidth);
            log("tilesetColumns: ", this.tilesetColumns);

            let tilesetId = index + 1;
            // noinspection JSUnresolvedVariable
            let tilesetPath = this.tileset.asset.fileName.replace(this.projectRoot, "").replace('.tsx', '.tres');
            tilesetsString += this.getTilesetResourceTemplate(tilesetId, tilesetPath);
        }

        // noinspection JSUnresolvedVariable
        for (let i = 0; i < this.map.layerCount; ++i) {

            // noinspection JSUnresolvedFunction
            let layer = this.map.layerAt(i);

            // noinspection JSUnresolvedVariable
            if (layer.isTileLayer) {

                // noinspection JSUnresolvedVariable
                let boundingRect = layer.region().boundingRect;

                for (let y = boundingRect.top; y <= boundingRect.bottom; ++y) {
                    for (let x = boundingRect.left; x <= boundingRect.right; ++x) {

                        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        let tileId = layer.cellAt(x, y).tileId;
                        let tileGodotID = tileId;

                        /** Handle Godot strange offset by rows in the tileset image **/
                        if(tileId >= this.tilesetColumns) {
                            let tileY= Math.floor(tileId / this.tilesetColumns);
                            let tileX = (tileId % this.tilesetColumns);
                            tileGodotID =  tileX + (tileY * this.tileOffset);
                        }

                        /** Check and don't export blank tiles **/
                        if(tileId !== -1) {

                            // Godot has some strange cordiante using 65536
                            let firstParam = x + (y * this.tileOffset);
                            let secondParam = 0;

                            poolIntArrayString += firstParam + ", " + secondParam + ", " + tileGodotID + ", ";
                        }
                    }
                }
            }
        }

        // Remove trailing commas and blank
        poolIntArrayString = poolIntArrayString.replace(/,\s*$/, "");

        if(poolIntArrayString === ""){
            console.error("The tilemap looks empty!");
        }

        let tileMapName = "TileMap";

        // noinspection JSUnresolvedVariable
        let file = new TextFile(this.fileName, TextFile.WriteOnly);
        let tileMapTemplate = this.getSceneTemplate(tileMapName, tilesetsString, poolIntArrayString);

        file.write(tileMapTemplate);
        file.commit();

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
