'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { Review, ReviewStatistics, ReviewsResponse, SubmitReviewRequest } from '@/types/ReviewTypes';
import {
  Star,
  X,
  User,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Award,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProviderRatingProps {
  provider: any;
  service: any;
}

export default function ProviderRating({
  provider,
  service
}: ProviderRatingProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'rate'>('reviews');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  
  // Real data state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const {user} = useAuth();

  const supabase = createClient();

  // Fetch reviews and check authentication
  useEffect(() => {
    fetchReviews();
    checkAuthentication();
  }, [provider?.provider_id, service?.service_id, user]); // Added user dependency

  // Re-check authentication when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          checkAuthentication();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [provider?.provider_id, service?.service_id]);

  const checkAuthentication = async () => {
    try {
      if (user && provider?.provider_id && service?.service_id) {
        // Check if user has already reviewed this provider/service
        const { data: existingReviews, error: reviewError } = await supabase
          .from('reviews')
          .select('review_id')
          .eq('user_id', user.id)
          .eq('provider_id', provider.provider_id)
          .eq('service_id', service.service_id);
        
        // // console.log('Existing review check:', existingReviews, reviewError); // Debug log
        // User has reviewed if we found any reviews (array length > 0)
        setHasUserReviewed(!reviewError && existingReviews && existingReviews.length > 0);
      } else {
        setHasUserReviewed(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setHasUserReviewed(false);
    }
  };

  // Fetch reviews from the Python FastAPI endpoint
  const fetchReviews = async () => {
    if (!provider?.provider_id || !service?.service_id) return;
    
    setLoading(true);
    try {
      // Fetch reviews for this provider and service
      const reviewsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_URL}${process.env.NEXT_PUBLIC_REST_API_PREFIX}/${process.env.NEXT_PUBLIC_REST_API_VERSION}/reviews/provider/${provider.provider_id}/service/${service.service_id}?limit=100`
      );
      
      // Fetch statistics for this provider and service
      const statsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_REST_API_URL}${process.env.NEXT_PUBLIC_REST_API_PREFIX}/${process.env.NEXT_PUBLIC_REST_API_VERSION}/reviews/stats/provider/${provider.provider_id}?service_id=${service.service_id}`
      );
      
      if (reviewsResponse.ok && statsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const statsData = await statsResponse.json();
        
        // Transform reviews data to match the expected format
        const transformedReviews = reviewsData.map((review: any) => ({
          id: review.review_id,
          user: `User ${review.user_id.slice(-4)}`, // Show last 4 chars of user ID for privacy
          rating: review.rating,
          review: review.review_text,
          date: review.created_at,
          provider: review.provider_name,
          service: review.service_name
        }));
        
        // Transform statistics data
        const transformedStats = {
          totalReviews: statsData.total_reviews,
          averageRating: statsData.average_rating,
          ratingDistribution: {
            5: parseInt(statsData.rating_distribution["5"]),
            4: parseInt(statsData.rating_distribution["4"]),
            3: parseInt(statsData.rating_distribution["3"]),
            2: parseInt(statsData.rating_distribution["2"]),
            1: parseInt(statsData.rating_distribution["1"])
          }
        };
        
        setReviews(transformedReviews);
        setStatistics(transformedStats);
      } else {
        console.error('Failed to fetch reviews or statistics');
        setReviews([]);
        setStatistics({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setStatistics({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (review.trim().length < 10) {
      alert('Please provide a detailed review (at least 10 characters)');
      return;
    }

    if (review.trim().length > 2000) {
      alert('Review must be less than 2000 characters');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData: SubmitReviewRequest = {
        provider_id: provider.provider_id,
        service_id: service.service_id,
        rating,
        reviews: review.trim()
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are sent with the request
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Thank you for your review! It has been submitted successfully.');
        setRating(0);
        setReview('');
        setActiveTab('reviews');
        setHasUserReviewed(true);
        // Refresh reviews
        await fetchReviews();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, size = 16, interactive = false, onRate }: any) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${star <= (interactive ? (hoveredStar || rating) : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
              } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="shadow-none p-0 mb-20">

      {/* Provider Summary */}
      <div className="bg-priceai-lightgray/30 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-priceai-dark text-lg">{provider?.providerName}</h3>
            <p className="text-sm text-priceai-gray">{provider?.providerAddress}</p>
            <Badge className="text-xs text-white mt-2">{service?.serviceName}</Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={statistics.averageRating} size={20} />
              <span className="text-xl font-bold text-priceai-dark">
                {statistics.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-priceai-gray">{statistics.totalReviews} reviews</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-priceai-lightgray/50 mb-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'reviews'
              ? 'border-priceai-blue text-priceai-blue'
              : 'border-transparent text-priceai-gray hover:text-priceai-dark'
            }`}
        >
          Reviews ({statistics.totalReviews})
        </button>
        <button
          onClick={() => setActiveTab('rate')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'rate'
              ? 'border-priceai-blue text-priceai-blue'
              : 'border-transparent text-priceai-gray hover:text-priceai-dark'
            } ${(!user || hasUserReviewed) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!user || hasUserReviewed}
        >
          {!user ? 'Login to Review' : hasUserReviewed ? 'Already Reviewed' : 'Write Review'}
        </button>
       
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-8">
              {/* Main Loading Indicator */}
              <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-priceai-lightgray/30 border-t-priceai-blue"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star className="w-6 h-6 text-priceai-blue animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-lg font-medium text-priceai-blue">Loading Reviews & Ratings...</span>
                  <p className="text-sm text-priceai-gray mt-1">Getting patient feedback for this provider</p>
                </div>
              </div>

              {/* Skeleton Rating Distribution */}
              <div className="bg-priceai-lightgray/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-6 w-32 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{stars}</span>
                      <Star className="w-4 h-4 text-priceai-lightgray/40" />
                      <div className="flex-1 bg-priceai-lightgray/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-priceai-blue/30 to-priceai-blue/10 h-2 rounded-full animate-pulse"
                          style={{ width: `${Math.random() * 80 + 10}%` }}
                        ></div>
                      </div>
                      <Skeleton className="h-4 w-8 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton Review Cards */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="bg-white border border-priceai-lightgray/30 rounded-lg p-4 shadow-sm">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-priceai-blue/20 to-priceai-blue/10 rounded-full animate-pulse"></div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-1 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-4 h-4 text-priceai-lightgray/40 animate-pulse" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Skeleton className="h-4 w-20 bg-gradient-to-r from-priceai-lightgray/30 to-priceai-lightgray/10 animate-pulse" />
                    </div>
                    
                    {/* Review Content */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                      <Skeleton className="h-4 w-4/5 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                      <Skeleton className="h-4 w-3/5 bg-gradient-to-r from-priceai-lightgray/40 to-priceai-lightgray/20 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Rating Distribution */}
              <div className="bg-priceai-lightgray/30 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-priceai-dark mb-3">Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = statistics.ratingDistribution[stars as keyof typeof statistics.ratingDistribution];
                    const percentage = statistics.totalReviews > 0 ? (count / statistics.totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-8">{stars}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-priceai-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-priceai-gray w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-priceai-gray">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="border border-priceai-lightgray/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-priceai-blue/20 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-priceai-blue" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-priceai-dark">{review.user}</h4>
                              <div className="flex items-center gap-2">
                                <StarRating rating={review.rating} size={14} />
                                <span className="text-sm text-priceai-gray">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-priceai-lightblue/20 text-priceai-blue">
                            {service?.serviceName || 'Service'}
                          </Badge>
                        </div>

                        <p className="text-priceai-dark mb-3 leading-relaxed">
                          {review.review}
                        </p>

                    
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Write Review Tab */}
      {activeTab === 'rate' && (
        <div className="space-y-6">
          
          
          {!user ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Login Required</h4>
              <p className="text-yellow-700">Please log in to write a review for this provider.</p>
              <button 
                onClick={checkAuthentication}
                className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
              >
                Check Login Status
              </button>
            </div>
          ) : hasUserReviewed ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Review Already Submitted</h4>
              <p className="text-blue-700">You have already reviewed this provider for this service.</p>
              <button 
                onClick={checkAuthentication}
                className="mt-2 px-3 py-1 bg-blue-200 text-blue-800 rounded text-sm hover:bg-blue-300"
              >
                Recheck Review Status
              </button>
            </div>
          ) : (
            <>
              <div className="bg-priceai-lightgray/30 rounded-lg p-4">
                <h4 className="font-semibold text-priceai-dark mb-3">Share Your Experience</h4>
                <p className="text-sm text-priceai-gray">
                  Your review helps other patients make informed decisions about their healthcare choices.
                </p>
              </div>

              {/* Rating Selection */}
              <div>
                <label className="block text-sm font-medium text-priceai-dark mb-3">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={rating}
                    size={32}
                    interactive={true}
                    onRate={handleRatingClick}
                  />
                  <span className="text-sm text-priceai-gray ml-2">
                    {rating > 0 && (
                      ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]
                    )}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-priceai-dark mb-2">
                  Your Review *
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share details about your experience, including staff friendliness, facility cleanliness, wait times, and overall satisfaction..."
                  className="w-full p-3 border outline-none border-priceai-lightgray rounded-lg focus:ring-2 focus:ring-priceai-blue focus:border-transparent min-h-[120px]"
                  rows={6}
                />
                <p className="text-xs text-priceai-gray mt-1">
                  {review.length < 10 ? 
                    `Minimum 10 characters (${review.length}/10)` : 
                    `${review.length}/2000 characters`
                  }
                </p>
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Review Guidelines</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Be honest and constructive in your feedback</li>
                  <li>• Focus on your personal experience</li>
                  <li>• Avoid sharing personal medical information</li>
                  <li>• Keep language respectful and professional</li>
                  <li>• Review length: 10-2000 characters</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setActiveTab('reviews')}
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-priceai-blue hover:bg-priceai-lightblue"
                  disabled={submitting || rating === 0 || review.trim().length < 10}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
