import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { User as UserIcon, Mail, Globe, Github, Shield, Save, MapPin, Info, Camera, X, AlertTriangle, Loader2, Compass } from "lucide-react";
import { getGradient, getAssetUrl } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { User } from "@shared/schema";
import { DEPARTMENTS, SKILLS } from "@shared/constants";
import { deleteAccount } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// University options
const UNIVERSITY_OPTIONS = [
  "SAIRAM INSTITUTE OF TECHNOLOGY",
  "SAIRAM ENGINEERING COLLEGE"
];

// Validation helper for university field
const validateUniversityField = (university: string | undefined): string | null => {
  if (!university || university.trim().length === 0) {
    return "University is required";
  }
  if (university === "OTHER") {
    return "Please select a valid university or enter a custom one";
  }
  if (university.trim().length > 200) {
    return "University name cannot exceed 200 characters";
  }
  return null;
};

export default function Profile() {
  const { updateProfile } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize with safe defaults
  const [formData, setFormData] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when user data changes (e.g. after TanStack Query refetch)
  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  // Skills State
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  
  // Account Deletion State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    // Validation
    if (confirmationText !== "DELETE") {
      toast({ 
        title: "Confirmation Required", 
        description: "Please type DELETE to confirm.", 
        variant: "destructive" 
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Proceed with account deletion
      await deleteAccount();
      
      toast({ 
        title: "Account Deleted", 
        description: "Your account has been permanently deleted. Redirecting...",
        duration: 3000,
      });
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to home page after adequate time to see toast
      setTimeout(() => {
        setLocation("/");
        // Force page reload to clear any remaining state
        window.location.href = "/";
      }, 2500);
    } catch (error: any) {
      toast({ 
        title: "Deletion Failed", 
        description: error.message || "Failed to delete account. Please try again.", 
        variant: "destructive" 
      });
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConfirmationText("");
    }
  };

  if (!user) return null;

  const handleSave = async () => {
    // Validation
    if (!formData.name?.trim() || !formData.username?.trim()) {
      toast({ title: "Validation Error", description: "Name and Username are required.", variant: "destructive" });
      return;
    }
    if (!formData.skills || !Array.isArray(formData.skills) || formData.skills.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one skill.", variant: "destructive" });
      return;
    }
    
    const universityError = validateUniversityField(formData.university || undefined);
    if (universityError) {
      toast({ title: "Validation Error", description: universityError, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    setIsAvatarUploading(true);
    try {
      if (!user?.id) throw new Error("User not authenticated");
      await updateProfile(user.id, formData);
      // Invalidate the /api/me TanStack Query cache so useAuth() reflects the latest profile
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ 
        title: "Profile Updated", 
        description: "Your changes have been saved successfully." 
      });
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to save your changes. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Check: Size Limit (2MB matching backend)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 2MB.", variant: "destructive" });
      return;
    }

    // Security Check: File Type
    // NOTE #17: This is client-side validation only. Backend MUST validate MIME type + magic bytes.
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload a valid image file (PNG, JPG).", variant: "destructive" });
      return;
    }

    // Upload to Backend using API adapter (Rule 3)
    setIsSaving(true);
    try {
      if (!user?.id) throw new Error("User not authenticated");
      const { uploadAvatar } = await import("@/lib/api");
      const updatedUser = await uploadAvatar(user.id, file);

      // Update local form state immediately
      setFormData(prev => ({ ...prev, avatar: updatedUser.avatar }));
      // Invalidate /api/me so useAuth() picks up the new avatar everywhere in the app
      await queryClient.invalidateQueries({ queryKey: ["/api/me"] });

      toast({ title: "Image Uploaded", description: "Your profile picture has been updated." });
    } catch (e) {
      logger.error("Avatar upload failed", e);
      toast({ title: "Upload Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Skills and Interests handlers using array fields
  const currentSkills = formData.skills || [];
  const currentInterests = formData.interests || [];

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !currentSkills.includes(newSkill) && SKILLS.includes(newSkill as any)) {
        setFormData({ ...formData, skills: [...currentSkills, newSkill] });
        setSkillInput("");
      } else if (newSkill && !SKILLS.includes(newSkill as any)) {
        toast({
          title: "Invalid Skill",
          description: "Please select a skill from the predefined list.",
          variant: "destructive",
        });
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: currentSkills.filter(s => s !== skillToRemove) });
  };

  const addInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newInterest = interestInput.trim();
      if (newInterest && !currentInterests.includes(newInterest) && SKILLS.includes(newInterest as any)) {
        setFormData({ ...formData, interests: [...currentInterests, newInterest] });
        setInterestInput("");
      } else if (newInterest && !SKILLS.includes(newInterest as any)) {
        toast({
          title: "Invalid Interest",
          description: "Please select an interest from the predefined list.",
          variant: "destructive",
        });
      }
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setFormData({ ...formData, interests: currentInterests.filter(i => i !== interestToRemove) });
  };

  return (
    <div className="min-h-screen abstract-bg pb-20 pt-24">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 md:p-12 rounded-[2.5rem] border-border shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar / Profile Summary */}
            <div className="md:w-1/3 space-y-8">
              <div className="text-center relative group">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                />

                <div
                  onClick={() => !isAvatarUploading && fileInputRef.current?.click()}
                  className={`w-40 h-40 rounded-[2.5rem] bg-gradient-to-br ${getGradient(formData.name || "")} mx-auto mb-6 border-4 border-border flex items-center justify-center text-5xl font-display font-bold text-primary-foreground shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative group-hover:scale-105 ${isAvatarUploading ? "pointer-events-none opacity-80" : ""}`}
                >
                  {formData.avatar ? (
                    <img src={getAssetUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (formData.name || "?").charAt(0)
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-primary-foreground" size={32} />
                  </div>

                  {/* Upload Overlay */}
                  {isAvatarUploading && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="text-primary-foreground animate-spin" size={28} />
                      <span className="text-xs font-semibold text-primary-foreground">Uploading...</span>
                    </div>
                  )}
                </div>

                <h2 className="text-3xl font-display font-bold mb-1">{formData.name}</h2>
                <p className="text-muted-foreground font-medium text-lg">@{formData.username}</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
                    <Info size={16} /> Safety Tip
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Always verify your collaborator's identity before starting work. Be cautious when sharing personal information.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-muted/30 border border-border backdrop-blur-sm shadow-inner">
                  <div className="flex items-center gap-3 text-sm font-bold mb-4">
                    <Shield size={16} className="text-primary" /> Privacy Settings
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Show Email</span>
                      <Switch
                        checked={formData.privacy?.showEmail || false}
                        onCheckedChange={(val) => setFormData({
                          ...formData,
                          privacy: {
                            showEmail: val,
                            showPortfolio: formData.privacy?.showPortfolio ?? false,
                            showUniversity: formData.privacy?.showUniversity ?? false,
                            showCity: formData.privacy?.showCity ?? false
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Show Portfolio</span>
                      <Switch
                        checked={formData.privacy?.showPortfolio || false}
                        onCheckedChange={(val) => setFormData({
                          ...formData,
                          privacy: {
                            showPortfolio: val,
                            showEmail: formData.privacy?.showEmail ?? false,
                            showUniversity: formData.privacy?.showUniversity ?? false,
                            showCity: formData.privacy?.showCity ?? false
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Show University</span>
                      <Switch
                        checked={formData.privacy?.showUniversity || false}
                        onCheckedChange={(val) => setFormData({
                          ...formData,
                          privacy: {
                            showUniversity: val,
                            showEmail: formData.privacy?.showEmail ?? false,
                            showPortfolio: formData.privacy?.showPortfolio ?? false,
                            showCity: formData.privacy?.showCity ?? false
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="flex-1 space-y-8">
              <div>
                <h1 className="text-3xl font-display font-bold mb-2">Edit Profile</h1>
                <p className="text-muted-foreground">Customize your public presence on FindATeammate (by <strong>AhiLight</strong>).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2"><UserIcon size={16} /> Full Name</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2"><UserIcon size={16} /> Username</Label>
                  <Input
                    value={formData.username || ""}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2"><Mail size={16} /> Email Address</Label>
                <Input
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-14 rounded-2xl bg-muted/50 border-input"
                />
              </div>

              {/* Department Selection */}
              <div className="space-y-2">
                <Label className="font-bold">Department</Label>
                <Select
                  value={formData.department || ""}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-input">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">Skills</Label>
                  <div className="group relative">
                    <Info size={16} className="text-muted-foreground cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-popover border border-border rounded-lg shadow-lg text-sm z-50">
                      💡 Keep your skills updated to get better matches for cross-department events and increase your chances of being approved!
                    </div>
                  </div>
                </div>
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder="Type a skill and press Enter (e.g. React, Python)"
                  className="h-14 rounded-2xl bg-muted/50 border-input"
                  list="skills-datalist"
                />
                <datalist id="skills-datalist">
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary border border-primary/20 gap-2 hover:bg-primary/20">
                      {skill}
                      <X size={14} className="cursor-pointer hover:bg-muted/50 rounded-full" onClick={() => removeSkill(skill)} />
                    </Badge>
                  ))}
                  {currentSkills.length === 0 && <span className="text-muted-foreground text-sm italic">No skills added yet</span>}
                </div>
              </div>

              {/* Interests Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">Interests</Label>
                  <div className="group relative">
                    <Info size={16} className="text-muted-foreground cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-popover border border-border rounded-lg shadow-lg text-sm z-50">
                      💡 Adding interests helps organizers find the best fit for their events. Keep them updated!
                    </div>
                  </div>
                </div>
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={addInterest}
                  placeholder="Type an interest and press Enter (e.g. Machine Learning, UX Design)"
                  className="h-14 rounded-2xl bg-muted/50 border-input"
                  list="interests-datalist"
                />
                <datalist id="interests-datalist">
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentInterests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1.5 rounded-lg text-sm bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 gap-2 hover:bg-purple-500/20">
                      {interest}
                      <X size={14} className="cursor-pointer hover:bg-muted/50 rounded-full" onClick={() => removeInterest(interest)} />
                    </Badge>
                  ))}
                  {currentInterests.length === 0 && <span className="text-muted-foreground text-sm italic">No interests added yet</span>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="font-bold">Bio</Label>
                    <span className={`text-xs ${
                        (formData.bio?.length || 0) > 250 ? "text-destructive font-bold" : "text-muted-foreground"
                    }`}>
                        {formData.bio?.length || 0}/250
                    </span>
                </div>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[120px] rounded-2xl bg-muted/50 border-input resize-none p-4"
                  placeholder="Tell others about yourself..."
                  maxLength={250}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">University Name</Label>
                  <Select 
                    value={UNIVERSITY_OPTIONS.includes(formData.university || "") ? (formData.university || "") : "OTHER"}
                    onValueChange={(value) => {
                      if (value !== "OTHER") {
                        setFormData({ ...formData, university: value });
                      } else {
                        setFormData({ ...formData, university: "OTHER" });
                      }
                    }}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-input">
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAIRAM INSTITUTE OF TECHNOLOGY">SAIRAM INSTITUTE OF TECHNOLOGY</SelectItem>
                      <SelectItem value="SAIRAM ENGINEERING COLLEGE">SAIRAM ENGINEERING COLLEGE</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.university && !UNIVERSITY_OPTIONS.includes(formData.university) || formData.university === "OTHER" ? (
                  <div className="space-y-2">
                    <Label className="font-bold">Enter Your University Name</Label>
                    <Input
                      value={formData.university === "OTHER" ? "" : (formData.university || "")}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      maxLength={200}
                      className="h-14 rounded-2xl bg-muted/50 border-input"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2"><MapPin size={16} /> City</Label>
                  <Input
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-input"
                    placeholder="e.g. New York, London"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2"><Globe size={16} /> Portfolio URL</Label>
                  <Input
                    value={formData.portfolio || ""}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-input"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2"><Github size={16} /> GitHub Profile</Label>
                  <Input
                    value={formData.github || ""}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="h-14 rounded-2xl bg-muted/50 border-input"
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-border/50">
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-primary" /> Security
                </h3>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <Globe size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-primary">Connected via Google</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your account security is managed through Google OAuth. 
                        To change your password or security settings, please visit your 
                        <a 
                          href="https://myaccount.google.com/security" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1 font-medium"
                        >
                          Google Account settings
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-16 rounded-full font-bold text-lg gradient-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform"
                >
                  {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save size={20} className="mr-2" />}
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>

              {/* Danger Zone - Account Deletion */}
              <div className="pt-8 border-t border-destructive/20">
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-destructive">
                  <AlertTriangle size={20} /> Danger Zone
                </h3>
                <div className="p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-destructive/20">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg text-xs"
                        onClick={() => {
                          window.dispatchEvent(new Event("findateammate:open-tour"));
                          toast({
                            title: "Quick Tour",
                            description: "Tour opened. You can close it anytime.",
                          });
                        }}
                      >
                        <Compass size={14} className="mr-2" />
                        Take Tour
                      </Button>
                    </div>

                    <div>
                      <h4 className="font-bold text-destructive mb-2">Delete Account</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                      <li>All your posts will be deleted</li>
                      <li>All connection requests and messages will be removed</li>
                      <li>Your profile data will be permanently erased</li>
                      <li>This action is irreversible</li>
                    </ul>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="w-full h-12 rounded-xl font-bold"
                        >
                          <AlertTriangle size={16} className="mr-2" />
                          Delete My Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-panel border-destructive/20">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle size={20} />
                            Confirm Account Deletion
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4 pt-4">
                            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                              <p className="text-sm font-semibold text-destructive mb-2">⚠️ Warning: This action is permanent!</p>
                              <p className="text-xs text-muted-foreground">
                                Your account, posts, messages, and all associated data will be permanently deleted.
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">
                                Type <span className="text-destructive font-mono">DELETE</span> to confirm
                              </Label>
                              <Input
                                placeholder="Type DELETE"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="h-10 rounded-lg font-mono"
                              />
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            onClick={() => {
                              setConfirmationText("");
                            }}
                            className="rounded-lg"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || confirmationText !== "DELETE"}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg"
                          >
                            {isDeleting ? "Deleting..." : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
