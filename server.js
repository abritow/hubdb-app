require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const PORT = process.env.PORT || 3000;

const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
const hubspotClientSecret = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/', (req, res) => {
  res.send('Home Page');
});

app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', qs.stringify({
      grant_type: 'authorization_code',
      client_id: hubspotClientId,
      client_secret: hubspotClientSecret,
      redirect_uri: REDIRECT_URI,
      code: code
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = response.data;
    res.send(`Access Token: ${access_token}`);
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
    res.status(500).send('Error getting access token');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
