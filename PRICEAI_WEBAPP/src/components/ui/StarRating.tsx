'use client';

import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  totalReviews?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = true,
  totalReviews,
  className = ''
}) => {
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxStars - filledStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const StarIcon = ({ filled, half = false }: { filled: boolean; half?: boolean }) => (
    <svg
      className={`${sizeClasses[size]} ${filled ? 'text-yellow-400' : 'text-gray-300'} ${half ? 'text-yellow-400' : ''}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      {half ? (
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        fill={half ? 'url(#half-star)' : 'currentColor'}
      />
    </svg>
  );

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {/* Filled stars */}
        {Array.from({ length: filledStars }, (_, index) => (
          <StarIcon key={`filled-${index}`} filled={true} />
        ))}
        
        {/* Half star */}
        {hasHalfStar && <StarIcon filled={true} half={true} />}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, index) => (
          <StarIcon key={`empty-${index}`} filled={false} />
        ))}
      </div>
      
      {showNumber && (
        <span className={`${textSizeClasses[size]} text-gray-600 ml-1`}>
          {rating.toFixed(1)}
          {totalReviews !== undefined && totalReviews > 0 && (
            <span className="text-gray-500"> ({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  );
};

export default StarRating;
