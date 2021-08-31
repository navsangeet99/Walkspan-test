/**
 * @file handlebarsHelper.js
 *
 * Helper functions utilizing the handlebarsjs library to generate walkspan's widgets
 * https://handlebarsjs.com/
 */
const { readFileSync } = require('fs');
const { compile } = require('handlebars');

const { getBoundingBoxFromCoordinatesAndRange } = require('./geocoder');

/**
 * Generates the Lifestyle Essentials widget
 *
 * @param latitude the latitude for the center point of the lifestyle essentials map
 * @param longitude the longitude for the center point of the lifestyle essentials map
 * @param range the coordinate range displayed in the lifestyle essentials map
 * @param essentialsList the list of pre-generated lifestyle essentials
 * @returns The HTML source code for the lifestyle essentials widget
 */
module.exports.generateEssentialsWidget = (latitude, longitude, range, essentialsList) => {

    const {topLat, bottomLat, leftLng, rightLng} = getBoundingBoxFromCoordinatesAndRange(latitude, longitude, range);

    const essentialsTemplate = compile(readFileSync(
        './src/templates/handlebars/essentials.handlebars',
        'utf8'));
    const categories = new Set(essentialsList.map((lifestyleEssential) => lifestyleEssential.category_general));
    return essentialsTemplate({
        topLat,
        bottomLat,
        leftLng,
        rightLng,
        categories,
        essentialsList
    }).split('``').join("''").split(`.bindPopup('\\')`).join('')
};

/**
 * Generates the score widget
 *
 * @param latitude the latitude for the center point of the score map
 * @param longitude the longitude for the center point of the score map
 * @param closestSidewalk the closest sidewalk
 * @param sidewalksInRadius the list of sidewalks within the radius
 * @returns The HTML source code for the score widget
 */
module.exports.generateScoreWidget = (latitude,
                                      longitude,
                                      closestSidewalk,
                                      sidewalksInRadius,
                                      range) => {

    const {topLat, bottomLat, leftLng, rightLng} = getBoundingBoxFromCoordinatesAndRange(latitude, longitude, range);

    const scoreTemplate = compile(readFileSync(
        './src/templates/handlebars/score.handlebars',
        'utf8'));
    return scoreTemplate({
        topLat,
        bottomLat,
        leftLng,
        rightLng,
        latitude,
        longitude,
        closestSidewalk,
        sidewalksInRadius
    });
};
