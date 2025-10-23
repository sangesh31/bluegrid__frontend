import { Star } from 'lucide-react';

interface FeedbackDisplayProps {
  rating: number;
  comment?: string;
  date?: string;
}

export const FeedbackDisplay = ({ rating, comment, date }: FeedbackDisplayProps) => {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Your Feedback:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={`${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-yellow-600">
            {rating}/5
          </span>
        </div>
        {date && (
          <span className="text-xs text-gray-500">
            {new Date(date).toLocaleDateString()}
          </span>
        )}
      </div>
      {comment && (
        <p className="text-sm text-gray-700 italic">"{comment}"</p>
      )}
    </div>
  );
};

export default FeedbackDisplay;
