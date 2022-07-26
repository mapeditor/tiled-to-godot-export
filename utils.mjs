/*! (c) 2018, Andrea Giammarchi, (ISC) */
var Flatted=function(a,l){return{parse:function(n,t){var e=JSON.parse(n,i).map(f),r=e[0],u=t||s,c="object"==typeof r&&r?function u(c,f,n,i){return Object.keys(n).reduce(function(n,t){var e=n[t];if(e instanceof a){var r=c[e];"object"!=typeof r||f.has(r)?n[t]=i.call(n,t,r):(f.add(r),n[t]=i.call(n,t,u(c,f,r,i)))}else n[t]=i.call(n,t,e);return n},n)}(e,new Set,r,u):r;return u.call({"":c},"",c)},stringify:function(n,e,t){function r(n,t){if(u)return u=!u,t;var e=a.call(this,n,t);switch(typeof e){case"object":if(null===e)return e;case l:return c.get(e)||p(c,f,e)}return e}for(var u,c=new Map,f=[],i=[],a=e&&typeof e==typeof f?function(n,t){if(""===n||-1<e.indexOf(n))return t}:e||s,o=+p(c,f,a.call({"":n},"",n));o<f.length;o++)u=!0,i[o]=JSON.stringify(f[o],r,t);return"["+i.join(",")+"]"}};function s(n,t){return t}function p(n,t,e){var r=a(t.push(e)-1);return n.set(e,r),r}function f(n){return n instanceof a?a(n):n}function i(n,t){return typeof t==l?new a(t):t}}(String,"string");

const log = console.log.bind(console);

export function logf(data) {
  console.log(Flatted.stringify(data));
}

export function logk(data) {
  console.log(Object.keys(data));
}

/**
 * Returns a full res path to a file.
 * 
 * If relativePath is defined, uses relativePath to determine the res path.
 * If relativePath is undefined, uses projectRoot to determine the res path.
 * If relativePath is undefined and projectRoot is undefined, automatically determines the res path.
 * 
 * Information on file paths in Godot: https://docs.godotengine.org/en/stable/tutorials/io/data_paths.html
 *
 * @param {string} projectRoot desired project root path, which can be an absolute or relative path to the outputPath. Ex: 'C:/project' or './../..'
 * @param {string} relativePath relative path to file. Ex: '/maps/level1'
 * @param {string} outputPath full path and name of destination file. Ex: 'C:/project/maps/level1/tileset.tres'
 * @returns {string} full relative path to file to be included in a 'res://' path. Ex: 'maps/level1/tileset.tres'
 */
export function getResPath(projectRoot, relativePath, outputPath) {
  let fullResPath = ''
  if (relativePath) {
    // Replace all backslashes with forward slashes
    relativePath = relativePath.replace(/\\/g, '/');

    fullResPath = FileInfo.joinPaths(relativePath, FileInfo.fileName(outputPath));
  } else {
    const p = outputPath.split('/').slice(0, -1)

    // If projectRoot is not set, attempt to automatically determine projectRoot by searching for godot project file
    if (!projectRoot) {
      const out = p
      outputPath.split('/').every(_ => {
        let godotProjectFile = FileInfo.joinPaths(out.join('/'), 'project.godot');
        if (!File.exists(godotProjectFile)) {
          out.pop()
          return true;
        }
        return false;
      })
      projectRoot = out.join('/')
    }

    // Replace all backslashes with forward slashes
    projectRoot = projectRoot.replace(/\\/g, '/');
  
    // Use projectRoot as absolute if it doesn't start with ".", relative if it does
    if (projectRoot[0] === '.') {
      const out = p
      projectRoot.split('/').forEach((segment) => {
        if (segment === '..') {
          out.pop()
        }
      })
      projectRoot = out.join('/')
    }
  
    fullResPath = outputPath.replace(projectRoot, "");
  }

  // Strip leading slashes to prevent invalid triple slashes in Godot res:// path
  fullResPath = fullResPath.replace(/^\/+/, '');

  return fullResPath
}

/**
 * Tileset should expose columns ... but didn't at the moment so we
 * calculate them base on the image width and tileWidth.
 * Takes into account margin (extra space around the image edges) and
 * tile spacing (padding between individual tiles).
 * @returns {number}
 */
export function getTilesetColumns(tileset) {
  // noinspection JSUnresolvedVariable
  const imageWidth = tileset.imageWidth + tileset.tileSpacing - tileset.margin
  const tileWidth = tileset.tileWidth + tileset.tileSpacing
  const calculatedColumnCount = imageWidth / tileWidth
  // Tiled ignores "partial" tiles (extra unaccounted for pixels in the image),
  // so we need to return as Math.floor to avoid throwing off the tile indices.
  return Math.floor(calculatedColumnCount);
}

/**
 * @param {string} str comma separated items
 */
export function splitCommaSeparated(str) {
  if (!str) {
    return undefined;
  }
  return str.split(',').map(s => s.trim());
}

/**
 * Translates key values defining a Godot scene node to the expected TSCN format output.
 * Passed keys must be strings. Values can be arrays (e.g. for groups)
 *
 * @param {object} nodeProperties pair key/values for the "node" properties
 * @param {object} contentProperties pair key/values for the content properties
 * @param {object} metaProperties pair key/values for the meta properties
 * @returns {string} TSCN scene node like so :
 *         ```
 *          [node key="value"]
 *          content_key = AnyValue
            __meta__ = {
            "content_key" : AnyValue
            }
 *         ```
 */
export function stringifyNode(nodeProperties, contentProperties = {}, metaProperties = {}) {
  let str = '\n';
  str += '[node';
  for (const [key, value] of Object.entries(nodeProperties)) {
    if (value !== undefined) {
      str += ' ' + stringifyKeyValue(key, value, false, true, false);
    }
  }
  str += ']\n';
  for (const [key, value] of Object.entries(contentProperties)) {
    if (value !== undefined) {
      str += stringifyKeyValue(key, value, false, false, true) + '\n';
    }
  }
  const mProps = Object.entries(metaProperties);
  if(mProps.length > 0) {
    str += '__meta__ = {\n';
    var count = 0;
    for(const [key, value] of mProps) {
        if (count++ > 0){
            str += ",\n";
        }
        var quoteValue = true;
        if(typeof value === 'number' || typeof value === 'boolean') {
            quoteValue = false;
        }
        str += stringifyKeyValue(key, value, true, quoteValue, true, ":");
    }
    str += '\n}\n';
  }
  return str;
}

/**
 * Processes a key/value pair for a TSCN node
 *
 * @param {string} key
 * @param {string|array} value
 * @param {boolean} quoteKey
 * @param {boolean} quoteValue
 * @param {boolean} spaces
 * @param {string} separator
 */
export function stringifyKeyValue(key, value, quoteKey, quoteValue, spaces, separator = "=") {
  // flatten arrays
  if (Array.isArray(value)) {
    value = '[\n"' + value.join('","') + '",\n]';
  } else if (quoteValue) {
    value = `"${value}"`;
  }
  if(quoteKey) {
    key = `"${key}"`;
  }
  if (!spaces) {
    return `${key}` + separator + `${value}`;
  }
  return `${key} ` + separator + ` ${value}`;
}