import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // X (Twitter) OEmbed API
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&lang=ja`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch tweet preview' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API /tweet-preview error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
