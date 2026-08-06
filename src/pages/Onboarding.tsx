import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { checkUsernameAvailability, submitOnboarding } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Sparkles, X } from "lucide-react";
import { DEPARTMENTS, SKILLS } from "@shared/constants";
import { useDebounce } from "@/hooks/use-debounce";

// URL validation helper for optional URLs - allow empty string or valid URL
const optionalUrl = z.union([
  z.string().url("Must be a valid URL"),
  z.literal("")
]).transform((val) => val || "");

// Sanitization helper - removes HTML/script tags
const sanitizeString = (str: string) => {
  return str.replace(/<[^>]*>/g, "").trim();
};

// University options
const UNIVERSITY_OPTIONS = [
  "SAIRAM INSTITUTE OF TECHNOLOGY",
  "SAIRAM ENGINEERING COLLEGE"
];

const onboardingSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "No spaces allowed - use letters, numbers and underscores only"),
  department: z.string().min(1, "Department is required").refine((val) => val !== "OTHER", "Please select your department"),
  skills: z.array(z.string()).min(1, "Please add at least one skill").default([]),
  bio: z.string().trim().max(250, "Bio cannot exceed 250 characters").optional().or(z.literal("")),
  portfolio: optionalUrl.transform((val) => val || ""),
  github: z.string().trim().optional().or(z.literal(""))
    .refine((val) => {
      if (!val) return true; // optional
      try {
        const url = new URL(val);
        return url.hostname.includes("github.com");
      } catch {
        return false;
      }
    }, "GitHub URL must be from github.com")
    .transform((val) => val || ""),
  linkedin: z.string().trim().optional().or(z.literal(""))
    .refine((val) => {
      if (!val) return true; // optional
      try {
        const url = new URL(val);
        return url.hostname.includes("linkedin.com");
      } catch {
        return false;
      }
    }, "LinkedIn URL must be from linkedin.com")
    .transform((val) => val || ""),
  city: z.string().trim().min(1, "City is required").max(100, "City cannot exceed 100 characters").transform(sanitizeString),
  university: z.string().min(1, "University is required").max(200, "University name cannot exceed 200 characters")
    .refine((val) => val !== "OTHER", "Please select a valid university or enter a custom one")
    .refine((val) => UNIVERSITY_OPTIONS.slice(0, 2).includes(val) || val.length > 0, "Please enter a custom university name if selecting OTHER")
    .transform(sanitizeString),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const isValidRequiredDepartment = (value: unknown): boolean => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return normalized.length > 0 && normalized !== "OTHER" && DEPARTMENTS.includes(normalized as any);
};

const toRequiredDepartmentValue = (value: unknown): string => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return isValidRequiredDepartment(normalized) ? normalized : "";
};

// Load saved draft from localStorage
const loadSavedDraft = (): Partial<OnboardingForm> => {
  try {
    const savedDraft = localStorage.getItem("onboarding_draft");
    if (!savedDraft) return {};
    const parsed = JSON.parse(savedDraft);
    // Validate it's an object, not injected code
    if (typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch (error) {
    console.error("Failed to load draft:", error);
    localStorage.removeItem("onboarding_draft");
    return {};
  }
};

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [skillInput, setSkillInput] = useState("");
  
  const savedDraft = loadSavedDraft();

  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange', // Enable real-time validation for isValid to work correctly
    defaultValues: {
      username: savedDraft.username || (user?.username?.startsWith('user_') ? "" : (user?.username || "")),
      department: toRequiredDepartmentValue(savedDraft.department) || toRequiredDepartmentValue(user?.department),
      skills: savedDraft.skills || user?.skills || [],
      bio: savedDraft.bio || user?.bio || "",
      portfolio: savedDraft.portfolio || user?.portfolio || "",
      github: savedDraft.github || user?.github || "",
      linkedin: savedDraft.linkedin || user?.linkedin || "",
      city: savedDraft.city || user?.city || "",
      university: savedDraft.university || (user?.university && UNIVERSITY_OPTIONS.includes(user.university) ? user.university : ""),
    },
  });

  const username = form.watch("username");
  const debouncedUsername = useDebounce(username, 400);

  const { data: availability, isLoading: isCheckingAvailability, isError: isAvailabilityError } = useQuery({
    queryKey: ["/api/auth/check-username", debouncedUsername],
    queryFn: () => checkUsernameAvailability(debouncedUsername!),
    enabled: !!debouncedUsername && debouncedUsername.length >= 3,
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      // Save draft before submission
      localStorage.setItem("onboarding_draft", JSON.stringify(data));

      let retries = 0;
      const maxRetries = 3;

      const submitWithRetry = async (): Promise<any> => {
        try {
          const result = await submitOnboarding(data);
          // Clear draft on success
          localStorage.removeItem("onboarding_draft");
          return result;
        } catch (error) {
          retries++;
          if (retries < maxRetries) {
            console.log(`Retry ${retries}/${maxRetries}...`);
            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
            return submitWithRetry();
          } else {
            throw error;
          }
        }
      };

      return await submitWithRetry();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/me"], updatedUser);
      toast({
        title: "Welcome aboard!",
        description: "Your profile has been successfully set up.",
      });
      startTransition(() => {
        setLocation("/");
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup failed",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle redirects in useEffect to avoid blocking render
  useEffect(() => {
    if (isLoading) return; // Wait for user data to load

    if (!user) {
      startTransition(() => {
        setLocation("/login");
      });
      return;
    }

    // Access Control: Only for Google users who haven't finished setup
    // Admins are allowed for debugging
    const isGoogleUser = user.authProvider === 'google';
    const hasSkills = Array.isArray(user.skills) && user.skills.length > 0;
    const hasCity = Boolean((user.city || "").trim());
    const hasUniversity = Boolean((user.university || "").trim());
    const hasDepartment = isValidRequiredDepartment(user.department);
    const needsOnboarding = !(hasSkills && hasCity && hasUniversity && hasDepartment);
    
    if (!isGoogleUser && !user.isAdmin) {
      startTransition(() => {
        setLocation("/");
      });
      return;
    }

    if (!needsOnboarding && !user.isAdmin) {
      startTransition(() => {
        setLocation("/");
      });
      return;
    }
  }, [user, isLoading, setLocation]);

  // Show loading state while checking user status
  if (isLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If user doesn't meet onboarding criteria, show loading while redirecting
  const isGoogleUser = user.authProvider === 'google';
  const hasSkills = Array.isArray(user.skills) && user.skills.length > 0;
  const hasCity = Boolean((user.city || "").trim());
  const hasUniversity = Boolean((user.university || "").trim());
  const hasDepartment = isValidRequiredDepartment(user.department);
  const needsOnboarding = !(hasSkills && hasCity && hasUniversity && hasDepartment);
  if ((!isGoogleUser || !needsOnboarding) && !user.isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // FIX ISSUE #2: Prevent back button navigation during onboarding
  useEffect(() => {
    // Push initial state to history
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      alert("Please complete your profile setup first before leaving this page");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Load saved draft from localStorage on mount
  useEffect(() => {
    const savedDraft = loadSavedDraft();
    if (Object.keys(savedDraft).length > 0) {
      Object.keys(savedDraft).forEach((key) => {
        form.setValue(key as keyof OnboardingForm, savedDraft[key as keyof OnboardingForm], { shouldValidate: true });
      });
    }
  }, [form]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden py-12">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-3xl mx-auto glass-card border-border shadow-xl relative z-20">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-display font-bold">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Just a few more details to help you find the right teammates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data: any) => onboardingMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center text-foreground font-semibold">
                      Choose a Username
                      {debouncedUsername && debouncedUsername.length >= 3 && !isCheckingAvailability && (
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${availability?.available ? "text-green-500" : "text-destructive"}`}>
                          {availability?.available ? (
                            <><CheckCircle2 size={10} /> Available</>
                          ) : (
                            <><XCircle size={10} /> Taken</>
                          )}
                        </span>
                      )}
                      {isCheckingAvailability && (
                        <span className="text-[10px] font-black uppercase flex items-center gap-1 text-muted-foreground">
                          <Loader2 size={10} className="animate-spin" /> Checking...
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="johndoe_builder" 
                        {...field} 
                        className={`bg-muted/50 h-12 border-input text-foreground transition-all ${
                          debouncedUsername && debouncedUsername.length >= 3 && !isCheckingAvailability && !availability?.available 
                          ? "border-destructive focus-visible:ring-destructive" 
                          : ""
                        }`} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">No spaces - use letters, numbers and underscores only</p>
                    {isAvailabilityError && debouncedUsername?.length >= 3 && (
                      <p className="text-xs text-destructive">Could not check username availability right now. You can still continue and we will validate on submit.</p>
                    )}
                    {!isCheckingAvailability && !isAvailabilityError && debouncedUsername?.length >= 3 && availability?.available === true && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Username looks good.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills Section */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-semibold">Department *</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 h-12 border-input text-foreground">
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.filter((dept) => dept !== "OTHER").map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skills Section */}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => {
                  const currentSkills = field.value || [];
                  
                  const handleAddSkill = () => {
                    const newSkill = skillInput.trim();
                    if (newSkill && !currentSkills.includes(newSkill) && SKILLS.includes(newSkill as any)) {
                      field.onChange([...currentSkills, newSkill]);
                      setSkillInput("");
                    } else if (newSkill && !SKILLS.includes(newSkill as any)) {
                      toast({
                        title: "Invalid Skill",
                        description: "Please select a skill from the predefined list.",
                        variant: "destructive",
                      });
                    }
                  };

                  const addSkill = (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  };

                  const removeSkill = (skillToRemove: string) => {
                    field.onChange(currentSkills.filter((s: string) => s !== skillToRemove));
                  };

                  return (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Skills *</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={addSkill}
                            placeholder="Type a skill and press Enter (e.g. React, Python)"
                            className="bg-muted/50 h-12 border-input text-foreground flex-1"
                            list="skills-datalist"
                          />
                          <Button 
                            type="button" 
                            variant="secondary"
                            className="h-12 px-6 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddSkill();
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </FormControl>
                      <datalist id="skills-datalist">
                        {SKILLS.map((skill) => (
                          <option key={skill} value={skill} />
                        ))}
                      </datalist>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentSkills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary border border-primary/20 gap-2">
                            {skill}
                            <X size={14} className="cursor-pointer hover:bg-muted/50 rounded-full" onClick={() => removeSkill(skill)} />
                          </Badge>
                        ))}
                        {currentSkills.length === 0 && <span className="text-muted-foreground text-xs italic">No skills added yet</span>}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel className="text-foreground font-semibold">Bio (Optional)</FormLabel>
                        <span className={`text-xs ${
                            (form.watch("bio")?.length || 0) > 250 ? "text-destructive font-bold" : "text-muted-foreground"
                        }`}>
                            {form.watch("bio")?.length || 0}/250
                        </span>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="What are you currently building or looking to join?" 
                        {...field} 
                        className="bg-muted/50 border-input text-foreground min-h-[100px] resize-none" 
                        maxLength={250}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Two-column layout for links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="portfolio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Portfolio (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://yourportfolio.com" 
                          type="url"
                          {...field} 
                          className="bg-muted/50 h-12 border-input text-foreground" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">GitHub (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://github.com/yourprofile" 
                          type="url"
                          {...field} 
                          className="bg-muted/50 h-12 border-input text-foreground" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Two-column layout for LinkedIn and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">LinkedIn (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://linkedin.com/in/yourprofile" 
                          type="url"
                          {...field} 
                          className="bg-muted/50 h-12 border-input text-foreground" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">City/Location *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. San Francisco, CA" 
                          {...field} 
                          maxLength={100}
                          className="bg-muted/50 h-12 border-input text-foreground" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => {
                  const selectedValue = form.watch("university");
                  const isCustom = selectedValue && !UNIVERSITY_OPTIONS.includes(selectedValue);
                  
                  return (
                    <>
                      <FormItem>
                        <FormLabel className="text-foreground font-semibold">University/College *</FormLabel>
                        <Select value={UNIVERSITY_OPTIONS.includes(selectedValue) ? selectedValue : "OTHER"} onValueChange={(value) => {
                          if (value !== "OTHER") {
                            field.onChange(value);
                          } else {
                            field.onChange("OTHER");
                          }
                        }}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/50 h-12 border-input text-foreground">
                              <SelectValue placeholder="Select your university" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAIRAM INSTITUTE OF TECHNOLOGY">SAIRAM INSTITUTE OF TECHNOLOGY</SelectItem>
                            <SelectItem value="SAIRAM ENGINEERING COLLEGE">SAIRAM ENGINEERING COLLEGE</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                          </SelectContent>
                        </Select>
                        {!isCustom && <FormMessage />}
                      </FormItem>

                      {isCustom || selectedValue === "OTHER" ? (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Enter Your University Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Stanford University" 
                              value={isCustom ? selectedValue : ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              maxLength={200}
                              className="bg-muted/50 h-12 border-input text-foreground" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) : null}
                    </>
                  );
                }}
              />

              <Button 
                type="submit" 
                className="w-full h-12 font-bold shadow-lg shadow-primary/20 text-lg" 
                disabled={
                  onboardingMutation.isPending || 
                  (debouncedUsername && debouncedUsername.length >= 3 && availability?.available === false) || 
                  !form.formState.isValid
                }
              >
                {onboardingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finish Setup"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
