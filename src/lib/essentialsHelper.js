/**
 * @file essentialsHelper.js
 *
 * Helper functions for retrieving lifestyle essentials
 */

const { queryOverpassForTags } = require('./overpass')

/**
 * Get's a set of lifestyle essentials using the Open StreetMaps Overpass API
 * https://www.openstreetmap.org/
 * https://overpass-turbo.eu/
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 *
 * @param latitude The latitude you would like to retrieve the lifestyle essentials for
 * @param longitude The longitude you would like to retrieve the lifestyle essentials for
 * @param range The range you would like to retrieve the lifestyle essentials for
 * @returns A set of lifestyle essentials
 */
module.exports.getLifestyleEssentials = (latitude, longitude, range) => {

    // Gets from overpass all lifestyle essentials with the tag 'amenity=restaurant'
    const resturants = queryOverpassForTags('amenity=restaurant', latitude, longitude, range)
      .then(response => { return response.features }).then(features => {
        return features.map(feature => {
          const properties = feature.properties;
          const coordinates = feature.geometry.coordinates;
          return {
            "name": properties.tags.name,
             "latitude": coordinates[1],
             "longitude": coordinates[0],
             "category_general": "food"
          };
        });
      });

    // Gets from overpass all lifestyle essentials with the tag 'public_transport'
    const publicTransit = queryOverpassForTags('public_transport', latitude, longitude, range)
        .then(response => { return response.features })
        .then(features => {
            return features.map(feature => {
                const properties = feature.properties;
                const coordinates = feature.geometry.coordinates;
                return {
                    "name": properties.tags.name,
                    "latitude": coordinates[1],
                    "longitude": coordinates[0],
                    "category_general": "public transit"
                };
            });
        });

    // Gets from overpass all lifestyle essentials with the tag 'tourism'
    const interest = queryOverpassForTags('tourism', latitude, longitude, range)
        .then(response => { return response.features })
        .then(features => {
            return features.map(feature => {
                const properties = feature.properties;
                const coordinates = feature.geometry.coordinates;
                return {
                    "name": properties.tags.name,
                    "latitude": coordinates[1],
                    "longitude": coordinates[0],
                    "category_general": "interest"
                };
            });
        });

    // Get's from overpass all lifestyle essentials with the tag 'leisure'
    const comfort = queryOverpassForTags('leisure', latitude, longitude, range)
        .then(response => { return response.features })
        .then(features => {
            return features.map(feature => {
                const properties = feature.properties;
                const coordinates = feature.geometry.coordinates;
                return {
                    "name": properties.tags.name,
                    "latitude": coordinates[1],
                    "longitude": coordinates[0],
                    "category_general": "comfort"
                };
            });
        });

    // Combines all the retrieved lifestyle essentials into a single set
    return Promise.all([
      resturants,
      publicTransit,
      interest,
      comfort
    ]).then(fetchedEssentials => {
      return fetchedEssentials.reduce((prev, next) => {
        return prev.concat(next);
      })
    });
};
