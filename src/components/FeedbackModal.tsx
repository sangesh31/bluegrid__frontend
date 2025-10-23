import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportLocation: string;
  onFeedbackSubmitted: () => void;
}

export const FeedbackModal = ({ isOpen, onClose, reportId, reportLocation, onFeedbackSubmitted }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "⚠️ Rating Required",
        description: "Please select a star rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/reports/${reportId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Thank You!",
          description: "Your feedback has been submitted successfully",
        });
        onFeedbackSubmitted();
        onClose();
        // Reset form
        setRating(0);
        setComment('');
      } else {
        toast({
          title: "❌ Submission Failed",
          description: data.error || "Failed to submit feedback",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">⭐ Rate This Service</DialogTitle>
          <DialogDescription>
            How satisfied are you with the resolution of your report?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Report Location:</p>
            <p className="font-semibold text-gray-800">{reportLocation}</p>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Your Rating *</label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={48}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-gray-600">
                {rating === 5 && '🌟 Excellent!'}
                {rating === 4 && '😊 Very Good!'}
                {rating === 3 && '🙂 Good'}
                {rating === 2 && '😐 Fair'}
                {rating === 1 && '😞 Poor'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience or suggestions..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">{comment.length}/500</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
