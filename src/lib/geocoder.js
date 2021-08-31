/**
 * @file geocoder.js
 *
 * Helper functions for geocoding operations
 */

const nominatim = require("nominatim-geocoder");
const { parseAddress } = require("addresser");
const underscore = require("underscore");

const geocoder = new nominatim();

/**
 * Get the current city containing the specified gps coordinates using the Open Street Maps Nominatim API
 * https://www.openstreetmap.org/
 * https://nominatim.org/
 * https://nominatim.org/release-docs/develop/api/Overview/
 *
 * @param latitude the latitude of the current city
 * @param longitude the longitude of the current city
 * @returns The name of the current city if it exists
 */
module.exports.getCityFromGpsCoordinates = async (latitude, longitude) => {
	return await geocoder.reverse({
		lat: latitude,
		lon: longitude
	}).then(reverse => underscore.get(reverse, ['address', 'city']));
};

/**
 * Get a pair of GPS coordinates for an address using the Open Street Maps Nominatim API
 * https://www.openstreetmap.org/
 * https://nominatim.org/
 * https://nominatim.org/release-docs/develop/api/Overview/
 *
 * @param address A street address as a string
 * @returns A pair of GPS coordinates if they exist
 */
module.exports.getGPSCoordinatesFromAddress = async (address) => {
	const { addressLine1, zipCode } = parseAddress(address)
	return await geocoder.search({
		street: addressLine1,
		postalcode: zipCode,
		limit: 1
	}).then(result => {
		const latitude =  underscore.get(result, [0, 'lat']);
		const longitude =  underscore.get(result, [0, 'lon']);
		return {
			latitude,
			longitude
		};
	});
};

/**
 * Get's the coordinates of a bounding box for a pair of GPS coordinates
 *
 * @param latitude The latitude of the center of the box
 * @param longitude The longitude of the center of the box
 * @param range The range of the bounding box
 * @returns An object containing the four coordinates of the bounding box
 */
module.exports.getBoundingBoxFromCoordinatesAndRange = (latitude, longitude, range) => {
	// Bounding box formula from https://stackoverflow.com/questions/33232008/javascript-calcualate-the-geo-coordinate-points-of-four-corners-around-a-cente
	const pDistanceInMeters = range * 1609.344;
	const latRadian = Number(latitude) * Math.PI/180;
	const degLatKm = 110.574235;
	const degLongKm = 110.572833 * Math.cos(latRadian);
	const deltaLat = pDistanceInMeters / 1000.0 / degLatKm;
	const deltaLong = pDistanceInMeters / 1000.0 / degLongKm;

	return {
		topLat: Number(latitude) + deltaLat,
		bottomLat: Number(latitude) - deltaLat,
		leftLng: Number(longitude) - deltaLong,
		rightLng: Number(longitude) + deltaLong
	};
};
