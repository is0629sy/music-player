import { NextResponse } from 'next/server';
import spotifyApi, { getSpotifyToken } from '@/lib/spotify';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        await getSpotifyToken();
        const data = await spotifyApi.searchTracks(q, { limit: 10 });
        const tracks = data.body.tracks?.items.map((item) => ({
            id: item.id,
            title: item.name,
            artist: item.artists.map((a) => a.name).join(', '),
            artworkUrl: item.album.images[0]?.url || '',
        })) || [];

        return NextResponse.json({ tracks });
    } catch (error) {
        console.error('Spotify search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
