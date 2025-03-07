import { NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      );
    }

    const { result } = await ogs({ url });
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      { message: 'Error fetching metadata' },
      { status: 500 }
    );
  }
} 