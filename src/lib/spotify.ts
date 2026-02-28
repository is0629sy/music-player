import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export const getSpotifyToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const token = data.body['access_token'];
    spotifyApi.setAccessToken(token);
    return token;
  } catch (error) {
    console.error('Error retrieving Spotify token:', error);
    throw error;
  }
};

export default spotifyApi;
