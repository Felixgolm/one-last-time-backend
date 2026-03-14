const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

router.get('/restaurants', async (req, res) => {
  try {
    const { query, type, city } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    if (type === 'cities') {
      const isPostalCode = /^\d{3,}$/.test(query.trim());

      if (isPostalCode) {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: query,
            components: 'country:ES',
            language: 'es',
            key: GOOGLE_API_KEY
          }
        });

        const results = response.data.results
          .slice(0, 5)
          .map(result => {
            const cityComponent = result.address_components.find(c => c.types.includes('locality'));
            const postalComponent = result.address_components.find(c => c.types.includes('postal_code'));
            const provinceComponent = result.address_components.find(c => c.types.includes('administrative_area_level_2'));
            const cityName = cityComponent ? cityComponent.long_name : '';
            const postalCode = postalComponent ? postalComponent.long_name : query;
            const province = provinceComponent ? provinceComponent.long_name : '';

            return {
              name: cityName,
              province: province,
              postalCode: postalCode,
              displayName: `${cityName} (${postalCode})`,
              fullName: result.formatted_address,
              placeId: result.place_id
            };
          });

        return res.status(200).json({
          success: true,
          data: results
        });
      } else {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
          params: {
            input: query,
            components: 'country:es',
            types: '(regions)',
            language: 'es',
            key: GOOGLE_API_KEY
          }
        });

        const results = response.data.predictions
          .slice(0, 10)
          .map(place => {
            const parts = place.description.split(', ');
            const city = parts[0];
            const province = parts.length > 2 ? parts[1] : '';
            return {
              name: city,
              province: province,
              postalCode: null,
              displayName: city,
              fullName: place.description,
              placeId: place.place_id
            };
          });

        return res.status(200).json({
          success: true,
          data: results
        });
      }
    } else if (type === 'restaurants') {
      const searchCity = city || query;
      const searchQuery = city ? `${query} restaurant ${city}` : `restaurants in ${query} Spain`;

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: searchQuery,
          language: 'es',
          region: 'es',
          key: GOOGLE_API_KEY
        }
      });

      const results = response.data.results
        .slice(0, 10)
        .map(place => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 'N/A',
          placeId: place.place_id
        }));

      return res.status(200).json({
        success: true,
        data: results
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Error fetching data from Google Places API',
      details: error.message
    });
  }
});

module.exports = router;
