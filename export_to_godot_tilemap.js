/*global tiled, TextFile */
class GodotTilemapExporter {

    // noinspection DuplicatedCode
    constructor(map, fileName) {
        this.map = map;
        this.fileName = fileName;
        // noinspection JSUnresolvedFunction
        this.projectRoot = this.map.property("projectRoot");
        if (!this.projectRoot) {
            throw new Error("Missing mandatory custom property: projectRoot!");
        }
        this.projectRoot = this.projectRoot.replace('\\', '/');
        this.tileOffset = 65536;
        this.tileMapsString = "";
        this.tilesetsString = "";

        /**
         * Tiled doesn't have tileset ID so we create a map
         * Tileset name to generated tilesetId.
         */
        this.tilesetsIndex = new Map();

        /**
         * Godot Tilemap has only one Tileset.
         * Each layer is Tilemap and is mapped to a single Tileset.
         * !!! Important !!
         * Do not add tiles from different tilesets in single layer.
         */
        this.layersToTilesetIndex = new Map();

    };

    write() {
        this.setTilesetsString();
        this.setTileMapsString();
        this.writeToFile();
        console.info(`Tilemap exported successfully to ${this.fileName}`);
    }

    /**
     * Generate a string with all tilesets in the map.
     * Godot allows only one tileset per tilemap so if you use more than one tileset per layer it's n ot going to work.
     * Godot supports several image textures per tileset but Tiled Editor doesn't.
     * Tiled editor supports only one tile
     * sprite image per tileset.
     * @returns {string}
     */
    setTilesetsString() {

        // noinspection JSUnresolvedVariable
        for (let index = 0; index < this.map.tilesets.length; ++index) {
            // noinspection JSUnresolvedVariable
            const tileset = this.map.tilesets[index];
            const tilesetID = index + 1;
            this.tilesetsIndex.set(tileset.name, tilesetID);
            // noinspection JSUnresolvedVariable
            let tilesetPath = tileset.asset.fileName.replace(this.projectRoot, "").replace('.tsx', '.tres');
            this.tilesetsString += this.getTilesetResourceTemplate(tilesetID, tilesetPath);
        }

    }

    /**
     * Creates the Tilemap nodes. One Tilemap per one layer from Tiled.
     */
    setTileMapsString() {
        // noinspection JSUnresolvedVariable
        for (let i = 0; i < this.map.layerCount; ++i) {

            // noinspection JSUnresolvedFunction
            let layer = this.map.layerAt(i);

            // noinspection JSUnresolvedVariable
            if (layer.isTileLayer) {
                const layerData = this.getLayerData(layer);

                if (!layerData.isEmpty) {
                    const tileMapName = layer.name || "TileMap " + i;
                    this.mapLayerToTileset(layer.name, layerData.tilesetID);
                    this.tileMapsString += this.getTileMapTemplate(tileMapName, layerData.tilesetID, layerData.poolIntArrayString);
                }

            }
        }
    }

    writeToFile() {
        // noinspection JSUnresolvedVariable
        let file = new TextFile(this.fileName, TextFile.WriteOnly);
        let tileMapTemplate = this.getSceneTemplate();
        file.write(tileMapTemplate);
        file.commit();
    }

    /**
     * Creates all the tiles coordinate for the current layer and picks the first tileset which is used.
     * It's important to not use more than one tileset for a layer.
     * Otherwise the tiles from the second layer are going to be displayed incorrectly as tiles form the first
     * or with a wrong index leading to crash on export.
     * @returns {{tilesetID: *, poolIntArrayString: string, layerName: *}}
     */
    getLayerData(layer) {
        // noinspection JSUnresolvedVariable
        let boundingRect = layer.region().boundingRect;
        let poolIntArrayString = '';

        let tileset = null;
        let tilesetID = null;
        let tilesetColumns;
        let hasWarned = false;

        for (let y = boundingRect.top; y <= boundingRect.bottom; ++y) {
            for (let x = boundingRect.left; x <= boundingRect.right; ++x) {

                // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                let tileId = layer.cellAt(x, y).tileId;
                let tileGodotID = tileId;

                /** Check and don't export blank tiles **/
                if (tileId !== -1) {

                    /**
                     * Set the tileset based on the first tile that is found
                     */
                    const tile = layer.tileAt(x, y);
                    if (tileset === null) {
                        // noinspection JSUnresolvedFunction
                        tileset = tile.tileset;
                        tilesetColumns = this.getTilesetColumns(tileset);
                    } else if (!hasWarned && tileset !== tile.tileset) {
                        tiled.warn(`Multiple tilesets used on layer "${layer.name}", only exporting tiles from "${tileset.name}"`);
                        hasWarned = true;
                        continue;
                    }

                    /** Handle Godot strange offset by rows in the tileset image **/
                    if (tileId >= tilesetColumns) {
                        let tileY = Math.floor(tileId / tilesetColumns);
                        let tileX = (tileId % tilesetColumns);
                        tileGodotID = tileX + (tileY * this.tileOffset);
                    }

                    /**
                     * Godot coordinates use an offset of 65536
                     * Check the README.md: Godot Tilemap Encoding & Limits
                     * */
                    let yValue = y;
                    let xValue = x;
                    if (xValue < 0) {
                        yValue = y + 1;
                    }
                    let firstParam = xValue + (yValue * this.tileOffset);

                    /**
                     This is texture image form the tileset in godot
                     Tiled doesn't support more than one image in tileset
                     */
                    let secondParam = 0;

                    poolIntArrayString += firstParam + ", " + secondParam + ", " + tileGodotID + ", ";
                }
            }
        }

        // Remove trailing commas and blank
        poolIntArrayString = poolIntArrayString.replace(/,\s*$/, "");

        if (tileset !== null && poolIntArrayString !== "") {
            tilesetID = this.getTilesetIDByTileset(tileset);
        } else {
            console.warn(`Error: The layer ${layer.name} is empty and has been skipped!`);
        }

        return {
            layer: layer,
            isEmpty: tileset === null,
            tilesetID: tilesetID,
            poolIntArrayString: poolIntArrayString
        };
    }

    getTilesetIDByTileset(tileset) {
        return this.tilesetsIndex.get(tileset.name);
    }

    /**
     * Tileset should expose columns ... but didn't at the moment so we
     * calculate them base on the image width and tileWidth
     * return {number}
     **/
    getTilesetColumns(tileset) {
        // noinspection JSUnresolvedVariable
        return Math.floor(tileset.imageWidth / tileset.tileWidth);
    }

    /**
     * Template for a scene
     * @returns {string}
     */
    getSceneTemplate() {
        return `[gd_scene load_steps=2 format=2]

${this.tilesetsString}
[node name="Node2D" type="Node2D"]
${this.tileMapsString}
`;
    }

    /**
     * Template for a tileset resource
     * @returns {string}
     */
    getTilesetResourceTemplate(id, path) {
        return `[ext_resource path="res://${path}" type="TileSet" id=${id}]
`;
    }

    /**
     * Template for a tilemap node
     * @returns {string}
     */
    getTileMapTemplate(tileMapName, tilesetID, poolIntArrayString) {
        return `[node name="${tileMapName}" type="TileMap" parent="."]
tile_set = ExtResource( ${tilesetID} )
cell_size = Vector2( 16, 16 )
cell_custom_transform = Transform2D( 16, 0, 0, 16, 0, 0 )
format = 1
tile_data = PoolIntArray( ${poolIntArrayString} )
`;
    }

    mapLayerToTileset(layerName, tilesetID) {
        this.layersToTilesetIndex[layerName] = tilesetID;
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
