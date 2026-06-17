import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export function FeedbackWidget() {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const submitFeedback = async () => {
    if (!feedback.trim() || rating === 0) {
      toast({ title: "Please provide feedback and rating", variant: "destructive" });
      return;
    }

    try {
      await api.submitFeedback({
        feedback: feedback.trim(),
        rating
      });
      
      setSubmitted(true);
      toast({ title: "Thank you for your feedback!" });
      
      setTimeout(() => {
        setFeedback("");
        setRating(0);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      toast({ title: "Failed to submit feedback", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm md:w-96 shadow-2xl z-50">
      <CardHeader>
        <CardTitle className="text-lg">Share Your Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!submitted ? (
          <>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <Button onClick={submitFeedback} className="w-full">
              Submit Feedback
            </Button>
          </>
        ) : (
          <div className="text-center py-4 text-green-600 font-medium">
            ✓ Feedback submitted successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
