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
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
        params: {
          input: query,
          components: 'country:es',
          types: '(cities)',
          language: 'es',
          key: GOOGLE_API_KEY
        }
      });

      const results = response.data.predictions
        .slice(0, 10)
        .map(place => {
          const terms = place.terms || [];
          const city = terms[0] ? terms[0].value : place.description.split(',')[0].trim();
          const province = terms.length > 2 ? terms[1].value : '';
          return {
            name: city,
            province: province,
            fullName: place.description,
            placeId: place.place_id
          };
        });

      return res.status(200).json({
        success: true,
        data: results
      });
    } else if (type === 'restaurants') {
      const searchCity = city || '';
      const searchQuery = searchCity ? `${query} restaurante en ${searchCity}` : `restaurante ${query}`;

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: searchQuery,
          type: 'restaurant',
          language: 'es',
          region: 'es',
          key: GOOGLE_API_KEY
        }
      });

      const cityLower = searchCity.toLowerCase();
      const filtered = searchCity
        ? response.data.results.filter(place => place.formatted_address.toLowerCase().includes(cityLower))
        : response.data.results;

      const results = filtered
        .slice(0, 10)
        .map(place => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || null,
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
