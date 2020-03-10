/*global tiled, TextFile */
class GodotTilesetExporter {

    constructor(tileset, fileName) {
        this.tileset = tileset;
        this.fileName = fileName;
        // noinspection JSUnresolvedFunction
        this.projectRoot = this.tileset.property("projectRoot");
        this.spriteImagePath = this.tileset.image.replace(this.projectRoot, "");
        this.shapesResources = "";
        this.shapes = "";
    };

    write() {

        // Exports collision shapes ... for now
        this.iterateTiles();

        // noinspection JSUnresolvedVariable
        const file = new TextFile(this.fileName, TextFile.WriteOnly);
        let tilesetTemplate = this.getTilesetTemplate();
        file.write(tilesetTemplate);
        file.commit();
        // file.close(); //not neede anymore since tiled 1.3.3
    }

    iterateTiles() {

        let autotileCoordinates = {x: 0, y: 0};

        // noinspection JSUnresolvedVariable
        let tiles = this.tileset.tiles;

        for (let index = 0; index < tiles.length; index++) {
            let tile = tiles[index];

            // noinspection JSUnresolvedVariable
            if (tile.objectGroup !== null) {

                // noinspection JSUnresolvedVariable
                if (tile.objectGroup.objects.length > 0) {

                    // noinspection JSUnresolvedVariable
                    for (let oIndex = 0; oIndex < tile.objectGroup.objects.length; oIndex++) {

                        // noinspection JSUnresolvedVariable
                        let object = tile.objectGroup.objects[oIndex];

                        //TODO: add occlusions, navigation
                        this.exportCollisions(object, tile, autotileCoordinates);
                    }
                }
            }

            autotileCoordinates.x += 1;
            if ((index) < this.tileset.columns) {
                autotileCoordinates.y += 1;
            }

        }

        this.shapes = this.shapes.replace(/,\s*$/, "");
    }

    exportCollisions(object, tile, autotileCoordinates) {
        // noinspection JSUnresolvedVariable
        if (object.polygon) {
            this.shapesResources += this.getCollisionShapePolygon(tile.id, object.polygon);
        } else if (object.width !== 0 && object.height !== 0) {
            this.shapesResources += this.getCollisionShapeRectangle(tile.id, object.width);
        }

        this.shapes += this.getShapesTemplate(
            autotileCoordinates,
            false,
            tile.id
        );
    }

    getTilesetTemplate() {
        // noinspection JSUnresolvedVariable
        return `[gd_resource type="TileSet" load_steps=3 format=2]

[ext_resource path="res://${this.spriteImagePath}" type="Texture" id=1]

${this.shapesResources}
[resource]
0/name = "${this.tileset.name} 0"
0/texture = ExtResource( 1 )
0/tex_offset = Vector2( 0, 0 )
0/modulate = Color( 1, 1, 1, 1 )
0/region = Rect2( 0, 0, ${this.tileset.imageWidth}, ${this.tileset.imageHeight} )
0/tile_mode = 2
0/autotile/icon_coordinate = Vector2( 0, 0 )
0/autotile/tile_size = Vector2( ${this.tileset.tileWidth}, ${this.tileset.tileHeight} )
0/autotile/spacing = 0
0/autotile/occluder_map = [  ]
0/autotile/navpoly_map = [  ]
0/autotile/priority_map = [  ]
0/autotile/z_index_map = [  ]
0/occluder_offset = Vector2( 0, 0 )
0/navigation_offset = Vector2( 0, 0 )
0/shapes = [ ${this.shapes} ]
0/z_index = 0
`;
    }

    getShapesTemplate(coordinates, isOneWay, shapeID) {
        return `{
"autotile_coord": Vector2( ${coordinates} ),
"one_way": ${isOneWay},
"one_way_margin": 1.0,
"shape": SubResource( ${shapeID} ),
"shape_transform": Transform2D( 1, 0, 0, 1, 0, 0 )
}, 
`;
    }

    getCollisionShapePolygon(id, polygon) {
        let coordinateString = "";
        polygon.forEach((coordinate) => {
            coordinateString += coordinate.x + ", " + coordinate.y + ", ";
        });
        // Remove trailing commas and blank
        coordinateString = coordinateString.replace(/,\s*$/, "");
        return `[sub_resource type="ConvexPolygonShape2D" id=${id}]
points = PoolVector2Array( ${coordinateString} )
`;
    }

    getCollisionShapeRectangle(id, tileSize) {
        return `[sub_resource type="ConvexPolygonShape2D" id=${id}]
points = PoolVector2Array( 0, 0, ${tileSize}, 0, ${tileSize}, ${tileSize}, 0, ${tileSize} )
`;
    }

}

const customTilesetFormat = {
    name: "Godot Tileset format",
    extension: "tres",

    write: function (tileset, fileName) {
        const exporter = new GodotTilesetExporter(tileset, fileName);
        exporter.write();
    }
};

// noinspection JSUnresolvedFunction
tiled.registerTilesetFormat("Godot", customTilesetFormat);
