import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Calendar,
  MapPin,
  AlertCircle,
  UserCheck,
  UserX,
  ArrowLeft,
  BarChart3,
  Download,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface Registration {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
    skills: string[];
    interests: string[];
    avatar?: string;
    university?: string | null;
    city?: string | null;
  };
  registrationType: "department" | "cross_department";
  matchScore: number | null;
  status: "pending" | "approved" | "rejected" | "confirmed";
  rejectionReason?: string;
  createdAt: string;
}

interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  confirmed: number;
  crossDept: number;
  department: number;
}

interface DashboardAnalytics {
  approvalRate: number;
  rejectionRate: number;
  pendingRate: number;
  crossDeptRate: number;
  pendingOlderThan48h: number;
  averageMatchScore: number;
  highMatchPending: number;
  uniqueApplicants: number;
  scoreBuckets: {
    strong: number;
    medium: number;
    low: number;
  };
  topDepartments: Array<{ label: string; count: number }>;
  topColleges: Array<{ label: string; count: number }>;
  topSkills: Array<{ label: string; count: number }>;
  registrationsByDay: Array<{ label: string; count: number }>;
  interestSignals?: {
    interestedCount: number;
    notInterestedCount: number;
    interestedUsers: Array<{
      userId: string;
      name: string;
      email: string;
      department: string;
      avatar?: string | null;
      createdAt: string;
    }>;
    notInterestedUsers: Array<{
      userId: string;
      name: string;
      email: string;
      department: string;
      avatar?: string | null;
      createdAt: string;
    }>;
  };
}

export default function OrganizerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<DashboardAnalytics | null>(null);
  const [pendingCountMap, setPendingCountMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectMode, setRejectMode] = useState<"single" | "all">("single");

  // Check if user is organiser or admin
  const isOrganiser = user?.isOrganiser || user?.isAdmin;

  const loadEventDetails = useCallback(async (eventId: string) => {
    try {
      setSelectedEventId(eventId);
      const data = await api.getOrganizerDashboard(eventId);
      setEvent(data.event);
      setRegistrations(data.registrations || []);
      setStats(data.stats || null);
      setDashboardAnalytics(data.analytics || null);
      const pending = (data.stats as RegistrationStats | null)?.pending ?? 0;
      setPendingCountMap((prev) => ({ ...prev, [eventId]: pending }));
    } catch (error: any) {
      console.error("Failed to load event details:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load event data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getOrganizerEvents();
      setEvents(response);
      if (response.length > 0) {
        loadEventDetails(response[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load events:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to load events.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadEventDetails, toast]);

  useEffect(() => {
    if (!isOrganiser) {
      toast({
        title: "Access Denied",
        description: "Only organisers can access this dashboard.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    loadEvents();
  }, [isOrganiser, loadEvents, toast, setLocation]);



  const handleApprove = async (registrationId: string) => {
    try {
      await api.approveEventRegistration(selectedEventId!, registrationId);
      toast({
        title: "Approved",
        description: "Registration has been approved successfully.",
      });
      loadEventDetails(selectedEventId!);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to approve registration.",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    if (!selectedEventId) return;
    if (!window.confirm("Are you sure you want to approve ALL pending registrations for this event?")) {
      return;
    }
    try {
      const result = await api.approveAllEventRegistrations(selectedEventId);
      toast({
        title: "Bulk approval complete",
        description: `Approved ${result?.approvedCount ?? 0} registration(s)${result?.skippedCount ? `, skipped ${result.skippedCount} (capacity)` : ""}.`,
      });
      loadEventDetails(selectedEventId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to approve all pending registrations.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (rejectMode === "single" && !selectedRegistration) {
      toast({
        title: "Error",
        description: "No registration selected.",
        variant: "destructive",
      });
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    const confirmMessage = rejectMode === "all"
      ? "Are you sure you want to reject ALL pending registrations for this event?"
      : "Are you sure you want to reject this registration?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (rejectMode === "all") {
        const result = await api.rejectAllEventRegistrations(selectedEventId!, rejectionReason);
        toast({
          title: "Rejected",
          description: `${result?.rejectedCount ?? 0} pending registration(s) rejected.`,
        });
      } else {
        await api.rejectEventRegistration(selectedEventId!, selectedRegistration!.id, rejectionReason);
        toast({
          title: "Rejected",
          description: "Registration has been rejected.",
        });
      }
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRegistration(null);
      setRejectMode("single");
      loadEventDetails(selectedEventId!);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to reject registration.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!selectedEventId) return;
    if (!window.confirm("Are you sure you want to remove this user from the event registrations?")) {
      return;
    }

    try {
      await api.deleteEventRegistration(selectedEventId, registrationId);
      toast({
        title: "Removed",
        description: "User registration has been removed.",
      });
      loadEventDetails(selectedEventId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to remove registration.",
        variant: "destructive",
      });
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "pending") return reg.status === "pending";
    if (selectedTab === "approved") return reg.status === "approved" || reg.status === "confirmed";
    if (selectedTab === "rejected") return reg.status === "rejected";
    if (selectedTab === "cross-dept") return reg.registrationType === "cross_department";
    if (selectedTab === "shortlist") return reg.status === "pending" && reg.matchScore !== null && reg.matchScore >= 75;
    return true;
  });

  const shortlistRegistrations = useMemo(() => {
    return registrations
      .filter((reg) => reg.status === "pending" && reg.matchScore !== null && reg.matchScore >= 75)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }, [registrations]);

  const handleExportCsv = () => {
    if (!event || registrations.length === 0) {
      toast({
        title: "No data to export",
        description: "This event has no registrations yet.",
        variant: "destructive",
      });
      return;
    }

    const escapeCsv = (value: unknown) => {
      const stringValue = value === null || value === undefined ? "" : String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((reg) => {
      const registrationUser = reg.user ?? {
        id: "unknown",
        name: "Unknown User",
        email: "N/A",
        department: "N/A",
        skills: [] as string[],
        interests: [] as string[],
        avatar: undefined,
      };

      return [
      reg.id,
      registrationUser.name,
      registrationUser.email,
      registrationUser.department,
      reg.registrationType,
      reg.status,
      reg.matchScore ?? "",
      reg.createdAt,
      registrationUser.skills?.join(" | ") ?? "",
      registrationUser.interests?.join(" | ") ?? "",
      reg.rejectionReason ?? "",
    ];
    });

    const csv = [
      [
        "Registration ID",
        "Name",
        "Email",
        "Department",
        "Type",
        "Status",
        "Match Score",
        "Applied At",
        "Skills",
        "Interests",
        "Rejection Reason",
      ],
      ...rows,
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeEventName = (event.eventName || "event").replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase();
    link.href = url;
    link.download = `${safeEventName}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported successfully",
      description: "Registration report downloaded as CSV.",
    });
  };

  const analytics = useMemo(() => {
    if (dashboardAnalytics) {
      return {
        total: stats?.total ?? registrations.length,
        approvalRate: dashboardAnalytics.approvalRate,
        rejectionRate: dashboardAnalytics.rejectionRate,
        pendingRate: dashboardAnalytics.pendingRate,
        crossDeptRate: dashboardAnalytics.crossDeptRate,
        pendingOlderThan48h: dashboardAnalytics.pendingOlderThan48h,
        avgMatchScore: dashboardAnalytics.averageMatchScore,
        highMatchPending: dashboardAnalytics.highMatchPending,
        scoreBuckets: dashboardAnalytics.scoreBuckets,
        uniqueApplicants: dashboardAnalytics.uniqueApplicants,
        topDepartments: dashboardAnalytics.topDepartments,
        topColleges: dashboardAnalytics.topColleges,
        topSkills: dashboardAnalytics.topSkills,
        registrationsByDay: dashboardAnalytics.registrationsByDay,
        interestSignals: dashboardAnalytics.interestSignals || {
          interestedCount: 0,
          notInterestedCount: 0,
          interestedUsers: [],
          notInterestedUsers: [],
        },
      };
    }

    const total = stats?.total ?? registrations.length;
    const approvedCount = (stats?.approved || 0) + (stats?.confirmed || 0);
    const pendingCount = stats?.pending || 0;
    const rejectedCount = stats?.rejected || 0;
    const crossDeptCount = stats?.crossDept || 0;

    const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejectedCount / total) * 100) : 0;
    const pendingRate = total > 0 ? Math.round((pendingCount / total) * 100) : 0;
    const crossDeptRate = total > 0 ? Math.round((crossDeptCount / total) * 100) : 0;

    const pendingOlderThan48h = registrations.filter((r) => {
      if (r.status !== "pending") return false;
      const created = new Date(r.createdAt).getTime();
      const now = Date.now();
      return now - created > 48 * 60 * 60 * 1000;
    }).length;

    const scored = registrations.filter((r) => r.matchScore !== null).map((r) => r.matchScore as number);
    const avgMatchScore = scored.length > 0 ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length) : 0;
    const highMatchPending = registrations.filter(
      (r) => r.status === "pending" && r.matchScore !== null && (r.matchScore as number) >= 75
    ).length;

    const scoreBuckets = {
      strong: scored.filter((s) => s >= 80).length,
      medium: scored.filter((s) => s >= 60 && s < 80).length,
      low: scored.filter((s) => s < 60).length,
    };

    return {
      total,
      approvalRate,
      rejectionRate,
      pendingRate,
      crossDeptRate,
      pendingOlderThan48h,
      avgMatchScore,
      highMatchPending,
      scoreBuckets,
      uniqueApplicants: new Set(registrations.map((registration) => registration.user?.id || registration.id)).size,
      topDepartments: [],
      topColleges: [],
      topSkills: [],
      registrationsByDay: [],
      interestSignals: {
        interestedCount: 0,
        notInterestedCount: 0,
        interestedUsers: [],
        notInterestedUsers: [],
      },
    };
  }, [dashboardAnalytics, registrations, stats]);

  const interestedSignals = analytics.interestSignals?.interestedUsers || [];
  const notInterestedSignals = analytics.interestSignals?.notInterestedUsers || [];
  const isInterestTab = selectedTab === "interested" || selectedTab === "not-interested";
  const selectedSignals = selectedTab === "interested" ? interestedSignals : notInterestedSignals;

  if (!isOrganiser) {
    return (
      <div className="min-h-screen abstract-bg pt-24">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You do not have permission to access this dashboard. Only organisers and admins can view this page.</p>
            <Button onClick={() => setLocation("/")} variant="default">
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen abstract-bg pt-24">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Events list view if no event selected or no events exist
  if (events.length === 0) {
    return (
      <div className="min-h-screen abstract-bg pt-24">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Events Yet</h2>
            <p className="text-muted-foreground mb-4">You haven't created any events yet.</p>
            <Button onClick={() => setLocation("/create-post/event")} variant="default">
              Create Your First Event
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show events list or single event details
  return (
    <div className="min-h-screen abstract-bg pb-20 pt-24">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Header with back navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/my-posts")}
            className="mb-4 hover:bg-primary/5"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to Posts
          </Button>
        </div>

        {/* Two-column layout: Events list on left, details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Events List */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Your Events ({events.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.map((evt) => (
                  <motion.button
                    key={evt.id}
                    onClick={() => loadEventDetails(evt.id)}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedEventId === evt.id
                        ? "bg-primary/20 border-primary"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-sm line-clamp-2">{evt.eventName}</div>
                      {pendingCountMap[evt.id] > 0 && (
                        <Badge className="shrink-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] px-1.5 py-0.5">
                          {pendingCountMap[evt.id]}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {evt.eventDate && !isNaN(new Date(evt.eventDate).getTime())
                        ? new Date(evt.eventDate).toLocaleDateString()
                        : "Date TBA"}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Event Details */}
          <div className="lg:col-span-3">
            {event ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-display font-bold mb-2">{event.eventName}</h1>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          {event.eventDate && !isNaN(new Date(event.eventDate).getTime())
                            ? new Date(event.eventDate).toLocaleDateString()
                            : "Date TBA"}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          {event.city || "Remote"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={cn(
                          "font-semibold",
                          event.eventType === "intra-college"
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                            : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {event.eventType === "intra-college" ? "🏫 Intra-College" : "🌍 Outside-College"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={handleExportCsv} className="gap-2">
                        <Download size={14} /> Export CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats Overview */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.department} dept-only · {stats.crossDept} cross-dept
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Pending
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Approved
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                          {stats.approved + stats.confirmed}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Rejected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                          Unique Applicants
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.uniqueApplicants}</div>
                      </CardContent>
                    </Card>

                  </div>
                )}

                {/* Management Insights */}
                {stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 size={16} /> Pipeline Health
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Approval Rate</span>
                            <span className="font-medium">{analytics.approvalRate}%</span>
                          </div>
                          <Progress value={analytics.approvalRate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Pending Workload</span>
                            <span className="font-medium">{analytics.pendingRate}%</span>
                          </div>
                          <Progress value={analytics.pendingRate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Cross-Department Mix</span>
                            <span className="font-medium">{analytics.crossDeptRate}%</span>
                          </div>
                          <Progress value={analytics.crossDeptRate} className="h-2" />
                        </div>

                        <div className="text-xs rounded-md border p-3 bg-muted/30 space-y-1">
                          <p>
                            <span className="font-semibold">Needs review:</span> {analytics.pendingOlderThan48h} pending for 48h+
                          </p>
                          <p>
                            <span className="font-semibold">Fast-track candidates:</span> {analytics.highMatchPending} pending with 75%+ score
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Match Quality Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Average Match Score</span>
                            <span className="font-medium">{analytics.avgMatchScore}%</span>
                          </div>
                          <Progress value={analytics.avgMatchScore} className="h-2" />
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Strong (80-100)</span>
                            <Badge variant="secondary">{analytics.scoreBuckets.strong}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Medium (60-79)</span>
                            <Badge variant="secondary">{analytics.scoreBuckets.medium}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Low (&lt;60)</span>
                            <Badge variant="secondary">{analytics.scoreBuckets.low}</Badge>
                          </div>
                        </div>

                        <div className="text-xs rounded-md border p-3 bg-muted/30">
                          <span className="font-semibold">Rejection rate:</span> {analytics.rejectionRate}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Top Departments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {analytics.topDepartments.length === 0 ? (
                          <p className="text-muted-foreground text-xs">No department data yet.</p>
                        ) : (
                          analytics.topDepartments.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-muted-foreground truncate pr-3">{item.label}</span>
                              <Badge variant="secondary">{item.count}</Badge>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Top Colleges</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {analytics.topColleges.length === 0 ? (
                          <p className="text-muted-foreground text-xs">No college data yet.</p>
                        ) : (
                          analytics.topColleges.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-muted-foreground truncate pr-3">{item.label}</span>
                              <Badge variant="secondary">{item.count}</Badge>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Top Applicant Skills</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {analytics.topSkills.length === 0 ? (
                          <p className="text-muted-foreground text-xs">No skill data yet.</p>
                        ) : (
                          analytics.topSkills.map((item) => (
                            <Badge key={item.label} variant="secondary" className="gap-1">
                              <span>{item.label}</span>
                              <span>{item.count}</span>
                            </Badge>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {stats && analytics.registrationsByDay.length > 0 && (
                  <Card className="glass-card mb-8">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Registration Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                      {analytics.registrationsByDay.slice(-6).map((item) => (
                        <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="text-xl font-bold mt-1">{item.count}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Registrations */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Registrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleApproveAll}
                          disabled={(stats?.pending || 0) === 0}
                          className="gap-1"
                        >
                          <UserCheck size={14} /> Approve All Pending
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setRejectMode("all");
                            setSelectedRegistration(null);
                            setRejectionReason("");
                            setRejectDialogOpen(true);
                          }}
                          disabled={(stats?.pending || 0) === 0}
                          className="gap-1"
                        >
                          <UserX size={14} /> Reject All Pending
                        </Button>
                      </div>

                      <TabsList className="mb-4 flex-wrap">
                        <TabsTrigger value="all">All ({registrations.length})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({stats?.pending || 0})</TabsTrigger>
                        <TabsTrigger value="approved">
                          Approved ({(stats?.approved || 0) + (stats?.confirmed || 0)})
                        </TabsTrigger>
                        <TabsTrigger value="shortlist" className="gap-1">
                          <Sparkles size={12} /> Shortlist ({shortlistRegistrations.length})
                        </TabsTrigger>
                        <TabsTrigger value="cross-dept">Cross-Dept ({stats?.crossDept || 0})</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected ({stats?.rejected || 0})</TabsTrigger>
                        <TabsTrigger value="interested" className="gap-1">
                          <ThumbsUp size={12} /> Interested ({interestedSignals.length})
                        </TabsTrigger>
                        <TabsTrigger value="not-interested" className="gap-1">
                          <ThumbsDown size={12} /> Not Interested ({notInterestedSignals.length})
                        </TabsTrigger>
                      </TabsList>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Shortlist = pending applicants with match score 75% or higher.
                      </p>

                      <TabsContent value={selectedTab} className="space-y-3">
                        {isInterestTab ? (
                          selectedSignals.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="mx-auto mb-2 opacity-20" size={32} />
                              <p>No signals found.</p>
                            </div>
                          ) : (
                            selectedSignals.map((signal) => (
                              <motion.div
                                key={`${signal.userId}-${selectedTab}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={signal.avatar || undefined} />
                                    <AvatarFallback>{signal.name?.charAt(0) || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => setLocation(`/profile/${signal.userId}`)}
                                          className="font-semibold text-sm hover:text-primary transition-colors truncate"
                                        >
                                          {signal.name}
                                        </button>
                                        <div className="text-xs text-muted-foreground truncate">{signal.email}</div>
                                        <div className="text-xs text-muted-foreground truncate mt-1">{signal.department}</div>
                                      </div>
                                      <Badge variant="secondary" className={cn(
                                        selectedTab === "interested"
                                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                      )}>
                                        {selectedTab === "interested" ? "Interested" : "Not Interested"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          )
                        ) : filteredRegistrations.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="mx-auto mb-2 opacity-20" size={32} />
                            <p>No registrations found.</p>
                          </div>
                        ) : (
                          filteredRegistrations.map((reg) => {
                            const registrationUser = reg.user ?? {
                              id: "unknown",
                              name: "Unknown User",
                              email: "N/A",
                              department: "N/A",
                              skills: [] as string[],
                              interests: [] as string[],
                              avatar: undefined,
                            };

                            return (
                            <motion.div
                              key={reg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => registrationUser.id !== "unknown" && setLocation(`/profile/${registrationUser.id}`)}
                                  className="text-left"
                                  disabled={registrationUser.id === "unknown"}
                                  title={registrationUser.id === "unknown" ? "Profile unavailable" : "Open profile"}
                                >
                                  <Avatar className="w-10 h-10 ring-1 ring-transparent hover:ring-primary/40 transition-all">
                                    <AvatarImage src={registrationUser.avatar} />
                                    <AvatarFallback>{registrationUser.name.charAt(0) || "U"}</AvatarFallback>
                                  </Avatar>
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <button
                                          type="button"
                                          onClick={() => registrationUser.id !== "unknown" && setLocation(`/profile/${registrationUser.id}`)}
                                          className="font-semibold text-sm hover:text-primary transition-colors"
                                          disabled={registrationUser.id === "unknown"}
                                          title={registrationUser.id === "unknown" ? "Profile unavailable" : "Open profile"}
                                        >
                                          {registrationUser.name}
                                        </button>
                                        {registrationUser.department && registrationUser.department !== "N/A" && (
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-xs",
                                              reg.registrationType === "cross_department" && "border-violet-500/50 text-violet-600 dark:text-violet-400"
                                            )}
                                          >
                                            {registrationUser.department}
                                            {reg.registrationType === "cross_department" && (
                                              <span className="ml-1 opacity-60">·↗</span>
                                            )}
                                          </Badge>
                                        )}
                                        <Badge
                                          className={cn(
                                            "text-xs",
                                            reg.status === "pending" && "bg-amber-500/20 text-amber-700",
                                            reg.status === "approved" && "bg-emerald-500/20 text-emerald-700",
                                            reg.status === "confirmed" && "bg-emerald-500/20 text-emerald-700",
                                            reg.status === "rejected" && "bg-destructive/20 text-destructive"
                                          )}
                                        >
                                          {reg.status}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {registrationUser.email}
                                      </div>
                                      {(registrationUser.city || registrationUser.university) && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {[registrationUser.city, registrationUser.university].filter(Boolean).join(" • ")}
                                        </div>
                                      )}
                                      {reg.matchScore !== null && (
                                        <div className="mt-1">
                                          <Badge
                                            className={cn(
                                              "text-[10px] px-2 py-0.5",
                                              reg.matchScore >= 80 && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
                                              reg.matchScore >= 60 && reg.matchScore < 80 && "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                                              reg.matchScore < 60 && "bg-red-500/20 text-red-700 dark:text-red-300"
                                            )}
                                          >
                                            {reg.matchScore >= 80 ? "Strong" : reg.matchScore >= 60 ? "Medium" : "Low"} match · {reg.matchScore}%
                                          </Badge>
                                        </div>
                                      )}
                                      {registrationUser.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {registrationUser.skills.slice(0, 4).map((skill) => (
                                            <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                      {registrationUser.interests.length > 0 && (
                                        <div className="text-[11px] text-muted-foreground mt-2">
                                          Interests: {registrationUser.interests.slice(0, 3).join(", ")}
                                        </div>
                                      )}
                                      {reg.status === "rejected" && reg.rejectionReason && (
                                        <div className="mt-2 text-xs rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-destructive">
                                          <span className="font-semibold">Rejection reason:</span> {reg.rejectionReason}
                                        </div>
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {(() => {
                                          const appliedAt = new Date(reg.createdAt);
                                          if (isNaN(appliedAt.getTime())) return "Applied date unavailable";
                                          return `Applied ${appliedAt.toLocaleDateString()} ${appliedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                                        })()}
                                      </div>
                                    </div>

                                    {reg.status === "pending" && (
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleApprove(reg.id)}
                                          className="h-7 px-2 text-emerald-600 gap-1 text-xs"
                                        >
                                          <UserCheck size={13} /> Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setRejectMode("single");
                                            setSelectedRegistration(reg);
                                            setRejectDialogOpen(true);
                                          }}
                                          className="h-7 px-2 text-destructive gap-1 text-xs"
                                        >
                                          <UserX size={13} /> Reject
                                        </Button>
                                      </div>
                                    )}
                                    {(reg.status === "approved" || reg.status === "confirmed") && (
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteRegistration(reg.id)}
                                          className="h-7 px-2 text-destructive gap-1 text-xs"
                                        >
                                          <Trash2 size={13} /> Remove
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                          })
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    Select an event to view details
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onOpenChange={(open) => {
            setRejectDialogOpen(open);
            if (!open) {
              setRejectionReason("");
              setSelectedRegistration(null);
              setRejectMode("single");
            }
          }}
        >
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{rejectMode === "all" ? "Reject All Pending Registrations" : "Reject Registration"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Reason for Rejection</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejecting this registration..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {rejectMode === "all"
                  ? "This will reject every pending registration for this event after confirmation."
                  : "This will reject the selected registration after confirmation."}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Reject Registration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
