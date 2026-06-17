import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useLocation, useRoute } from "wouter";
import * as api from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, Upload, Image as ImageIcon, Briefcase, Calendar, Building2, Globe, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, SKILLS, COLLEGES } from "@shared/constants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// --- Schema Definitions ---

const skillSchema = z.object({
  name: z.string().min(1, "Skill name required"),
  level: z.enum(["Beginner", "Intermediate", "Expert"]),
});

const createPostSchema = z.object({
  mode: z.enum(["teammate", "event"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(300),
  description: z.string().min(20, "Description must be at least 20 characters").max(500),
  city: z.string().min(1, "Location is required"),
  
  // Teammate Mode specific
  projectType: z.string().optional(),
  skillsWanted: z.array(skillSchema).optional(),
  skillsOffered: z.array(skillSchema).optional(),
  
  // Event Mode specific
  eventType: z.enum(["intra-college", "outside-college"]).optional(),
  hostCollege: z.string().optional(),
  eventWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  eventImage: z.string().optional(),
  eventDate: z.string().optional(),
  isEventOrganiser: z.boolean().optional(), // For intra-college: is user the event organiser/host?
  allowedDepartments: z.array(z.string()).optional(), // null = all, array = specific (1-10)
  requiredSkills: z.array(z.string()).optional().default([]),
  requiredInterests: z.array(z.string()).optional().default([]),
  specialRequirements: z.string().max(250, "Special requirements cannot exceed 250 characters").optional().or(z.literal("")),
  maxCrossDeptParticipants: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.number().int().positive().optional()
  ),
  crossDeptRequiresApproval: z.boolean().optional().default(true),
});

type PostFormValues = z.infer<typeof createPostSchema>;

// --- Components ---

function SkillInput({ 
  label, 
  skills, 
  onAdd, 
  onRemove, 
  onUpdateLevel, 
  placeholder 
}: { 
  label: string;
  skills: { name: string; level: "Beginner" | "Intermediate" | "Expert" }[]; 
  onAdd: (name: string, level: "Beginner" | "Intermediate" | "Expert") => void;
  onRemove: (index: number) => void;
  onUpdateLevel: (index: number, level: "Beginner" | "Intermediate" | "Expert") => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState("");
  const [levelVal, setLevelVal] = useState<"Beginner" | "Intermediate" | "Expert">("Intermediate");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim()) {
        onAdd(inputVal.trim(), levelVal);
        setInputVal("");
      }
    }
  };

  return (
    <div className="space-y-3">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Input 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-muted/50 border-input text-foreground"
        />
        <Select 
          value={levelVal} 
          onValueChange={(v: any) => setLevelVal(v)}
        >
          <SelectTrigger className="w-full sm:w-[140px] bg-muted/50 border-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Expert">Expert</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={() => {
            if (inputVal.trim()) {
              onAdd(inputVal.trim(), levelVal);
              setInputVal("");
            }
          }}
          variant="secondary"
        >
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <AnimatePresence>
          {skills.map((skill, idx) => (
            <motion.div
              key={`${skill.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-primary/10 border border-primary/20"
            >
              <span className="text-sm font-medium">{skill.name}</span>
              <div className="h-4 w-px bg-primary/20" />
              <select 
                value={skill.level}
                onChange={(e) => onUpdateLevel(idx, e.target.value as any)}
                className="bg-transparent text-xs text-muted-foreground outline-none cursor-pointer hover:text-foreground"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ImageUpload({ 
  value, 
  onChange 
}: { 
  value?: string; 
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload an image or PDF.", variant: "destructive" });
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { uploadFile } = await import("@/lib/api");
      const data = await uploadFile(file);
      onChange(data.url);
      // Reset file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({ title: "File uploaded!" });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Could not upload file.";
      toast({ title: "Upload failed", description: errorMsg, variant: "destructive" });
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-2">
      <FormLabel>Event Poster (Image or PDF)</FormLabel>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors hover:bg-primary/5",
          value ? "border-primary/50" : "border-muted-foreground/25"
        )}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*,application/pdf" 
          className="hidden" 
          onChange={handleFile}
        />
        
        {value ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
            {isPdf ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <Briefcase size={48} />
                <span className="text-sm font-bold">PDF Uploaded</span>
              </div>
            ) : (
              <img src={getAssetUrl(value)} alt="Event poster" className="w-full h-full object-cover" />
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-foreground font-medium flex items-center gap-2">
                <Upload size={16} /> Change File
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            {uploading ? (
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2 text-primary" />
            ) : (
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            )}
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload poster"}</p>
            <p className="text-xs opacity-70 mt-1">PNG, JPG, PDF up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Event Type Modal ---

function EventTypeModal({ 
  isOpen, 
  onClose,
  onSelectType,
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: "intra-college" | "outside-college") => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside - force explicit choice
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key - force explicit choice
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>What type of event are you hosting?</DialogTitle>
          <DialogDescription>
            Choose the event type to configure the right participation and visibility settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-6">
          {/* Intra-College Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectType("intra-college")}
            className="relative group flex flex-col gap-3 p-5 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Intra-College Event</p>
                <p className="text-xs text-muted-foreground">For students in your institution</p>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 text-left pl-13">
              <li>• Set department requirements</li>
              <li>• Cross-department access control</li>
              <li>• Require specific skills</li>
            </ul>
          </motion.button>

          {/* Outside-College Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectType("outside-college")}
            className="relative group flex flex-col gap-3 p-5 rounded-xl border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Globe size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Outside-College Event</p>
                <p className="text-xs text-muted-foreground">For external audiences</p>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 text-left pl-13">
              <li>• Open to everyone</li>
              <li>• Add event website link</li>
              <li>• Simple requirements</li>
            </ul>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---

export default function CreatePost() {
  const { user } = useAuth();
  const { createPost, updatePost, posts } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get mode from URL params
  const [match, params] = useRoute("/create-post/:mode");
  const routeMode = params?.mode;
  const normalizedMode = routeMode === "events" ? "event" : routeMode;
  const urlMode = (normalizedMode === "teammate" || normalizedMode === "event")
    ? normalizedMode
    : undefined;
  
  // If no mode in URL, show selection page
  const isSelectionPage = !match || !urlMode;
  
  // FIX #11: Local submission state for form protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle query params for edit
  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get("edit");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Mode is determined by URL
  const activeTab = urlMode || "teammate";

  // Local state for skills since they need custom handling
  const [skillsWanted, setSkillsWanted] = useState<{ name: string; level: any }[]>([]);
  const [skillsOffered, setSkillsOffered] = useState<{ name: string; level: any }[]>([]);
  const [eventType, setEventType] = useState<"intra-college" | "outside-college" | null>(null); // null = show modal
  const [departmentMode, setDepartmentMode] = useState<"all" | "specific">("all");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredInterests, setRequiredInterests] = useState<string[]>([]);
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [maxCrossDeptParticipants, setMaxCrossDeptParticipants] = useState<number | undefined>();
  const [crossDeptRequiresApproval, setCrossDeptRequiresApproval] = useState(true);
  const [isEventTypeModalOpen, setIsEventTypeModalOpen] = useState(false);
  const [isEventOrganiser, setIsEventOrganiser] = useState(false);

  // Handler to select event type and close modal
  const handleSelectEventType = (type: "intra-college" | "outside-college") => {
    setEventType(type);
    setIsEventTypeModalOpen(false);
  };

  const form = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      mode: activeTab,
      title: "",
      description: "",
      city: user?.city || "",
      projectType: "Hackathon",
      hostCollege: "",
      eventWebsite: "",
      eventImage: "",
      eventDate: "",
      specialRequirements: "",
    },
  } as any);
  
  // Type workaround for conditional form fields
  const formControl = (form.control as any);

  useEffect(() => {
    const load = async () => {
      if (!editId) return;
      
      // If not in store, fetch directly from API
      let post = posts.find(p => p.id === editId);
      if (!post) {
        try {
          post = await api.getPost(editId);
        } catch (e) {
          console.error("Failed to load post:", e);
          return;
        }
      }

      if (!post) return;

      setIsEditing(true);

      // Determine mode and redirect if URL doesn't match
      const mode = post.eventName ? "event" : "teammate";
      if (urlMode && urlMode !== mode) {
        setLocation(`/create-post/${mode}?edit=${editId}`);
        return;
      }
      
      // Format eventDate for datetime-local input (YYYY-MM-DDTHH:mm)
      const rawEventDate = (post as any).eventDate;
      const parsedEventDate = rawEventDate ? new Date(rawEventDate) : null;
      const eventDateValue = parsedEventDate && !isNaN(parsedEventDate.getTime())
        ? parsedEventDate.toISOString().slice(0, 16)
        : "";
      
      form.reset({
        mode,
        title: post.title || "",
        description: post.description || "",
        city: post.city || "",
        projectType: (post as any).availability || "Hackathon",
        eventType: (post as any).eventType || "intra-college",
        hostCollege: (post as any).hostCollege || "",
        eventWebsite: (post as any).eventWebsite || "",
        eventImage: (post as any).eventImage || "",
        eventDate: eventDateValue,

        requiredSkills: (post as any).requiredSkills || [],
        requiredInterests: (post as any).requiredInterests || [],
        specialRequirements: (post as any).specialRequirements || "",
        maxCrossDeptParticipants: typeof (post as any).maxCrossDeptParticipants === "number"
          ? (post as any).maxCrossDeptParticipants
          : undefined,
        crossDeptRequiresApproval: (post as any).crossDeptRequiresApproval ?? true,
      });
      setEventType((post as any).eventType || "intra-college");
      const allowedDepartments = Array.isArray((post as any).allowedDepartments)
        ? (post as any).allowedDepartments as string[]
        : [];
      setSelectedDepartments(allowedDepartments);
      setDepartmentMode(allowedDepartments.length > 0 ? "specific" : "all");
      setRequiredSkills((post as any).requiredSkills || []);
      setRequiredInterests((post as any).requiredInterests || []);
      setSpecialRequirements((post as any).specialRequirements || "");

      setMaxCrossDeptParticipants(
        typeof (post as any).maxCrossDeptParticipants === "number"
          ? (post as any).maxCrossDeptParticipants
          : undefined
      );
      setCrossDeptRequiresApproval((post as any).crossDeptRequiresApproval ?? true);
      setIsEventOrganiser((post as any).isEventOrganiser ?? false);

      // Prefill skills if available
      if ((post as any).skillsWanted) setSkillsWanted((post as any).skillsWanted || []);
      if ((post as any).skillsOffered) setSkillsOffered((post as any).skillsOffered || []);
    };

    load();
  }, [editId, posts]); // FIX: Include posts in dependencies to detect external updates

  // Reset form on initial page load if not editing
  useEffect(() => {
    if (!editId && !isEditing && urlMode) {
      form.reset({
        mode: urlMode,
        title: "",
        description: "",
        city: user?.city || "",
        projectType: "Hackathon",
        hostCollege: "",
        eventWebsite: "",
        eventImage: "",
        eventDate: "",
        specialRequirements: "",
      });
      setSkillsWanted([]);
      setSkillsOffered([]);
      setEventType(null);
      setRequiredSkills([]);
      setRequiredInterests([]);
      setSpecialRequirements("");
      setSelectedDepartments([]);
      setDepartmentMode("all");

      setMaxCrossDeptParticipants(undefined);
      setCrossDeptRequiresApproval(true);
      setIsEventOrganiser(false);
      setSkillInput("");
      setInterestInput("");
    }
  }, [urlMode]); // Run when URL mode changes

  // CRITICAL: Ensure modal ALWAYS shows when on event mode without event type selected
  useEffect(() => {
    if (!isEditing && activeTab === "event" && eventType === null) {
      // Force modal to open - don't check isEventTypeModalOpen, just set it
      setIsEventTypeModalOpen(true);
    }
  }, [isEditing, activeTab, eventType]);

  const onSubmit = async (data: PostFormValues) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // CRITICAL: Validate event type is selected (should never happen due to modal, but belt-and-suspenders)
      if (activeTab === "event" && !eventType) {
        toast({ title: "Error", description: "Please select an event type (intra-college or outside-college)", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      // Validate eventDate for events
      if (activeTab === "event" && !data.eventDate) {
        toast({ title: "Error", description: "Event date is required", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      // Validate hostCollege for intra-college events
      if (activeTab === "event" && eventType === "intra-college" && !data.hostCollege) {
        toast({ title: "Error", description: "Host college is required for intra-college events", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      
      // Validate eventDate is a valid date
      if (activeTab === "event" && data.eventDate) {
        const eventDateObj = new Date(data.eventDate);
        if (isNaN(eventDateObj.getTime())) {
          toast({ title: "Error", description: "Invalid event date", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        
        // Validate event date is in the future
        if (isNaN(eventDateObj.getTime()) || eventDateObj <= new Date()) {
          toast({ title: "Error", description: "Event date must be a valid future date", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      // Validate department selection for intra-college events
      if (activeTab === "event" && eventType === "intra-college" && departmentMode === "specific") {
        if (selectedDepartments.length === 0) {
          toast({ title: "Error", description: "Please select at least 1 department", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        if (selectedDepartments.length > 10) {
          toast({ title: "Error", description: "You can select maximum 10 departments", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      const normalizedSelectedDepartments = selectedDepartments
        .map((dept) => dept.trim())
        .filter((dept) => dept.length > 0);
      const allowedDepartmentsPayload =
        activeTab === "event" && eventType === "intra-college" && departmentMode === "specific"
          ? normalizedSelectedDepartments
          : null;
      const normalizedSpecialRequirements = specialRequirements.trim();
      const effectiveIsEventOrganiser = isEventOrganiser || normalizedSpecialRequirements.length > 0;

      if (isEditing && editId) {
        await updatePost(editId, {
          title: data.title,
          description: data.description,
          city: data.city,
          availability: activeTab === "teammate" ? (data.projectType || "Hackathon") : "Event",
          skillsWanted: activeTab === "teammate" ? skillsWanted : [],
          skillsOffered: activeTab === "teammate" ? skillsOffered : [],
          eventName: activeTab === "event" ? data.title : null,
          eventType: activeTab === "event" ? eventType : null,
          hostCollege: activeTab === "event" && eventType === "intra-college" ? (data.hostCollege || null) : null,
          eventWebsite: activeTab === "event" ? (data.eventWebsite || null) : null,
          eventImage: activeTab === "event" ? (data.eventImage || null) : null,
          eventDetails: activeTab === "event" ? data.description : null,
          eventDate: activeTab === "event" && data.eventDate && !isNaN(new Date(data.eventDate).getTime()) ? (new Date(data.eventDate).toISOString() as any) : undefined,
          allowedDepartments: allowedDepartmentsPayload,
          requiredSkills: activeTab === "event" && eventType === "intra-college" ? requiredSkills : [],
          requiredInterests: activeTab === "event" && eventType === "intra-college" ? requiredInterests : [],
          specialRequirements: activeTab === "event" && eventType === "intra-college" && effectiveIsEventOrganiser ? (normalizedSpecialRequirements || null) : null,
          maxCrossDeptParticipants: activeTab === "event" && eventType === "intra-college" ? maxCrossDeptParticipants : null,
          crossDeptRequiresApproval: activeTab === "event" && eventType === "intra-college" ? crossDeptRequiresApproval : undefined,
          isEventOrganiser: activeTab === "event" && eventType === "intra-college" ? effectiveIsEventOrganiser : undefined,
        });
      } else {
        const payloadForCreatePost = {
          title: data.title,
          description: data.description,
          city: data.city,
          availability: activeTab === "teammate" ? (data.projectType || "Hackathon") : "Event",
          skillsWanted: activeTab === "teammate" ? skillsWanted : [],
          skillsOffered: activeTab === "teammate" ? skillsOffered : [],
          eventName: activeTab === "event" ? data.title : null,
          eventType: activeTab === "event" ? eventType : null,
          hostCollege: activeTab === "event" && eventType === "intra-college" ? (data.hostCollege || null) : null,
          eventWebsite: activeTab === "event" ? (data.eventWebsite || null) : null,
          eventImage: activeTab === "event" ? (data.eventImage || null) : null,
          eventDetails: activeTab === "event" ? data.description : null,
          eventDate: activeTab === "event" && data.eventDate && !isNaN(new Date(data.eventDate).getTime()) ? (new Date(data.eventDate).toISOString() as any) : undefined,
          allowedDepartments: allowedDepartmentsPayload,
          requiredSkills: activeTab === "event" && eventType === "intra-college" ? requiredSkills : [],
          requiredInterests: activeTab === "event" && eventType === "intra-college" ? requiredInterests : [],
          specialRequirements: activeTab === "event" && eventType === "intra-college" && effectiveIsEventOrganiser ? (normalizedSpecialRequirements || null) : null,
          maxCrossDeptParticipants: activeTab === "event" && eventType === "intra-college" ? maxCrossDeptParticipants : undefined,
          crossDeptRequiresApproval: activeTab === "event" && eventType === "intra-college" ? crossDeptRequiresApproval : undefined,
          isEventOrganiser: activeTab === "event" && eventType === "intra-college" ? effectiveIsEventOrganiser : undefined,
          university: user.university || null,
        };
        
        // DEBUG: Log the approval settings
        if (activeTab === "event" && eventType === "intra-college" && effectiveIsEventOrganiser) {
          console.log("DEBUG: Organiser Event Submission", {
            isEventOrganiser: effectiveIsEventOrganiser,
            crossDeptRequiresApproval: crossDeptRequiresApproval,
            shouldRequireApproval: crossDeptRequiresApproval
          });
        }
        
        await createPost(payloadForCreatePost, {
          id: user.id,
          name: user.name,
          skills: Array.isArray(user.skills) ? user.skills : []
        });
      }

      setLocation("/my-posts");
      toast({
        title: isEditing ? "Post Updated" : (activeTab === "teammate" ? "Project Posted" : "Event Created"),
        description: isEditing ? "Your post has been updated." : "Your post is now live!",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Error",
        description: isEditing ? `Failed to update post. ${message}` : `Failed to create post. ${message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit: SubmitErrorHandler<PostFormValues> = (errors) => {
    const firstErrorKey = Object.keys(errors)[0];
    const fieldLabels: Record<string, string> = {
      title: activeTab === "teammate" ? "Project Title" : "Event Name",
      description: "Description",
      city: "Location",
      projectType: "Project Type",
      hostCollege: "Host College",
      eventWebsite: "Event Website",
      eventDate: "Event Date",
      maxCrossDeptParticipants: "Max Cross-Dept Participants",
    };
    const firstError = firstErrorKey ? errors[firstErrorKey as keyof typeof errors] : undefined;
    const errorMessage = firstError && typeof firstError === "object" && "message" in firstError
      ? String((firstError as { message?: unknown }).message ?? "")
      : "";
    const label = firstErrorKey ? (fieldLabels[firstErrorKey] || firstErrorKey) : "the highlighted fields";

    toast({
      title: "Form incomplete",
      description: errorMessage ? `${label}: ${errorMessage}` : `Please fix ${label} before saving.`,
      variant: "destructive",
    });

    if (firstErrorKey && ["title", "description", "city", "projectType", "hostCollege", "eventWebsite", "eventDate"].includes(firstErrorKey)) {
      form.setFocus(firstErrorKey as "title" | "description" | "city" | "projectType" | "hostCollege" | "eventWebsite" | "eventDate");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isSelectionPage ? (
        /* SELECTION PAGE - Choose between Teammate or Event */
        <div className="flex flex-col gap-8">
          <div>
            <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="gap-2">
              <ArrowLeft size={16} />
              Back To Home
            </Button>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-4xl font-display font-bold">Create Post</h1>
            <p className="text-muted-foreground text-lg">What would you like to create?</p>
          </div>

          {/* Two Big Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Find Teammate Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card 
                className="cursor-pointer h-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                onClick={() => setLocation("/create-post/teammate")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <Briefcase size={40} className="text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-display font-bold">Find Teammate</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Looking for collaborators? Post your project idea and connect with skilled teammates for hackathons, research, or personal projects.
                    </p>
                  </div>
                  <Button size="lg" className="w-full mt-2 text-white">
                    Find A Teammate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Post Event Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card 
                className="cursor-pointer h-full bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10"
                onClick={() => setLocation("/create-post/event")}
              >
                <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Calendar size={40} className="text-orange-500" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-display font-bold">Post Event</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Organizing a hackathon, workshop, or competition? Create an event listing to attract participants and spread the word.
                    </p>
                  </div>
                  <Button size="lg" className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                    Create Event Post
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      ) : (
        /* FORM PAGE - Show actual create/edit form */
        <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold">{isEditing ? "Edit Post" : activeTab === "teammate" ? "Find A Teammate" : "Create Event Post"}</h1>
          <p className="text-muted-foreground">{isEditing ? "Update your listing details." : activeTab === "teammate" ? "Share your project idea and find teammates." : "Create an event listing to attract participants."}</p>
        </div>

        {/* Form Card - Hidden when event type modal is open */}
        {!isEventTypeModalOpen && (
          <Card className="glass-card border-border overflow-hidden">
            <CardContent className="p-8">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any, handleInvalidSubmit)} className="space-y-8">
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Common Field: Title */}
                    <FormField
                      control={formControl}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{activeTab === "teammate" ? "Project Title" : "Event Name"}</FormLabel>
                          <FormControl>
                            <Input placeholder={activeTab === "teammate" ? "e.g. AI-Powered Study Assistant" : "e.g. Global Hackathon 2024"} {...field} className="bg-muted/50 border-input font-medium text-lg text-foreground" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Common Field: Description */}
                     <FormField
                      control={formControl}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Description <span className="text-xs font-normal text-muted-foreground ml-1">({field.value.length}/500)</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={activeTab === "teammate" ? "Describe your project and who you're looking for..." : "Event details, schedule, and what to expect..."} 
                              {...field} 
                              maxLength={500}
                              className="min-h-[120px] bg-muted/50 border-input resize-none text-foreground" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Common Field: Location */}
                    <FormField
                      control={formControl}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, Venue, or 'Remote'" {...field} className="bg-muted/50 border-input font-medium text-foreground" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* TEAMMATE MODE SPECIFIC */}
                    {activeTab === "teammate" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <FormField
                              control={formControl}
                              name="projectType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-muted/50 border-input">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Hackathon">Hackathon</SelectItem>
                                      <SelectItem value="Competition">Competition</SelectItem>
                                      <SelectItem value="Event Project">Event Project</SelectItem>
                                      <SelectItem value="Short Term Project">Short Term Project</SelectItem>
                                      <SelectItem value="Long Term/Startup">Long Term / Startup</SelectItem>
                                      <SelectItem value="Coursework">Coursework</SelectItem>
                                      <SelectItem value="Guidance">Guidance/Mentorship</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
                          <SkillInput 
                            label="Skills Searching For" 
                            placeholder="e.g. React, Python"
                            skills={skillsWanted}
                            onAdd={(name, level) => setSkillsWanted([...skillsWanted, { name, level }])}
                            onRemove={(idx) => setSkillsWanted(skillsWanted.filter((_, i) => i !== idx))}
                            onUpdateLevel={(idx, level) => {
                              const newSkills = [...skillsWanted];
                              newSkills[idx].level = level;
                              setSkillsWanted(newSkills);
                            }}
                          />
                          
                          <SkillInput 
                            label="Skills I Have" 
                            placeholder="e.g. Design, Marketing"
                            skills={skillsOffered}
                            onAdd={(name, level) => setSkillsOffered([...skillsOffered, { name, level }])}
                            onRemove={(idx) => setSkillsOffered(skillsOffered.filter((_, i) => i !== idx))}
                            onUpdateLevel={(idx, level) => {
                              const newSkills = [...skillsOffered];
                              newSkills[idx].level = level;
                              setSkillsOffered(newSkills);
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* EVENT MODE SPECIFIC */}
                    {activeTab === "event" && (
                      <>
                        {/* Event Type Selector - Only show when editing */}
                        {isEditing && (
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                            <div>
                              <FormLabel className="text-base font-semibold mb-3 block">Event Type</FormLabel>
                              <div className="grid grid-cols-2 gap-3">
                                <motion.button
                                  type="button"
                                  onClick={() => setEventType("intra-college")}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all font-semibold text-sm",
                                    eventType === "intra-college"
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
                                  )}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  🏫 Intra-College
                                </motion.button>
                                <motion.button
                                  type="button"
                                  onClick={() => setEventType("outside-college")}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all font-semibold text-sm",
                                    eventType === "outside-college"
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
                                  )}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  🌍 Outside-College
                                </motion.button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {eventType === "intra-college"
                                  ? "Cross-department students can apply with skill matching."
                                  : "Open to all students without department restrictions."}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {eventType === "intra-college" && (
                             <FormField
                               control={formControl}
                               name="hostCollege"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel className="flex items-center gap-2">
                                     <Building2 size={16} className="text-primary" />
                                     Host College <span className="text-destructive">*</span>
                                   </FormLabel>
                                   <Select onValueChange={field.onChange} value={field.value}>
                                     <FormControl>
                                       <SelectTrigger className="bg-muted/50 border-input">
                                         <SelectValue placeholder="Select host college" />
                                       </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                        {COLLEGES.map((college) => (
                                          <SelectItem key={college} value={college}>
                                            {college}
                                          </SelectItem>
                                        ))}
                                     </SelectContent>
                                   </Select>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                           )}

                           <FormField
                              control={formControl}
                              name="eventWebsite"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Event Website (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com" {...field} className="bg-muted/50 border-input" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                           <FormField
                              control={formControl}
                              name="eventDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Calendar size={16} className="text-primary" />
                                    Event Date <span className="text-destructive">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="datetime-local"
                                      {...field}
                                      value={field.value || ""}
                                      className="bg-muted/50 border-input font-medium text-foreground"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-xs text-muted-foreground mt-1">Event must be in the future</p>
                                </FormItem>
                              )}
                            />
                        </div>

                        <div className="pt-2">
                           <FormField
                              control={formControl}
                              name="eventImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <ImageUpload value={field.value} onChange={field.onChange} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                        {/* Conditional: Cross-Department Fields (Intra-College Only) */}
                        <AnimatePresence>
                          {eventType === "intra-college" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-6 pt-6 border-t border-border"
                            >
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                                  Intra-College Event Settings
                                </h3>
                              </div>

                              {/* Event Organiser Selection - Only available for users with isOrganiser role */}
                              <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                                <FormLabel className="text-base font-semibold">Are you the event organiser?</FormLabel>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {user?.isOrganiser 
                                    ? "Organisers can collect registrations, manage participants, and access the Organiser Dashboard with analytics."
                                    : "Only users with event organiser privileges can host and manage events. You can still post events for everyone to see."}
                                </p>
                                <div className="flex gap-4">
                                  <label className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all",
                                    user?.isOrganiser ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-50",
                                  )}
                                    style={{
                                      borderColor: isEventOrganiser && user?.isOrganiser ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                      backgroundColor: isEventOrganiser && user?.isOrganiser ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      checked={isEventOrganiser}
                                      onChange={() => user?.isOrganiser && setIsEventOrganiser(true)}
                                      disabled={!user?.isOrganiser}
                                      className="w-4 h-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                                    />
                                    <span className="text-sm font-medium">Yes, I'm the organiser</span>
                                  </label>
                                  <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border-2 transition-all hover:border-primary/50"
                                    style={{
                                      borderColor: !isEventOrganiser ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                      backgroundColor: !isEventOrganiser ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      checked={!isEventOrganiser}
                                      onChange={() => setIsEventOrganiser(false)}
                                      className="w-4 h-4 cursor-pointer accent-primary"
                                    />
                                    <span className="text-sm font-medium">No, I'm not the organiser</span>
                                  </label>
                                </div>
                              </div>

                              {/* Cross-Department Settings */}
                              <div className="space-y-3 pt-4 border-t border-border">
                                <p className="text-sm font-semibold mb-2">Department Access</p>
                                <p className="text-sm text-muted-foreground mb-4">Control which departments can participate in this event.</p>
                              </div>

                              {/* Department Selection Mode */}
                              <div className="space-y-3">
                                <FormLabel>Department Access</FormLabel>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      checked={departmentMode === "all"}
                                      onChange={() => {
                                        setDepartmentMode("all");
                                        setSelectedDepartments([]);
                                      }}
                                      className="w-4 h-4 cursor-pointer accent-primary"
                                    />
                                    <span className="text-sm font-medium">Open to All Departments</span>
                                  </label>
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      checked={departmentMode === "specific"}
                                      onChange={() => setDepartmentMode("specific")}
                                      className="w-4 h-4 cursor-pointer accent-primary"
                                    />
                                    <span className="text-sm font-medium">Specific Departments Only</span>
                                  </label>
                                </div>

                                {/* Department Multi-Select */}
                                {departmentMode === "specific" && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                  >
                                    <p className="text-xs text-muted-foreground">Select 1-10 departments (minimum 1 required)</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {DEPARTMENTS.filter(dept => dept !== "OTHER").map((dept) => (
                                        <label
                                          key={dept}
                                          className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                            selectedDepartments.includes(dept)
                                              ? "bg-primary/10 border-primary text-primary font-medium"
                                              : "bg-muted/30 border-border hover:border-primary/50"
                                          )}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedDepartments.includes(dept)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                if (selectedDepartments.length < 10) {
                                                  setSelectedDepartments([...selectedDepartments, dept]);
                                                } else {
                                                  toast({
                                                    title: "Maximum Reached",
                                                    description: "You can select up to 10 departments only.",
                                                    variant: "destructive"
                                                  });
                                                }
                                              } else {
                                                setSelectedDepartments(selectedDepartments.filter(d => d !== dept));
                                              }
                                            }}
                                            className="w-4 h-4 cursor-pointer accent-primary"
                                          />
                                          <span className="text-sm">{dept}</span>
                                        </label>
                                      ))}
                                    </div>
                                    {selectedDepartments.length > 0 && (
                                      <p className="text-xs text-primary">
                                        {selectedDepartments.length} department{selectedDepartments.length > 1 ? 's' : ''} selected
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </div>

                              {/* Required Skills with Autocomplete */}
                              <div className="space-y-2">
                                <FormLabel>Required Skills (Optional)</FormLabel>
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Input
                                      placeholder="Type to search skills... (Press Enter to add)"
                                      value={skillInput}
                                      onChange={(e) => setSkillInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          const value = skillInput.trim();
                                          if (value && SKILLS.includes(value as any)) {
                                            if (!requiredSkills.includes(value)) {
                                              setRequiredSkills([...requiredSkills, value]);
                                              setSkillInput("");
                                            } else {
                                              toast({ title: "Already Added", description: "This skill is already in the list.", variant: "destructive" });
                                            }
                                          } else if (value) {
                                            toast({ title: "Invalid Skill", description: "Please select a skill from the suggestions.", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      list="skills-datalist-cross"
                                      className="bg-muted/50 border-input"
                                    />
                                    <datalist id="skills-datalist-cross">
                                      {SKILLS.filter(s => !requiredSkills.includes(s)).map(skill => (
                                        <option key={skill} value={skill} />
                                      ))}
                                    </datalist>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {requiredSkills.map((skill, idx) => (
                                      <motion.div
                                        key={`skill-${idx}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-primary/10 border border-primary/20"
                                      >
                                        <span className="text-sm font-medium">{skill}</span>
                                        <button
                                          type="button"
                                          onClick={() => setRequiredSkills(requiredSkills.filter((_, i) => i !== idx))}
                                          className="p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                          <X size={14} />
                                        </button>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Required Interests with Autocomplete */}
                              <div className="space-y-2">
                                <FormLabel>Required Interests (Optional)</FormLabel>
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Input
                                      placeholder="Type to search interests... (Press Enter to add)"
                                      value={interestInput}
                                      onChange={(e) => setInterestInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          const value = interestInput.trim();
                                          if (value && SKILLS.includes(value as any)) {
                                            if (!requiredInterests.includes(value)) {
                                              setRequiredInterests([...requiredInterests, value]);
                                              setInterestInput("");
                                            } else {
                                              toast({ title: "Already Added", description: "This interest is already in the list.", variant: "destructive" });
                                            }
                                          } else if (value) {
                                            toast({ title: "Invalid Interest", description: "Please select an interest from the suggestions.", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      list="interests-datalist-cross"
                                      className="bg-muted/50 border-input"
                                    />
                                    <datalist id="interests-datalist-cross">
                                      {SKILLS.filter(s => !requiredInterests.includes(s)).map(interest => (
                                        <option key={interest} value={interest} />
                                      ))}
                                    </datalist>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {requiredInterests.map((interest, idx) => (
                                      <motion.div
                                        key={`interest-${idx}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-accent/10 border border-accent/20"
                                      >
                                        <span className="text-sm font-medium">{interest}</span>
                                        <button
                                          type="button"
                                          onClick={() => setRequiredInterests(requiredInterests.filter((_, i) => i !== idx))}
                                          className="p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                          <X size={14} />
                                        </button>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Participant Cap */}
                              {user?.isOrganiser && isEventOrganiser && (
                                <div className="space-y-2">
                                  <FormLabel>Special Requirements (Optional)</FormLabel>
                                  <Textarea
                                    placeholder="Any special conditions participants should know before registering..."
                                    value={specialRequirements}
                                    onChange={(e) => setSpecialRequirements(e.target.value.slice(0, 250))}
                                    maxLength={250}
                                    className="min-h-[100px] bg-muted/50 border-input resize-none"
                                  />
                                  <p className="text-xs text-muted-foreground text-right">
                                    {specialRequirements.length}/250
                                  </p>
                                </div>
                              )}

                              {/* Participant Cap */}
                              <FormItem>
                                <FormLabel>Max Cross-Dept Participants (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="Leave empty for unlimited"
                                        value={maxCrossDeptParticipants || ""}
                                        onChange={(e) => {
                                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                          setMaxCrossDeptParticipants(val !== undefined && !isNaN(val) ? val : undefined);
                                        }}
                                        className="bg-muted/50 border-input"
                                      />
                                    </FormControl>
                                  </FormItem>

                                  {/* Approval Toggle - Only for organisers */}
                                  {user?.isOrganiser && isEventOrganiser && (
                                    <div className="flex items-center gap-4">
                                      <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={crossDeptRequiresApproval}
                                          onChange={(e) => setCrossDeptRequiresApproval(e.target.checked)}
                                          className="w-5 h-5 rounded border-input cursor-pointer accent-primary"
                                        />
                                        <span className="text-sm font-medium">
                                          Require my approval for joining the event/participating in the event
                                        </span>
                                      </label>
                                    </div>
                                  )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}

                  </motion.div>
                </AnimatePresence>

                <div className="relative z-20 flex justify-end gap-4 pt-6 mt-6 border-t border-border bg-card/95">
                  <Button type="button" variant="ghost" onClick={() => setLocation("/my-posts")}>Cancel</Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit as any, handleInvalidSubmit)}
                    className="relative z-30 pointer-events-auto font-bold px-8 shadow-lg shadow-primary/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? "Save Changes" : (activeTab === "teammate" ? "Post" : "Post Event"))}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
        )}

        {/* Event Type Modal */}
        <EventTypeModal 
          isOpen={isEventTypeModalOpen} 
          onClose={() => {
            // If user closes modal without selecting, redirect back to selection page
            setIsEventTypeModalOpen(false);
            setLocation("/create-post");
          }}
          onSelectType={handleSelectEventType}
        />
        </div>
      )}
    </div>
  );
}
