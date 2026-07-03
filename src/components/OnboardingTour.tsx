import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Find Teammates",
    description: "Browse profiles and posts to find collaborators with matching skills and goals.",
    actionLabel: "Open Teammates",
    actionPath: "/teammates",
  },
  {
    title: "Discover Events",
    description: "Explore intra-college and outside-college events, then register with one click.",
    actionLabel: "Open Events",
    actionPath: "/events",
  },
  {
    title: "Create a Post",
    description: "Post your idea or event and clearly mention required skills and departments.",
    actionLabel: "Create Post",
    actionPath: "/create-post",
  },
  {
    title: "Track RequestS & Chats",
    description: "Use Requests for approvals and Chat to coordinate quickly once accepted.",
    actionLabel: "Open Requests",
    actionPath: "/requests",
  },
] as const;

type OnboardingTourProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};

export function OnboardingTour({ open, onOpenChange, onComplete }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [, setLocation] = useLocation();

  const step = useMemo(() => TOUR_STEPS[stepIndex], [stepIndex]);
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
    }
  }, [open]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStepIndex(0);
    }
    onOpenChange(nextOpen);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      handleClose(false);
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNavigate = () => {
    setLocation(step.actionPath);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[calc(100%-2rem)] max-w-md">
      <Card className="border-border shadow-2xl">
        <CardHeader className="relative pb-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={() => handleClose(false)}
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>
            Quick Tour ({stepIndex + 1}/{TOUR_STEPS.length})
          </CardTitle>
          <CardDescription>{step.title}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground">{step.description}</p>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Tip: You can reopen this tour any time from your profile page.
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleBack} disabled={stepIndex === 0}>
              Back
            </Button>
            <Button type="button" variant="secondary" onClick={handleNavigate}>
              {step.actionLabel}
            </Button>
          </div>

          <Button type="button" onClick={handleNext}>
            {isLastStep ? "Done ✓" : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
