/**
 * @file db.js
 *
 * Helper functions to interface with the database
 */

const db = require("better-sqlite3")('./database/walkspan.sqlite', {readonly: true});
const db2 = require("sqlite3")('./database/walkability.sqlite', {readonly:true});
const distanceToLineSegment = require("distance-to-line-segment");
const { sortBy } = require("underscore");

const { getBoundingBoxFromCoordinatesAndRange } = require('../lib/geocoder');

/**
 * Gets the closest sidewalk to a pair of GPS coordinates
 *
 * @param latitude The latitude of the point
 * @param longitude The longitude of the point
 * @returns The database entry for the closest sidewalk
 */
module.exports.getClosestSidewalk = (latitude, longitude) => {
    /**
     * Try to approximate the 8 closest sidewalks to the latitude and longitude
     * We can't retrieve 1 here because it's difficult to query for the closest
     * as the GPS coordinates may be within the middle of a sidewalk with the edge
     * of an intersection right next to that point
     */
    const sidewalkCandidates = db.prepare(`
        SELECT
            natural_beauty_score,
            manmade_beauty_score,
            comfort_score,
            interest_score,
            safety_score,
            access_score,
            amenities_score,
            sidewalk_starting_longitude,
            sidewalk_ending_longitude,
            sidewalk_starting_latitude,
            sidewalk_ending_latitude 
        FROM Walkspan
        ORDER BY MIN(
            ABS(sidewalk_starting_latitude - :latitude) + ABS(sidewalk_starting_longitude - :longitude),
            ABS(sidewalk_ending_latitude - :latitude) + ABS(sidewalk_ending_longitude - :longitude)
        ) ASC LIMIT 8;
    `).all({
        latitude: latitude,
        longitude: longitude
    });

    const sidewalkCandidates2 = db2.prepare(`
        SELECT
            total1,
            total2,
            beauty_n,
            beauty_m,
            access,
            interest,
            amenities,
            shape_length,
            start_long,
            end_long,
            start_lat,
            end_lat
        FROM Bronx_Walkability
        ORDER BY MIN(
            ABS(start_lat - :latitude) + ABS(start_long - :longitude),
            ABS(end_lat - :latitude) + ABS(end_long - :longitude)
        ) ASC LIMIT 8;
    `).all({
        latitude: latitude,
        longitude: longitude
    });

    // Get the closest sidewalk of the returned dataset from our query
    return sortBy(sidewalkCandidates, sidewalkCandidate => {
        return distanceToLineSegment(
            sidewalkCandidate.sidewalk_starting_latitude,
            sidewalkCandidate.sidewalk_starting_longitude,
            sidewalkCandidate.sidewalk_ending_latitude,
            sidewalkCandidate.sidewalk_ending_longitude,
            latitude,
            longitude);
    })[0];

    return sortBy2(sidewalkCandidates2, sidewalkCandidate2 => {
        return distanceToLineSegment2(
            sidewalkCandidate2.start_lat,
            sidewalkCandidate2.start_long,
            sidewalkCandidate2.end_lat,
            sidewalkCandidate2.end_long,
            latitude,
            longitude);
    })[0];
};

/**
 * Get all sidewalks within a radius of gps coordinates
 *
 * @param latitude The latitude of the point
 * @param longitude The longitude of the point
 * @param range The range we want all sidewalks within
 * @returns The set of all sidewalks within the query
 */
module.exports.getSidewalksInRadius = (latitude, longitude, range) => {

    // Get's the bounding box for the inputs
    const { topLat, bottomLat, leftLng, rightLng } = getBoundingBoxFromCoordinatesAndRange(latitude, longitude, range);

    // Query for all sidewalks within the bounding box
    return db.prepare(`
        SELECT
            natural_beauty_score,
            manmade_beauty_score,
            comfort_score,
            interest_score,
            safety_score,
            access_score,
            amenities_score,
            sidewalk_starting_longitude,
            sidewalk_ending_longitude,
            sidewalk_starting_latitude,
            sidewalk_ending_latitude 
        FROM Walkspan
        WHERE (
            :bottomLat <= sidewalk_starting_latitude AND sidewalk_starting_latitude <= :topLat AND
            :leftLng <= sidewalk_starting_longitude AND sidewalk_starting_longitude <= :rightLng
        ) OR (
            :bottomLat <= sidewalk_ending_latitude AND sidewalk_ending_latitude <= :topLat AND
            :leftLng <= sidewalk_ending_longitude AND sidewalk_ending_longitude <= :rightLng
        );
    `).all({
        topLat,
        bottomLat,
        leftLng,
        rightLng
    });

    return db2.prepare(`
        SELECT
           total1,
            total2,
            beauty_n,
            beauty_m,
            access,
            interest,
            amenities,
            shape_length,
            start_long,
            end_long,
            start_lat,
            end_lat
        FROM Bronx_Walkability
        WHERE (
            :bottomLat <= start_lat AND start_lat <= :topLat AND
            :leftLng <= start_long AND start_long <= :rightLng
        ) OR (
            :bottomLat <= end_lat AND end_lat <= :topLat AND
            :leftLng <= end_long AND end_long <= :rightLng
        );
    `).all({
        topLat,
        bottomLat,
        leftLng,
        rightLng
    });

}
