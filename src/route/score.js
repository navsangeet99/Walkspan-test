/**
 * @file score.js
 *
 * API endpoints for the Walkspan score
 * All of these endpoints are covered under '/score'
 */
const router = require("express").Router();
const { query, validationResult } = require("express-validator");

const { getClosestSidewalk, getSidewalksInRadius } = require('../model/db');
const { getCityFromGpsCoordinates, getGPSCoordinatesFromAddress } = require('../lib/geocoder');
const { generateScoreWidget } = require('../lib/handlebarsHelper');
const validCityList = require('../lib/valid-city-list');

/**
 * @openapi
 * /score/gps:
 *   get:
 *     tags:
 *       - score_api
 *     summary: Get score from GPS coordinates
 *     operationId: getScoreGps
 *     security:
 *       - ApiKeyAuth: [read]
 *     parameters:
 *       - name: range
 *         in: query
 *         description: The range you would like to get the score for
 *         required: false
 *         schema:
 *           type: number
 *           enum: [0.25, 0.5, 1]
 *           default: 1
 *       - name: displayWidget
 *         in: query
 *         description: If you would like the data instead represented as an html widget
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: latitude
 *         in: query
 *         description: The latitude you would like to get the score for
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           default: 40.7127837
 *       - name: longitude
 *         in: query
 *         description: The longitude you would like to get the score for
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           default: -74.0059413
 *     x-code-samples:
 *       - lang: curl
 *         source: |-
 *           YOUR_API_KEY='aaaBBBBB111cccccDDDDD' \
 *           ADDRESS_LATITUDE='40.71427' \
 *           ADDRESS_LONGITUDE='-74.00597' \
 *           curl -H "X-API-Key: ${YOUR_API_KEY}" \
 *           "https://api.walkspan.com/score/gps?latitude=${ADDRESS_LATITUDE}&longitude=${ADDRESS_LONGITUDE}"
 *     responses:
 *       200:
 *         description: A set of scores describing a sidewalk
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ScoreModel"
 *           text/html:
 *             schema:
 *               type: string
 *       default:
 *         description: unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get("/gps",
    query('latitude', 'Must be between -90 and 90').isFloat({min:-90,max:90}),
    query('longitude', 'Must be between -180 and 180').isFloat({min:-180,max:180}),
    query('displayWidget', "Must be true, false or null").optional({ nullable: true }).isBoolean(),
    query('range', 'Must be 0.25, 0.5 or 1 miles').optional({ nullable: true }).isIn([0.25, 0.5, 1]),
    async (request, response) => {
        // Validates API input
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({
                errors: errors.array(),
            });
        }

        // Parses query params for endpoint
        const { latitude, longitude, displayWidget: displayWidgetString  } = request.query;
        const range = request.query.range || 0.35;
        const displayWidget = displayWidgetString === 'true';

        // Checks if the current city is within Walkspan's allowlist
        const city = await getCityFromGpsCoordinates(latitude, longitude);
        const isValidCity = validCityList.includes(city);

        if (!isValidCity) {
            return response.status(400).json({
                errors: [
                    {
                        msg: `Must be in one of the following cities: ${validCityList.join(', ')}`,
                        param: [
                            'latitude',
                            'longitude'
                        ],
                        location: 'query'
                    }
                ]
            });
        }


        if (displayWidget) {
            // If display widget was set to true, get multiple sidewalks and generate the widget using those
            const sidewalksInRadius = getSidewalksInRadius(latitude, longitude, range);
            const closestSidewalk = getClosestSidewalk(latitude, longitude);
            return response.status(200).send(generateScoreWidget(
                latitude,
                longitude,
                closestSidewalk,
                sidewalksInRadius,
                range
            ));
        } else {
            // Else only get the database entry for the closest sidewalk
            const {
                natural_beauty_score,
                manmade_beauty_score,
                comfort_score,
                interest_score,
                safety_score,
                access_score,
                amenities_score
            } = getClosestSidewalk(latitude, longitude);

            return response.status(200).json({
                natural_beauty_score,
                manmade_beauty_score,
                comfort_score,
                interest_score,
                safety_score,
                access_score,
                amenities_score,
                latitude,
                longitude
            });
        }
    });

/**
 * @openapi
 * /score/address:
 *   get:
 *     tags:
 *       - score_api
 *     summary: Get score from a street address
 *     operationId: getScoreAddress
 *     security:
 *       - ApiKeyAuth: [read]
 *     parameters:
 *       - name: range
 *         in: query
 *         description: The range you would like to get the score for
 *         required: false
 *         schema:
 *           type: number
 *           enum: [0.25, 0.5, 1]
 *           default: 1
 *       - name: displayWidget
 *         in: query
 *         description: If you would like the data instead represented as an html widget
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: q
 *         in: query
 *         description: The street address you would like to get the score for
 *         required: true
 *         schema:
 *           type: string
 *     x-code-samples:
 *       - lang: curl
 *         source: |-
 *           YOUR_API_KEY='aaaBBBBB111cccccDDDDD' \
 *           YOUR_STREET_ADDRESS='Times%20Square,%20New%20York,%20NY%2010036' \
 *           curl -H "X-API-Key: ${YOUR_API_KEY}" \
 *           "https://api.walkspan.com/score/address?q=${YOUR_STREET_ADDRESS}"
 *     responses:
 *       200:
 *         description: A set of scores describing a sidewalk
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ScoreModel"
 *           text/html:
 *             schema:
 *               type: string
 *       default:
 *         description: unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
router.get("/address",
    query('q', 'Must supply a valid address string').isString(),
    query('range', 'Must be 0.25, 0.5 or 1 miles').optional({ nullable: true }).isIn([0.25, 0.5, 1]),
    query('displayWidget', "Must be true, false or null").optional({ nullable: true }).isBoolean(),
    async (request, response) => {
        // Validates API input
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({
                errors: errors.array(),
            });
        }

        // Parses query params for endpoint
        const { q: address, displayWidget: displayWidgetString } = request.query;
        const range = request.query.range || 0.35;
        const displayWidget = displayWidgetString === 'true';

        // Validates address entered and gets associated GPS coordinates
        let coordinates;
        try {
            coordinates = await getGPSCoordinatesFromAddress(address);
        } catch (error) {
            return response.status(400).json({
                errors: [{
                    msg: error,
                    param: 'q',
                    location: 'query'
                }]
            });
        }
        const {latitude, longitude} = coordinates;

        if (!latitude || !longitude) {
            return response.status(400).json({
                errors: [{
                    msg: "Invalid address supplied",
                    param: 'q',
                    location: 'query'
                }]
            });
        }

        // Checks if the current city is within Walkspan's allowlist
        const city = await getCityFromGpsCoordinates(latitude, longitude);
        const isValidCity = validCityList.includes(city);

        if (!isValidCity) {
            return response.status(400).json({
                errors: [
                    {
                        msg: `Must be in one of the following cities: ${validCityList.join(', ')}`,
                        param: [
                            'latitude',
                            'longitude'
                        ],
                        location: 'query'
                    }
                ]
            });
        }

        if (displayWidget) {
            // If display widget was set to true, get multiple sidewalks and generate the widget using those
            const sidewalksInRadius = getSidewalksInRadius(latitude, longitude, range);
            const closestSidewalk = getClosestSidewalk(latitude, longitude);
            return response.status(200).send(generateScoreWidget(
                latitude,
                longitude,
                closestSidewalk,
                sidewalksInRadius,
                range
            ));
        } else {
            // Else only get the database entry for the closest sidewalk
            const {
                natural_beauty_score,
                manmade_beauty_score,
                comfort_score,
                interest_score,
                safety_score,
                access_score,
                amenities_score
            } = getClosestSidewalk(latitude, longitude);

            return response.status(200).json({
                natural_beauty_score,
                manmade_beauty_score,
                comfort_score,
                interest_score,
                safety_score,
                access_score,
                amenities_score,
                latitude,
                longitude
            });
        }
    });

module.exports = router;
