/**
 * @file overpass.js
 *
 * Helper functions for getting from querying OpenStreetMaps Overpass Turbo API
 * https://www.openstreetmap.org/
 * https://overpass-turbo.eu/
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 */

const util = require('util')

const queryOverpass = util.promisify(require('query-overpass'));
const { getBoundingBoxFromCoordinatesAndRange } = require('./geocoder');

/**
 * Queries overpass Turbo for a specified tag within a coordinate range
 *
 * @param tag The OpenStreetMaps tag to query for
 * @param latitude The latitude of the center point
 * @param longitude The longitude of the center point
 * @param range The range to query within
 * @returns A set of elements tagged within the range
 */
module.exports.queryOverpassForTags = async (tag, latitude, longitude, range) => {
    const { topLat, bottomLat, leftLng, rightLng } = getBoundingBoxFromCoordinatesAndRange(latitude, longitude, range);
    const query = `
      node
        [${tag}]
        (${bottomLat}, ${leftLng}, ${topLat}, ${rightLng});
      out
    `.split(' ').join('').split('\n').join('') + ' 20;'
    return queryOverpass(query);
};
