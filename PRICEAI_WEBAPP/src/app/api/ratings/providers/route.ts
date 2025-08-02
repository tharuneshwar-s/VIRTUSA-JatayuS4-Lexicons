import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerIds = searchParams.get('providerIds')?.split(',');

    if (!providerIds || providerIds.length === 0) {
      return NextResponse.json({ error: 'Provider IDs are required' }, { status: 400 });
    }

    // Fetch ratings from the Python FastAPI endpoint for each provider
    const ratingPromises = providerIds.map(async (providerId) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_REST_API_URL}${process.env.NEXT_PUBLIC_REST_API_PREFIX}/${process.env.NEXT_PUBLIC_REST_API_VERSION}/reviews/stats/provider/${providerId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return {
            providerId: parseInt(providerId),
            averageRating: data.average_rating || 0,
            totalReviews: data.total_reviews || 0
          };
        } else {
          return {
            providerId: parseInt(providerId),
            averageRating: 0,
            totalReviews: 0
          };
        }
      } catch (error) {
        console.error(`Error fetching rating for provider ${providerId}:`, error);
        return {
          providerId: parseInt(providerId),
          averageRating: 0,
          totalReviews: 0
        };
      }
    });

    const ratingStats = await Promise.all(ratingPromises);

    return NextResponse.json({ ratings: ratingStats });
  } catch (error) {
    console.error('Error in ratings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
