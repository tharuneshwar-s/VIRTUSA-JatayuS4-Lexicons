import { NextRequest, NextResponse } from 'next/server';
import {supabase} from '@/lib/supabase/supabase'

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  try {
    
    // Debug: Check cookies
    // console.log('API: Checking authentication...');
    // console.log('API: Cookies present:', request.cookies.getAll().map(c => c.name));
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // console.log('API: Auth check result:', { user: user?.email, error: authError });
    
    if (authError || !user) {
      // console.log('API: Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // // console.log('API: User authenticated:', user.email);

    const body = await request.json();
    const { provider_id, service_id, rating, reviews } = body;

    // Validate required fields
    if (!provider_id || !service_id || !rating || !reviews) {
      return NextResponse.json(
        { error: 'Missing required fields: provider_id, service_id, rating, reviews' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate review length
    if (reviews.length < 10 || reviews.length > 2000) {
      return NextResponse.json(
        { error: 'Review must be between 10 and 2000 characters' },
        { status: 400 }
      );
    }

    // Insert the review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        provider_id,
        service_id,
        rating,
        reviews: reviews.trim()
      })
      .select(`
        review_id,
        rating,
        reviews,
        created_at,
        users!inner(name, email)
      `)
      .single();

    if (error) {
      // Handle unique constraint violation (user already reviewed this provider/service)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this provider for this service' },
          { status: 409 }
        );
      }
      
      console.error('Error inserting review:', error);
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: data
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
