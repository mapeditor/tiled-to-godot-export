const GodotExporter = (function () {

    const Constructor = function (tileset, fileName) {
        this.tileset = tileset;
        this.fileName = fileName;
        this.projectRoot = this.tileset.property("projectRoot");
        this.spriteImagePath = this.tileset.image.replace(this.projectRoot, "");
    };

    Constructor.prototype.write = function () {

        log("--- tileset start ---");
        logf(this.tileset.tiles[0].objectGroup);
        log(this.tileset.tileCount);
        log("--- tileset end ---");

        this.tileset.tiles.forEach((tile, index) => {
            // log("tile id: " + tile.id);
            // if(tile.objectGroup.objects.length > 0){
            //     // tile.objectGroup.objects.forEach((mapObject) => {
            //     //     logk(mapObject.polygon);
            //     // });
            // }

            //     let shapesResources += customTilesetFormat.getShapesResourcesTemplate(tile.id);
        });

        this.shapesResources = this.getShapesResourcesTemplate();
        this.shapes = this.getShapesTemplate();

        let tilesetTemplate = this.getTilesetTemplate();

        const file = new TextFile(this.fileName, TextFile.WriteOnly);
        file.write(tilesetTemplate);
        file.commit();
        // file.close(); //not neede anymore since tiled 1.3.3
    };

    Constructor.prototype.getTilesetTemplate = function () {
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
    };
    Constructor.prototype.getShapesResourcesTemplate = function (id) {
        return `[sub_resource type="ConvexPolygonShape2D" id=1]
points = PoolVector2Array( 0, 0, 16, 0, 16, 16, 0, 16 )
`;
    };
    Constructor.prototype.getShapesTemplate = function () {
        return `{
"autotile_coord": Vector2( 0, 0 ),
"one_way": false,
"one_way_margin": 1.0,
"shape": SubResource( 1 ),
"shape_transform": Transform2D( 1, 0, 0, 1, 0, 0 )
}
`;
    };

    return Constructor;
})();

const customTilesetFormat = {
    name: "Godot Tileset format",
    extension: "tres",

    write: function (tileset, fileName) {
        const exporter = new GodotExporter(tileset, fileName);
        exporter.write();
    }
};

tiled.registerTilesetFormat("Godot", customTilesetFormat);
