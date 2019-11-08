import fetch from 'node-fetch';
import { activeConfig } from '../config';
const querystring = require('querystring');

const API_KEY = activeConfig.geo.GEO_KEY;

class GeoService {
  async getGeocode(street, city, state, zip) {
    const escapedStreet = querystring.escape(street);
    const escapedCity = querystring.escape(city);
    const escapedState = querystring.escape(state);
    const escapedZip = querystring.escape(zip);
    const query = `street=${escapedStreet}&city=${escapedCity}&state=${escapedState}&postal_code=${escapedZip}&fields=timezone&api_key=${API_KEY}`;
    let jsonData;
    try {
      const res = await fetch(`https://api.geocod.io/v1.3/geocode?${query}`);

      if (res.status != 200) {
        throw new Error('Internal error. Could not fetch geocode');
      }
      jsonData = await res.json();
    } catch (e) {
      console.error('Could not fetch geocode', e);
      throw new Error('Internal error. Could not fetch geocode');
    }
    if (jsonData.results && jsonData.results.length > 0) {
      // always take first result as it has highest accuracy
      const firstRes = jsonData.results[0];
      const { accuracy, accuracy_type, fields } = firstRes;
      // only store the geo code if we are able to find an exact coordinate
      // if (accuracy > 0.5 && (accuracy_type === 'rooftop' || accuracy_type === 'range_interpolation' || accuracy_type === 'point')) {
        const { lat, lng } = firstRes.location;
        return {
          geo: {
            lat,
            lon: lng,
          },
          timezone: {
            name: fields.timezone.name,
            shortName: fields.timezone.abbreviation
          }
        }
      // }
      // console.warn('Found estimate geocode', firstRes);
    }
    throw new Error(`Could not find coordinates for '${street} ${city} ${state}, ${zip}'. Check your address and try again`);
  }
}

let geoService;

export const getGeoService = () => {
  if (geoService) return geoService;
  geoService = new GeoService();
  return geoService;
};