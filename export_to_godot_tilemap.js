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
        this.subResourcesString = "";
        this.extResourceId = 0;
        this.subResourceId = 0;

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
     * Adds a new subresource to the genrated file
     *
     * @param {string} type the type of subresource
     * @param {object} contentProperties key:value map of properties
     * @returns {int} the created sub resource id
     */
    addSubResource(type, contentProperties) {
        const id = this.subResourceId++;

        this.subResourcesString += `

[sub_resource type="${type}" id=${id}]
`;
        for (const [key, value] of Object.entries(contentProperties)) {
            if (value !== undefined) {
                this.subResourcesString += stringifyKeyValue(key, value, false, false, true) + '\n';
            }
        }

        return id;
    }

    /**
     * Generate a string with all tilesets in the map.
     * Godot allows only one tileset per tilemap so if you use more than one tileset per layer it's not going to work.
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
            this.tilesetsString += this.getTilesetResourceTemplate(this.extResourceId, tilesetPath, "TileSet");
        }

    }

    /**
     * Creates the Tilemap nodes. One Tilemap per one layer from Tiled.
     */
    setTileMapsString() {
        const mode = this.map.orientation === TileMap.Isometric ? 1 : undefined

        // noinspection JSUnresolvedVariable
        for (let i = 0; i < this.map.layerCount; ++i) {

            // noinspection JSUnresolvedFunction
            let layer = this.map.layerAt(i);
            this.handleLayer(layer, mode, ".");
        }
    }

    handleLayer(layer, mode, layer_parent) {
        // noinspection JSUnresolvedVariable
        if (layer.isTileLayer) {
            const layerData = this.getLayerData(layer);
            for (let idx = 0; idx < layerData.length; idx++) {
                const ld = layerData[idx];
                if (!ld.isEmpty) {
                    const tileMapName = idx === 0 ? layer.name || "TileMap " + i : ld.tileset.name || "TileMap " + i + "_" + idx;
                    this.mapLayerToTileset(layer.name, ld.tilesetID);
                    this.tileMapsString += this.getTileMapTemplate(tileMapName, mode, ld.tilesetID, ld.poolIntArrayString, layer, layer_parent);
                }
            }
        } else if (layer.isObjectLayer) {
            // create layer
            this.tileMapsString += stringifyNode({
                name: layer.name,
                type: "Node2D",
                parent: layer_parent,
                groups: splitCommaSeparated(layer.property("groups"))
            });

            // add entities
            for (const object of layer.objects) {
                const groups = splitCommaSeparated(object.property("groups"));

                if (object.tile) {
                    let tilesetsIndexKey = object.tile.tileset.name + "_Image";
                    let textureResourceId = 0;
                    if (!this.tilesetsIndex.get(tilesetsIndexKey)) {
                        this.extResourceId = this.extResourceId + 1;
                        textureResourceId = this.extResourceId;
                        this.tilesetsIndex.set(tilesetsIndexKey, this.extResourceId);
                        let tilesetPath = object.tile.tileset.image.replace(this.projectRoot, "");
                        this.tilesetsString += this.getTilesetResourceTemplate(this.extResourceId, tilesetPath, "Texture");
                    } else {
                        textureResourceId = this.tilesetsIndex.get(tilesetsIndexKey);
                    }

                    let tileOffset = this.getTileOffset(object.tile.tileset, object.tile.id);

                    // Account for anchoring in Godot (corner vs. middle):
                    let objectPositionX = object.x + (object.tile.width / 2);
                    let objectPositionY = object.y - (object.tile.height / 2);

                    this.tileMapsString += stringifyNode(
                        {
                            name: object.name,
                            type: "Sprite",
                            parent: layer_parent + "/" + layer.name
                        }, 
                        this.merge_properties(
                            object.properties(),
                            {
                                position: `Vector2( ${objectPositionX}, ${objectPositionY} )`,
                                texture: `ExtResource( ${textureResourceId} )`,
                                region_enabled: true,
                                region_rect: `Rect2( ${tileOffset.x}, ${tileOffset.y}, ${object.tile.width}, ${object.tile.height} )`
                            }
                        ),
                        this.meta_properties(layer.properties())
                    );
                } else if (object.type == "Area2D" && object.width && object.height) {
                    // Creates an Area2D node with a rectangle shape inside
                    // Does not support rotation
                    const width = object.width / 2;
                    const height = object.height / 2;
                    const objectPositionX = object.x + width;
                    const objectPositionY = object.y + height;

                    this.tileMapsString += stringifyNode(
                        {
                            name: object.name,
                            type: "Area2D",
                            parent:  layer_parent + "/" + layer.name,
                            groups: groups
                        }, 
                        this.merge_properties(
                            object.properties(),
                            {
                                collision_layer: object.property("collision_layer"),
                                collision_mask: object.property("collision_mask")
                            }
                        ),
                        this.meta_properties(layer.properties())
                    );

                    const shapeId = this.addSubResource("RectangleShape2D", {
                        extents: `Vector2( ${width}, ${height} )`
                    });
                    this.tileMapsString += stringifyNode(
                        {
                            name: "CollisionShape2D",
                            type: "CollisionShape2D",
                            parent: `${layer_parent}/${layer.name}/${object.name}`
                        }, 
                        this.merge_properties(
                            object.properties(),
                            {
                                shape: `SubResource( ${shapeId} )`,
                                position: `Vector2( ${objectPositionX}, ${objectPositionY} )`,
                            }
                        ),
                        this.meta_properties(layer.properties())
                    );
                } else if (object.type == "Node2D") {
                    this.tileMapsString += stringifyNode(
                        {
                            name: object.name,
                            type: "Node2D",
                            parent: layer_parent + "/" + layer.name,
                            groups: groups
                        },
                        this.merge_properties(
                            object.properties(), 
                            {
                                position: `Vector2( ${object.x}, ${object.y} )`
                            }
                        ),
                        this.meta_properties(object.properties())
                    );
                }
            }
        } else if (layer.isGroupLayer) {
            var node_type = layer.property("godot:type") || "Node2D";
            this.tileMapsString += stringifyNode(
                {
                    name: layer.name,
                    type: node_type,
                    parent: layer_parent,
                    groups: splitCommaSeparated(layer.property("groups"))
                }, 
                this.merge_properties(
                    layer.properties(),
                    {
                    }
                ),
                this.meta_properties(layer.properties())
            );
            for(var i = 0; i < layer.layerCount; ++i) { 
                this.handleLayer(layer.layers[i], mode, layer_parent + "/" + layer.name);
            }
        
        }
    }

    merge_properties(object_props, set_props){
        for (const [key, value] of Object.entries(object_props)) {
            if(key.startsWith("godot:node:")){
                set_props[key.substring(11)] = value;
            }
        }

        return set_props;
    }
    
    meta_properties(object_props){
        let results = {};
        for (const [key, value] of Object.entries(object_props)) {
            if(key.startsWith("godot:meta:")){
                results[key.substring(11)] = value;
            }
        }

        return results;
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
                            tilesetColumns: getTilesetColumns(tile.tileset),
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
     * Calculate the X and Y offset (in pixels) for the specified tile
     * ID within the specified tileset image.
     *
     * @param {Tileset} tileset - The full Tileset object
     * @param {int} tileId - Id for the tile to extract offset for
     * @returns {object} - An object with pixel offset in the format {x: int, y: int}
     */
    getTileOffset(tileset, tileId) {
        let columnCount = getTilesetColumns(tileset);
        let row = Math.floor(tileId / columnCount);
        let col = tileId % columnCount;
        let xOffset = tileset.margin + (tileset.tileSpacing * col);
        let yOffset = tileset.margin + (tileset.tileSpacing * row);
        return {
            x: (col * tileset.tileWidth) + xOffset,
            y: (row * tileset.tileHeight) + yOffset
        };
    }

    /**
     * Template for a scene
     * @returns {string}
     */
    getSceneTemplate() {
        const loadSteps = 2 + this.subResourceId;
        const type = this.map.property("godot:type") || "Node2D";
        const name = this.map.property("godot:name") || "Node2D";
        return `[gd_scene load_steps=${loadSteps} format=2]

${this.tilesetsString}
${this.subResourcesString}
[node name="${name}" type="${type}"]
${this.tileMapsString}
`;
    }

    /**
     * Template for a tileset resource
     * @returns {string}
     */
    getTilesetResourceTemplate(id, path, type) {
        // Strip leading slashes to prevent invalid triple slashes in Godot res:// path:
        path = path.replace(/^\/+/, '');
        return `[ext_resource path="res://${path}" type="${type}" id=${id}]
`;
    }

    /**
     * Template for a tilemap node
     * @returns {string}
     */
    getTileMapTemplate(tileMapName, mode, tilesetID, poolIntArrayString, layer, parent = ".") {
        const groups = splitCommaSeparated(layer.property("groups"));
        const zIndex = parseInt(layer.properties()['z_index'], 10);
        return stringifyNode(
            {
                name: tileMapName,
                type: "TileMap",
                parent: parent,
                groups: groups
            }, 
            this.merge_properties(
                layer.properties(),
                {
                    visible: layer.visible,
                    modulate: `Color( 1, 1, 1, ${layer.opacity} )`,
                    position: `Vector2( ${layer.offset.x}, ${layer.offset.y} )`,
                    tile_set: `ExtResource( ${tilesetID} )`,
                      cell_size: `Vector2( ${layer.map.tileWidth}, ${layer.map.tileHeight} )`,
                    cell_custom_transform: `Transform2D( 16, 0, 0, 16, 0, 0 )`,
                    format: 1,
                    mode: mode,
                    tile_data: `PoolIntArray( ${poolIntArrayString} )`,
                    z_index: typeof zIndex === 'number' && !isNaN(zIndex) ? zIndex : undefined
                }
            ),
            this.meta_properties(layer.properties())
        );
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
