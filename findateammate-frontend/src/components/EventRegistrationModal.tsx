import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MatchScoreResult {
  score: number;
  isEligible: boolean;
  skillMatch: number;
  interestMatch: number;
  matchedSkills: string[];
  matchedInterests: string[];
  missingSkills: string[];
  missingInterests: string[];
}

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  eventType: "intra-college" | "outside-college";
  requiredSkills?: string[];
  requiredInterests?: string[];
  specialRequirements?: string;
  crossDeptRequiresApproval?: boolean;
  userDepartment?: string;
  organizerDepartment?: string;
  onRegistrationSuccess?: () => void;
}

export function EventRegistrationModal({
  open,
  onOpenChange,
  eventId,
  eventName,
  eventType,
  requiredSkills = [],
  requiredInterests = [],
  specialRequirements = "",
  crossDeptRequiresApproval = false,
  userDepartment,
  organizerDepartment,
  onRegistrationSuccess,
}: EventRegistrationModalProps) {
  const { toast } = useToast();
  const [matchScore, setMatchScore] = useState<MatchScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [scoreLoadFailed, setScoreLoadFailed] = useState(false);

  const hasDepartmentContext = Boolean(userDepartment && organizerDepartment);
  const isCrossDept = hasDepartmentContext && userDepartment !== organizerDepartment;
  const isIntraCollege = eventType === "intra-college";
  const hasSkillRequirements = requiredSkills.length > 0;
  const hasInterestRequirements = requiredInterests.length > 0;
  const hasStructuredRequirements = hasSkillRequirements || hasInterestRequirements;
  const trimmedSpecialRequirements = specialRequirements.trim();

  const fetchMatchScore = async () => {
    setIsLoading(true);
    setScoreLoadFailed(false);
    try {
      const response = await api.getEventMatchScore(eventId);
      setMatchScore(response);
    } catch (error) {
      setScoreLoadFailed(true);
      setMatchScore(null);
      console.error("Failed to load match score:", error);
      toast({
        title: "Could not load match data",
        description: "Skill matching could not be fetched. You can retry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch match score on modal open for intra-college events.
  // Match requirements apply regardless of whether cross-department context is available in the UI.
  useEffect(() => {
    if (!open || !isIntraCollege || !hasStructuredRequirements) return;
    fetchMatchScore();
  }, [open, isIntraCollege, hasStructuredRequirements, eventId]);

  // Handle registration submission
  const handleRegister = async () => {
    setIsSubmitting(true);
    setRegistrationStatus("idle");
    setErrorMessage("");

    try {
      await api.registerForEvent(eventId);
      setRegistrationStatus("success");
      toast({
        title: "Success",
        description: crossDeptRequiresApproval
          ? "Registration submitted! Awaiting organizer approval."
          : "Successfully registered for event!",
      });
      setTimeout(() => {
        onRegistrationSuccess?.();
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      setRegistrationStatus("error");
      const message = error?.response?.data?.message || error?.message || "Failed to register. Please try again.";
      setErrorMessage(message);
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-panel border-border p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogClose className="absolute right-4 top-4 p-1 hover:bg-muted rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </DialogClose>
          <DialogTitle className="text-xl font-bold">{eventName}</DialogTitle>
          <DialogDescription>
            Review your eligibility and submit your request to join this event.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Event Type Badge */}
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                "font-semibold",
                isIntraCollege
                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
              )}
            >
              {isIntraCollege ? "🏫 Intra-College" : "🌍 Outside-College"}
            </Badge>
            {isCrossDept && isIntraCollege && (
              <Badge variant="outline" className="border-accent/50 text-accent">
                Cross-Department
              </Badge>
            )}
          </div>

          {/* Match Score Section (Intra-College) */}
          <AnimatePresence mode="wait">
            {isIntraCollege && hasStructuredRequirements ? (
              isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                </motion.div>
              ) : matchScore ? (
                <motion.div
                  key="match-score"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Overall Match Score */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Overall Match Score</span>
                      <span className={cn("text-2xl font-bold", matchScore.score >= 40 ? "text-primary" : "text-destructive")}>
                        {matchScore.score}%
                      </span>
                    </div>
                    <Progress
                      value={matchScore.score}
                      className="h-2"
                    />
                    {matchScore.isEligible ? (
                      <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        You meet the requirements for this event
                      </p>
                    ) : (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertCircle size={14} />
                        Below minimum threshold (40% required)
                      </p>
                    )}
                  </div>

                  {/* Skills / Interests Breakdown */}
                  <div className="space-y-3">
                    {hasSkillRequirements && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">Skills</span>
                          <span className="text-xs text-muted-foreground">
                            {matchScore.matchedSkills.length} of {requiredSkills.length}
                          </span>
                        </div>
                        <Progress
                          value={(matchScore.matchedSkills.length / requiredSkills.length) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}
                    {hasInterestRequirements && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">Interests</span>
                          <span className="text-xs text-muted-foreground">
                            {matchScore.matchedInterests.length} of {requiredInterests.length}
                          </span>
                        </div>
                        <Progress
                          value={(matchScore.matchedInterests.length / requiredInterests.length) * 100}
                          className="h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Matched Items */}
                  {(matchScore.matchedSkills.length > 0 || matchScore.matchedInterests.length > 0) && (
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        You have these required skills/interests
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[...matchScore.matchedSkills, ...matchScore.matchedInterests].slice(0, 5).map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                        {matchScore.matchedSkills.length + matchScore.matchedInterests.length > 5 && (
                          <Badge variant="secondary" className="text-xs text-muted-foreground">
                            +{matchScore.matchedSkills.length + matchScore.matchedInterests.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Items */}
                  {(matchScore.missingSkills.length > 0 || matchScore.missingInterests.length > 0) && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle size={14} />
                        Missing skills/interests
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {[...matchScore.missingSkills, ...matchScore.missingInterests].slice(0, 5).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                            {item}
                          </Badge>
                        ))}
                        {matchScore.missingSkills.length + matchScore.missingInterests.length > 5 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{matchScore.missingSkills.length + matchScore.missingInterests.length - 5}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : scoreLoadFailed ? (
                <motion.div
                  key="match-failed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    Could not load skill matching right now.
                  </div>
                  <Button variant="outline" onClick={fetchMatchScore} className="w-full" disabled={isLoading}>
                    {isLoading ? "Retrying..." : "Retry Match Check"}
                  </Button>
                </motion.div>
              ) : null
            ) : null}
          </AnimatePresence>

          {/* Special Requirements */}
          {trimmedSpecialRequirements.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Special Requirements</p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-2 leading-relaxed">
                {trimmedSpecialRequirements}
              </p>
            </div>
          )}

          {/* Approval Status Note */}
          {crossDeptRequiresApproval && isCrossDept && isIntraCollege && (
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 flex gap-3">
              <Clock size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-semibold">Pending Approval</p>
                <p className="mt-1 text-blue-600/70 dark:text-blue-400/70">
                  Your registration will be reviewed by the organizer
                </p>
              </div>
            </div>
          )}

          {/* Registration Status Messages */}
          <AnimatePresence>
            {registrationStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3"
              >
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Registered Successfully!</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                    {crossDeptRequiresApproval ? "Waiting for organizer approval..." : "You're all set!"}
                  </p>
                </div>
              </motion.div>
            )}
            {registrationStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/30"
              >
                <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Register Button */}
          {registrationStatus !== "success" && (
            <Button
              onClick={handleRegister}
              disabled={isSubmitting || (hasStructuredRequirements && isLoading) || (hasStructuredRequirements && scoreLoadFailed) || (hasStructuredRequirements && isIntraCollege && !!matchScore && !matchScore.isEligible)}
              className="w-full h-10 font-semibold rounded-lg"
            >
              {isSubmitting ? "Registering..." : "Register for Event"}
            </Button>
          )}

          {/* Alternate Button for Success State */}
          {registrationStatus === "success" && (
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full h-10 font-semibold rounded-lg"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
