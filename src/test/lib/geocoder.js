/**
 * @file geocoder.js
 *
 * Unit tests for src/lib/geocoder.js
 */

const expect = require('chai').expect;
const { getCityFromGpsCoordinates, getGPSCoordinatesFromAddress } = require('../../lib/geocoder');

describe('Geocoder', function() {
    describe('#getCityFromGpsCoordinates()', () => {
        it('Should get a valid city from gps coordinates', async () => {
            const city = await getCityFromGpsCoordinates(40.730610, -73.935242);
            expect(city).to.equal('New York');
        });

        it('Should get nothing from invalid gps coordinates', async () => {
            const city = await getCityFromGpsCoordinates(0, 0);
            expect(city).to.be.undefined;
        });
    });

    describe('#getGPSCoordinatesFromAddress()', () => {
        it('Should get a valid gps coordinates from an address', async () => {
            const { latitude, longitude } = await getGPSCoordinatesFromAddress('555 Hudson Street, New York, NY 10014');
            expect(latitude).to.equal('40.7353526');
            expect(longitude).to.equal('-74.0062303');
        });

        it('Should get undefined coordinates for an invalid address', async () => {
            const { latitude, longitude } = await getGPSCoordinatesFromAddress('Some Fake Place, New York, NY 00000');
            expect(latitude).to.be.undefined;
            expect(longitude).to.be.undefined;
        });
    });
});
