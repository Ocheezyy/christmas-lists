import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChristmasListBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();

    // Extract metadata using Open Graph tags and fallbacks
    const getMetaContent = (property: string): string | null => {
      // Try Open Graph tags first
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
      if (ogMatch) return ogMatch[1];

      // Try name attribute
      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
      if (nameMatch) return nameMatch[1];

      // Try reversed attribute order
      const contentMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
      if (contentMatch) return contentMatch[1];

      return null;
    };

    // Extract title
    let title = getMetaContent('og:title') || getMetaContent('twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1] : '';
    }

    // Extract description
    let description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description');
    if (!description) {
      description = '';
    }

    // Extract image
    let image = getMetaContent('og:image') || getMetaContent('twitter:image');
    
    // Make relative URLs absolute
    if (image && !image.startsWith('http')) {
      image = new URL(image, validUrl.origin).toString();
    }

    // Clean up HTML entities and trim
    const decodeHtml = (str: string) => {
      return str
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
        .trim();
    };

    title = decodeHtml(title);
    description = decodeHtml(description);

    // Truncate if too long
    if (title.length > 200) {
      title = title.substring(0, 197) + '...';
    }
    if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }

    return NextResponse.json({
      title: title || 'No title found',
      description: description || 'No description found',
      image: image || null,
    });
  } catch (error) {
    console.error('Failed to fetch URL preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URL preview' },
      { status: 500 }
    );
  }
}
