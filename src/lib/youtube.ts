import { google } from 'googleapis';

export const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

export const searchYouTubeVideo = async (query: string) => {
    try {
        const response = await youtube.search.list({
            part: ['snippet'],
            q: query,
            type: ['video'],
            maxResults: 1,
            videoCategoryId: '10', // Music category
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id?.videoId;
        }
        return null;
    } catch (error) {
        console.error('Error searching YouTube video:', error);
        throw error;
    }
};
