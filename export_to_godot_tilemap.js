/*global tiled, TextFile */
class GodotTilemapExporter {

    // noinspection DuplicatedCode
    constructor(map, fileName) {
        this.map = map;
        this.fileName = fileName;
        // noinspection JSUnresolvedFunction
        this.projectRoot = getResPath(this.map.property("projectRoot"), fileName);
        this.tileOffset = 65536;
        this.tileMapsString = "";
        this.tilesetsString = "";
        this.extResourceId = 0;

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
            this.extResourceId = index + 1;
            this.tilesetsIndex.set(tileset.name, this.extResourceId);
            // noinspection JSUnresolvedVariable
            let tilesetPath = tileset.asset.fileName.replace(this.projectRoot, "").replace('.tsx', '.tres');
            this.tilesetsString += this.getTilesetResourceTemplate(this.extResourceId, tilesetPath);
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
                for (let idx = 0; idx < layerData.length; idx++) {
                    const ld = layerData[idx];
                    if (!ld.isEmpty) {
                        const tileMapName = idx === 0 ? layer.name || "TileMap " + i : ld.tileset.name || "TileMap " + i + "_" + idx;
                        this.mapLayerToTileset(layer.name, ld.tilesetID);
                        this.tileMapsString += this.getTileMapTemplate(tileMapName, ld.tilesetID, ld.poolIntArrayString, ld.parent, layer.map.tileWidth, layer.map.tileHeight);
                    }
                }
            } else if (layer.isObjectLayer) {
                console.log('Object Layer Found: ', layer.name);
                this.tileMapsString += `

[node name="${layer.name}" type="Node2D" parent="."]`;
                for (const object of layer.objects) {
                    console.log("    Object Name: ", object.name);
                    console.log("        Tile: ", object.tile);
                    if (object.tile) {
                        console.log("            Id: ", object.tile.id);
                        console.log("            Width: ", object.tile.width);
                        console.log("            Height: ", object.tile.height);
                    }
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

        const tilesetList = [];

        for (let y = boundingRect.top; y <= boundingRect.bottom; ++y) {
            for (let x = boundingRect.left; x <= boundingRect.right; ++x) {

                // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                let cell = layer.cellAt(x, y);
                let tileId = cell.tileId;
                let tileGodotID = tileId;

                /** Check and don't export blank tiles **/
                if (tileId !== -1) {

                    /**
                     * Find the tileset on the list, if not found, add
                     */
                    const tile = layer.tileAt(x, y);

                    let tileset = tilesetList.find(item => item.tileset === tile.tileset);

                    if (!tileset) {
                        tileset = {
                            tileset: tile.tileset,
                            tilesetID: null,
                            tilesetColumns: this.getTilesetColumns(tile.tileset),
                            layer: layer,
                            isEmpty: tile.tileset === null,
                            poolIntArrayString: "",
                            parent: tilesetList.length === 0 ? "." : layer.name
                        };

                        tilesetList.push(tileset);
                    }

                    const tilesetColumns = tileset.tilesetColumns;

                    /** Handle Godot strange offset by rows in the tileset image **/
                    if (tileId >= tilesetColumns) {
                        let tileY = Math.floor(tileId / tilesetColumns);
                        let tileX = (tileId % tilesetColumns);
                        tileGodotID = tileX + (tileY * this.tileOffset);
                    }

                    /**
                     * Godot coordinates use an offset of 65536
                     * Check the README.md: Godot Tilemap Encoding & Limits
                     */
                    let yValue = y;
                    let xValue = x;
                    if (xValue < 0) {
                        yValue = y + 1;
                    }
                    let firstParam = xValue + (yValue * this.tileOffset);


                    /**
                     * This is texture image form the tileset in godot
                     * Tiled doesn't support more than one image in tileset
                     * Also this is used to encode the rotation of a tile... as it seems. :P
                     */
                    let secondParam = this.getSecondParam(cell);

                    tileset.poolIntArrayString += firstParam + ", " + secondParam + ", " + tileGodotID + ", ";
                }
            }
        }

        // Remove trailing commas and blank
        tilesetList.forEach(i => {
            i.poolIntArrayString = i.poolIntArrayString.replace(/,\s*$/, "");
        });

        for (let idx = 0; idx < tilesetList.length; idx++) {
            const current = tilesetList[idx];
            if (current.tileset !== null && current.poolIntArrayString !== "") {
                current.tilesetID = this.getTilesetIDByTileset(current.tileset);
            } else {
                console.warn(`Error: The layer ${layer.name} is empty and has been skipped!`);
            }
        }

        return tilesetList;
    }

    getTilesetIDByTileset(tileset) {
        return this.tilesetsIndex.get(tileset.name);
    }

    getSecondParam(cell) {
        /**
         * no rotation or flips
         * cell.cell.flippedHorizontally is false and
         * cell.cell.flippedVertically is false
         * cell.cell.flippedAntiDiagonally is false
         */
        let secondParam = 0;


        /**
         * rotated 1x left or
         * rotated 3x right
         */
        if (
            cell.flippedHorizontally === false &&
            cell.flippedVertically === true &&
            cell.flippedAntiDiagonally === true
        ) {
            secondParam = -1073741824;
        }

        /**
         * rotated 2x left or 2x right or
         * vertical and horizontal flip
         */
        if (
            cell.flippedHorizontally === true &&
            cell.flippedVertically === true &&
            cell.flippedAntiDiagonally === false
        ) {
            secondParam = 1610612736;
        }

        /**
         * rotated 3x left or
         * rotated 1x right
         */
        if (
            cell.flippedHorizontally === true &&
            cell.flippedVertically === false &&
            cell.flippedAntiDiagonally === true
        ) {
            secondParam = -1610612736;
        }

        /**
         * flipped horizontal or
         * flipped vertical and 2x times rotated left/right
         */
        if (
            cell.flippedHorizontally === true &&
            cell.flippedVertically === false &&
            cell.flippedAntiDiagonally === false
        ) {
            secondParam = 536870912;
        }

        /**
         * flipped horizontal and 1x rotated left or
         * flipped vertical and 1x time rotated right
         */
        if (
            cell.flippedHorizontally === false &&
            cell.flippedVertically === false &&
            cell.flippedAntiDiagonally === true
        ) {
            secondParam = -2147483648;
        }

        /**
         * flipped horizontal and 2x times rotated left/right or
         * flipped vertically
         */
        if (
            cell.flippedHorizontally === false &&
            cell.flippedVertically === true &&
            cell.flippedAntiDiagonally === false
        ) {
            secondParam = 1073741824;
        }

        /**
         * flipped horizontal and 3x rotated left or
         * flipped vertically and 1x rotated left or
         * flipped horizontal and 1x rotated right or
         * flipped vertically and 3x rotated right
         */
        if (
            cell.flippedHorizontally === true &&
            cell.flippedVertically === true &&
            cell.flippedAntiDiagonally === true
        ) {
            secondParam = -536870912;
        }

        return secondParam;
    }

    /**
     * Tileset should expose columns ... but didn't at the moment so we
     * calculate them base on the image width and tileWidth.
     * Takes into account margin (extra space around the image edges) and
     * tile spacing (padding between individual tiles).
     * @returns {number}
     */
    getTilesetColumns(tileset) {
        // noinspection JSUnresolvedVariable
        const imageWidth = tileset.imageWidth + tileset.tileSpacing - tileset.margin
        const tileWidth = tileset.tileWidth + tileset.tileSpacing
        const calculatedColumnCount = imageWidth / tileWidth
        // Tiled ignores "partial" tiles (extra unaccounted for pixels in the image),
        // so we need to return as Math.floor to avoid throwing off the tile indices.
        return Math.floor(calculatedColumnCount);
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
        // Strip leading slashes to prevent invalid triple slashes in Godot res:// path:
        path = path.replace(/^\/+/, '');
        return `[ext_resource path="res://${path}" type="TileSet" id=${id}]
`;
    }

    /**
     * Template for a tilemap node
     * @returns {string}
     */
    getTileMapTemplate(tileMapName, tilesetID, poolIntArrayString, parent = ".", tileWidth = 16, tileHeight = 16) {
        return `[node name="${tileMapName}" type="TileMap" parent="${parent}"]
tile_set = ExtResource( ${tilesetID} )
cell_size = Vector2( ${tileWidth}, ${tileHeight} )
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
