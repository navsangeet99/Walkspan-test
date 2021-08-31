/**
 * @file db.js
 *
 * Unit tests for src/model/db.js
 */

const expect = require('chai').expect;
const { getClosestSidewalk } = require('../../model/db');

describe('Db', function() {
    describe('#getClosestSidewalk()', () => {
        it('Should get the DB row for the closest sidewalk', () => {
            const {
                natural_beauty_score,
                manmade_beauty_score,
                comfort_score,
                interest_score,
                safety_score,
                access_score,
                amenities_score
            } = getClosestSidewalk(40.730610, -73.935242);
            expect(natural_beauty_score).to.equal(1);
            expect(manmade_beauty_score).to.equal(1);
            expect(comfort_score).to.equal(1);
            expect(interest_score).to.equal(1);
            expect(safety_score).to.equal(3);
            expect(access_score).to.equal(3);
            expect(amenities_score).to.equal(1);
        });
    });
});
