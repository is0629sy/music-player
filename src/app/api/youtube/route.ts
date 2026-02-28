import { NextResponse } from 'next/server';
import { searchYouTubeVideo } from '@/lib/youtube';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const videoId = await searchYouTubeVideo(`${q} official mv`);
        return NextResponse.json({ videoId });
    } catch (error) {
        console.error('YouTube search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
