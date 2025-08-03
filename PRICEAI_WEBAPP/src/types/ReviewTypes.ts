// Types for Reviews and Rating System

export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  review: string;
  helpful: number;
  service: string;
  name?: string; // Optional, can be used for anonymous reviews
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  statistics: ReviewStatistics;
}

export interface SubmitReviewRequest {
  provider_id: string;
  service_id: string;
  rating: number;
  reviews: string;
  user_id?:string;
}

export interface SubmitReviewResponse {
  message: string;
  review: {
    review_id: string;
    rating: number;
    reviews: string;
    created_at: string;
    users: {
      name: string;
      email: string;
    };
  };
}
