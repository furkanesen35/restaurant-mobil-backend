const axios = require('axios');
const logger = require('../utils/logger');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Calculate route and ETA between driver location and destination
   * @param {number} originLat - Driver's latitude
   * @param {number} originLng - Driver's longitude
   * @param {number} destLat - Destination latitude
   * @param {number} destLng - Destination longitude
   * @returns {Promise<Object>} Route information including distance, duration, and polyline
   */
  async getDirections(originLat, originLng, destLat, destLng) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${originLat},${originLng}`,
          destination: `${destLat},${destLng}`,
          mode: 'driving',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Directions API error:', response.data.status, response.data.error_message);
        throw new Error(`Google Directions API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        distanceMeters: leg.distance.value,
        distanceText: leg.distance.text,
        durationSeconds: leg.duration.value,
        durationText: leg.duration.text,
        polyline: route.overview_polyline.points, // Encoded polyline for map display
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions,
          distance: step.distance.text,
          duration: step.duration.text
        }))
      };
    } catch (error) {
      logger.error('Failed to get directions:', error.message);
      throw error;
    }
  }

  /**
   * Get distance and duration matrix between origin and destination
   * More efficient than Directions API when you only need distance/duration
   * @param {number} originLat - Origin latitude
   * @param {number} originLng - Origin longitude
   * @param {number} destLat - Destination latitude
   * @param {number} destLng - Destination longitude
   * @returns {Promise<Object>} Distance and duration information with ETA
   */
  async getDistanceMatrix(originLat, originLng, destLat, destLng) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          mode: 'driving',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Distance Matrix API error:', response.data.status, response.data.error_message);
        throw new Error(`Google Distance Matrix API error: ${response.data.status}`);
      }

      const element = response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Route calculation failed: ${element.status}`);
      }

      return {
        distanceMeters: element.distance.value,
        distanceText: element.distance.text,
        durationSeconds: element.duration.value,
        durationText: element.duration.text,
        eta: new Date(Date.now() + element.duration.value * 1000)
      };
    } catch (error) {
      logger.error('Failed to get distance matrix:', error.message);
      throw error;
    }
  }

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Full address string
   * @returns {Promise<Object>} Coordinates and formatted address
   */
  async geocodeAddress(address) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Geocoding API error:', response.data.status, response.data.error_message);
        throw new Error(`Google Geocoding API error: ${response.data.status}`);
      }

      const location = response.data.results[0].geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: response.data.results[0].formatted_address
      };
    } catch (error) {
      logger.error('Failed to geocode address:', error.message);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<Object>} Address information
   */
  async reverseGeocode(latitude, longitude) {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        logger.error('Google Reverse Geocoding API error:', response.data.status, response.data.error_message);
        throw new Error(`Google Reverse Geocoding API error: ${response.data.status}`);
      }

      const result = response.data.results[0];

      return {
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components
      };
    } catch (error) {
      logger.error('Failed to reverse geocode:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleMapsService();
