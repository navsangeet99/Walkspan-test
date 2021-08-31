/**
 * @file essentials.js
 *
 * API endpoints for lifestyle essentials
 * All of these endpoints are covered under '/essentials'
 */
const router = require("express").Router();
const { query, validationResult } = require("express-validator");

const { getLifestyleEssentials } = require('../lib/essentialsHelper');
const { getCityFromGpsCoordinates, getGPSCoordinatesFromAddress } = require('../lib/geocoder');
const { generateEssentialsWidget } = require('../lib/handlebarsHelper');
const validCityList = require('../lib/valid-city-list');

/**
 * @openapi
 * /essentials/gps:
 *   get:
 *     tags:
 *       - essentials_api
 *     summary: Get lifestyle essentials from GPS coordinates
 *     operationId: getEssentialsGps
 *     security:
 *       - ApiKeyAuth: [read]
 *     parameters:
 *       - name: displayWidget
 *         in: query
 *         description: If you would like the data instead represented as an html widget
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: latitude
 *         in: query
 *         description: The latitude you would like to get the lifestyle essentials around
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           default: 40.7127837
 *       - name: longitude
 *         in: query
 *         description: The longitude you would like to get the lifestyle essentials around
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           default: -74.0059413
 *       - name: range
 *         in: query
 *         description: The range you would like to get the lifestyle essentials around in miles
 *         required: true
 *         schema:
 *           type: number
 *           enum: [0.25, 0.5, 1]
 *           default: 1
 *     x-code-samples:
 *       - lang: curl
 *         source: |-
 *           YOUR_API_KEY='aaaBBBBB111cccccDDDDD' \
 *           ADDRESS_LATITUDE='40.71427' \
 *           ADDRESS_LONGITUDE='-74.00597' \
 *           ADDRESS_RANGE='1' \
 *           curl -H "X-API-Key: ${YOUR_API_KEY}" \
 *           "https://api.walkspan.com/essentials/gps?latitude=${ADDRESS_LATITUDE}&longitude=${ADDRESS_LONGITUDE}&range=${ADDRESS_RANGE}"
 *     responses:
 *       200:
 *         description: A set lifestyle essentials over a range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/EssentialsModel"
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
    query('range', 'Must be 0.25, 0.5 or 1 miles').isIn([0.25, 0.5, 1]),
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
        const { latitude, longitude, range, displayWidget: displayWidgetString } = request.query;
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

        // Gets lifestyle essentials for the coordinates
        const lifestyleEssentials = await getLifestyleEssentials(latitude, longitude, range*1.5);


        if (displayWidget) {
            // If display widget was set to true, return the widget's HTML
            return response.status(200).send(generateEssentialsWidget(
                latitude,
                longitude,
                range,
                lifestyleEssentials));
        } else {
            // Else return the lifestyle essentials JSON
            return response.status(200).json(lifestyleEssentials);
        }
    });

/**
 * @openapi
 * /essentials/address:
 *   get:
 *     tags:
 *       - essentials_api
 *     summary: Get lifestyle essentials from a street address
 *     operationId: getEssentialsAddress
 *     security:
 *       - ApiKeyAuth: [read]
 *     parameters:
 *       - name: displayWidget
 *         in: query
 *         description: If you would like the data instead represented as an html widget
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: q
 *         in: query
 *         description: The street address you would like to get the lifestyle essentials for
 *         required: true
 *         schema:
 *           type: string
 *       - name: range
 *         in: query
 *         description: The range you would like to get the lifestyle essentials around in miles
 *         required: true
 *         schema:
 *           type: number
 *           enum: [0.25, 0.5, 1]
 *           default: 1
 *     x-code-samples:
 *       - lang: curl
 *         source: |-
 *           YOUR_API_KEY='aaaBBBBB111cccccDDDDD' \
 *           YOUR_STREET_ADDRESS='Times%20Square,%20New%20York,%20NY%2010036' \
 *           ADDRESS_RANGE='1' \
 *           curl -H "X-API-Key: ${YOUR_API_KEY}" \
 *           "https://api.walkspan.com/essentials/address?q=${YOUR_STREET_ADDRESS}&range=${ADDRESS_RANGE}"
 *     responses:
 *       200:
 *         description: A set lifestyle essentials over a range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/EssentialsModel"
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
    query('range', 'Must be 0.25, 0.5, or 1 miles').isIn([0.25, 0.5, 1]),
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
        const { q: address, range, displayWidget: displayWidgetString } = request.query;
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

        // Gets lifestyle essentials for the coordinates
        const lifestyleEssentials = await getLifestyleEssentials(latitude, longitude, range*1.5);

        if (displayWidget) {
            // If display widget was set to true, return the widget's HTML
            return response.status(200).send(generateEssentialsWidget(
                latitude,
                longitude,
                range,
                lifestyleEssentials));
        } else {
            // Else return the lifestyle essentials JSON
            return response.status(200).json(lifestyleEssentials);
        }
    });

router.get("/marker-icon.png",
    async (request, response) => {
        // Get's a pin icon for the widget to properly render
        return response.status(301).redirect('https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png');
});

module.exports = router;
