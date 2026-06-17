import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Post } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Trash2, Crown, LayoutDashboard, Users, FileText, Search, MessageSquareWarning, Settings, Download, Hammer, UserCog } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getAdminUserDetails } from "@/lib/api";
import { AdminStats } from "@/components/AdminStats";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { format } from "date-fns";
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
import { ObservabilityPanel } from "@/components/ObservabilityPanel";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { ReportsPanel } from "@/components/ReportsPanel";
import { Activity } from "lucide-react";
import { MaintenancePanel } from "@/components/MaintenancePanel";
import { Navbar } from "@/components/Navbar";

interface DashboardStats {
    totalUsers: number;
    totalPosts: number;
    totalEvents: number;
    totalReports: number;
    pendingReports: number;
    postsByDate: Record<string, number>;
    skills: Record<string, number>;
}

type SortKey = "name" | "email" | "createdAt" | "isAdmin";
type SortOrder = "asc" | "desc";

export default function AdminDashboard() {
    const { toast } = useToast();
    const [userSearch, setUserSearch] = useState("");
    const [postSearch, setPostSearch] = useState("");
    const [organisersSearch, setOrganisersSearch] = useState("");
    const { getAdminStats, getAdminUsers, getPosts, adminDeleteUser, adminDeletePost, adminPromoteUser, adminPromoteOrganiser, adminBanUser, adminUnbanUser, getAdminOrganisers, getAdminOrganizerEvents, getAdminOrganizerDashboard } = useStore();

    // User management state
    const [usersPage, setUsersPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "organiser" | "user">("all");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);

    // Organisers management state
    const [organisersPage, setOrganisersPage] = useState(1);
    const [selectedOrganiser, setSelectedOrganiser] = useState<any>(null);
    const [selectedOrganizerEvent, setSelectedOrganizerEvent] = useState<any>(null);
    const [organizerDashboardView, setOrganizerDashboardView] = useState(false);

    // Ban user state
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [banUserTarget, setBanUserTarget] = useState<User | null>(null);
    const [banReason, setBanReason] = useState("");

    const usersPerPage = 20;

    // Security: Redirect non-admin users to home
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    
    // Check immediately if we have a user loaded and they are not admin
    if (user && !user.isAdmin) {
        setLocation("/");
        return null;
    }

    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ["adminStats"],
        queryFn: getAdminStats
    });

    const { data: users, isLoading: usersLoading } = useQuery<User[]>({
        queryKey: ["adminUsers"],
        queryFn: getAdminUsers
    });

    const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
        queryKey: ["posts"],
        queryFn: getPosts
    });

    const { data: organisers, isLoading: organisersLoading } = useQuery<any>({
        queryKey: ["adminOrganisers", organisersPage],
        queryFn: () => getAdminOrganisers(organisersPage, 10)
    });

    const { data: organizerEvents, isLoading: organizerEventsLoading } = useQuery<any[]>({
        queryKey: ["adminOrganizerEvents", selectedOrganiser?.id],
        queryFn: () => selectedOrganiser ? getAdminOrganizerEvents(selectedOrganiser.id) : Promise.resolve([]),
        enabled: !!selectedOrganiser
    });

    const { data: dashboardData, isLoading: dashboardLoading } = useQuery<any>({
        queryKey: ["adminOrganizerDashboard", selectedOrganiser?.id, selectedOrganizerEvent?.id],
        queryFn: () => selectedOrganiser && selectedOrganizerEvent ? getAdminOrganizerDashboard(selectedOrganiser.id, selectedOrganizerEvent.id) : Promise.resolve(null),
        enabled: !!selectedOrganiser && !!selectedOrganizerEvent
    });

    // Fetch full user details when a user is selected
    const { data: fullUserDetails, isLoading: userDetailsLoading } = useQuery<User>({
        queryKey: ["adminUserDetails", selectedUser?.id],
        queryFn: () => selectedUser ? getAdminUserDetails(selectedUser.id) : Promise.resolve(null),
        enabled: !!selectedUser && showUserDetail
    });

    const deleteUserMutation = useMutation({
        mutationFn: adminDeleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            toast({ title: "User deleted successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
        }
    });

    const promoteUserMutation = useMutation({
        mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
            await adminPromoteUser(userId, isAdmin);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminUserDetails", selectedUser?.id] });
            toast({ title: "User role updated successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
        }
    });

    const promoteOrganiserMutation = useMutation({
        mutationFn: async ({ userId, isOrganiser }: { userId: string, isOrganiser: boolean }) => {
            await adminPromoteOrganiser(userId, isOrganiser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            queryClient.invalidateQueries({ queryKey: ["adminUserDetails", selectedUser?.id] });
            toast({ title: "Organiser role updated successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to update organiser role", description: error.message, variant: "destructive" });
        }
    });

    const banUserMutation = useMutation({
        mutationFn: async ({ userId, reason }: { userId: string, reason: string }) => {
            await adminBanUser(userId, reason);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            setBanDialogOpen(false);
            setBanUserTarget(null);
            setBanReason("");
            toast({ title: "User banned successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to ban user", description: error.message, variant: "destructive" });
        }
    });

    const unbanUserMutation = useMutation({
        mutationFn: adminUnbanUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
            toast({ title: "User unbanned successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to unban user", description: error.message, variant: "destructive" });
        }
    });

    const deletePostMutation = useMutation({
        mutationFn: adminDeletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["adminStats"] });
            toast({ title: "Post deleted successfully" });
        },
        onError: (error: any) => {
            toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
        }
    });

    if (statsLoading || usersLoading || postsLoading) return <LoadingSpinner />;

    // Filter users by search and role
    const filterAndSortUsers = () => {
        let result = users?.filter(u => {
            const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.username.toLowerCase().includes(userSearch.toLowerCase());
            
            const matchesRole = roleFilter === "all"
                ? true
                : roleFilter === "admin"
                    ? u.isAdmin
                    : roleFilter === "organiser"
                        ? u.isOrganiser
                        : !u.isAdmin;
            
            return matchesSearch && matchesRole;
        }) || [];

        // Sort
        result.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortKey) {
                case "name":
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case "email":
                    aVal = a.email.toLowerCase();
                    bVal = b.email.toLowerCase();
                    break;
                case "createdAt":
                    aVal = new Date(a.createdAt).getTime();
                    bVal = new Date(b.createdAt).getTime();
                    break;
                case "isAdmin":
                    aVal = a.isAdmin ? 1 : 0;
                    bVal = b.isAdmin ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    };

    const sortedAndFilteredUsers = filterAndSortUsers();
    const paginatedUsers = sortedAndFilteredUsers.slice(0, usersPage * usersPerPage);
    const hasMoreUsers = paginatedUsers.length < sortedAndFilteredUsers.length;

    // Comparisons are lowercased for search
    const filteredPosts = posts?.filter(p =>
        p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(postSearch.toLowerCase()) ||
        p.userName.toLowerCase().includes(postSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <div className="container mx-auto pt-24 pb-10 px-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight font-display">Super Admin</h1>
                            <p className="text-muted-foreground">System Overview & Management</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 rounded-xl border">
                        <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <LayoutDashboard size={16} /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Users size={16} /> Users
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <MessageSquareWarning size={16} /> Reports
                        </TabsTrigger>
                        <TabsTrigger value="content" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <FileText size={16} /> Content
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Activity size={16} /> Analytics
                        </TabsTrigger>
                        <TabsTrigger value="organisers" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Crown size={16} /> Organisers
                        </TabsTrigger>
                        <TabsTrigger value="observability" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <ShieldCheck size={16} /> Observability
                        </TabsTrigger>
                        <TabsTrigger value="system" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Settings size={16} /> System
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4">
                        {stats && <AdminStats stats={stats} />}
                    </TabsContent>

                    {/* USERS TAB */}
                    <TabsContent value="users" className="space-y-4">
                        <Card>
                            <CardHeader className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle>User Management</CardTitle>
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search users..." 
                                            className="pl-8" 
                                            value={userSearch} 
                                            onChange={e => {
                                                setUserSearch(e.target.value);
                                                setUsersPage(1);
                                            }} 
                                        />
                                    </div>
                                </div>

                                {/* Filters & Sort Controls */}
                                <div className="flex flex-wrap items-center gap-3 pb-4 border-t pt-4">
                                    {/* Role Filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                                        <select 
                                            value={roleFilter}
                                            onChange={(e) => {
                                                setRoleFilter(e.target.value as any);
                                                setUsersPage(1);
                                            }}
                                            className="px-3 py-1 text-sm border rounded-lg bg-background"
                                        >
                                            <option value="all">All Users</option>
                                            <option value="admin">Admins Only</option>
                                            <option value="organiser">Organisers Only</option>
                                            <option value="user">Regular Users</option>
                                        </select>
                                    </div>

                                    {/* Sort Key */}
                                    <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-sm font-medium text-muted-foreground">Sort:</span>
                                        <select 
                                            value={sortKey}
                                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                                            className="px-3 py-1 text-sm border rounded-lg bg-background"
                                        >
                                            <option value="createdAt">Join Date</option>
                                            <option value="name">Name</option>
                                            <option value="email">Email</option>
                                            <option value="isAdmin">Role</option>
                                        </select>
                                    </div>

                                    {/* Sort Order */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                        className="text-xs"
                                    >
                                        {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
                                    </Button>
                                </div>

                                {/* Results count */}
                                <div className="text-xs text-muted-foreground">
                                    Showing {paginatedUsers.length} of {sortedAndFilteredUsers.length} users
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Skill</TableHead>
                                            <TableHead>University</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers?.map((user) => (
                                            <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                                setSelectedUser(user);
                                                setShowUserDetail(true);
                                            }}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="text-muted-foreground">{user.email}</span>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {user.skills && user.skills.length > 0 ? user.skills.map((s: string) => <Badge key={s} variant="outline" className="mr-1">{s}</Badge>) : <span className="text-muted-foreground text-xs">-</span>}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {user.university ? <span>{user.university}</span> : <span className="text-muted-foreground text-xs">-</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex flex-col gap-1">
                                                            {user.isAdmin ? (
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 w-fit"><ShieldCheck size={12} /> Admin</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="w-fit">User</Badge>
                                                            )}
                                                            {user.isOrganiser && (
                                                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1 w-fit">
                                                                    <UserCog size={12} /> Organiser
                                                                </Badge>
                                                            )}
                                                            {user.isBanned && (
                                                                <Badge variant="destructive" className="gap-1 w-fit">
                                                                    <Hammer size={12} /> Banned
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1 h-7 w-full justify-start"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                promoteOrganiserMutation.mutate({ userId: user.id, isOrganiser: !user.isOrganiser });
                                                            }}
                                                        >
                                                            <UserCog className={`h-3 w-3 ${user.isOrganiser ? "text-blue-500 fill-blue-500" : ""}`} />
                                                            {user.isOrganiser ? "Remove organiser" : "Make organiser"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => promoteUserMutation.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
                                                            title={user.isAdmin ? "Demote from Admin" : "Promote to Admin"}
                                                        >
                                                            <Crown className={`h-4 w-4 ${user.isAdmin ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                                                        </Button>

                                                        {user.isBanned ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="hover:text-green-600 hover:bg-green-50"
                                                                onClick={() => unbanUserMutation.mutate(user.id)}
                                                                title="Unban user"
                                                            >
                                                                <Hammer className="h-4 w-4 text-orange-500" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="hover:text-orange-600 hover:bg-orange-50"
                                                                onClick={() => {
                                                                    setBanUserTarget(user);
                                                                    setBanDialogOpen(true);
                                                                    setBanReason("");
                                                                }}
                                                                title="Ban user"
                                                            >
                                                                <Hammer className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-destructive/10">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete <strong>@{user.username}</strong> and remove all their data from our servers.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteUserMutation.mutate(user.id)}>
                                                                        Delete User
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Load More Button */}
                                {hasMoreUsers && (
                                    <div className="mt-6 flex justify-center">
                                        <Button 
                                            onClick={() => setUsersPage(prev => prev + 1)}
                                            variant="outline"
                                        >
                                            Load More ({paginatedUsers.length} / {sortedAndFilteredUsers.length})
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* User Detail Modal */}
                        {showUserDetail && selectedUser && (
                            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowUserDetail(false)}>
                                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 border-b">
                                        <div>
                                            <CardTitle>{fullUserDetails?.name || selectedUser.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">@{fullUserDetails?.username || selectedUser.username}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            onClick={() => setShowUserDetail(false)}
                                        >
                                            ✕
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        {userDetailsLoading ? (
                                            <div className="flex justify-center py-8">
                                                <LoadingSpinner />
                                            </div>
                                        ) : fullUserDetails ? (
                                            <>
                                                {/* Profile Section */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email</p>
                                                        <p className="font-medium break-all">{fullUserDetails.email}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Roles</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {fullUserDetails.isAdmin && (
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><ShieldCheck size={12} /> Admin</Badge>
                                                            )}
                                                            {fullUserDetails.isOrganiser && (
                                                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><UserCog size={12} /> Organiser</Badge>
                                                            )}
                                                            {!fullUserDetails.isAdmin && !fullUserDetails.isOrganiser && (
                                                                <Badge variant="outline">User</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Joined</p>
                                                        <p className="font-medium">{format(new Date(fullUserDetails.createdAt), 'MMM d, yyyy HH:mm')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Last Active</p>
                                                        <p className="font-medium">{fullUserDetails.lastActive ? format(new Date(fullUserDetails.lastActive), 'MMM d, yyyy HH:mm') : <span className="text-muted-foreground italic">Never</span>}</p>
                                                    </div>
                                                </div>

                                                {/* Bio & Basic Info */}
                                                <div className="space-y-3 border-t pt-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bio</p>
                                                        <p className="text-sm">{fullUserDetails.bio || <span className="text-muted-foreground italic">No bio added</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Skills</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {fullUserDetails.skills && fullUserDetails.skills.length > 0 ? (
                                                                fullUserDetails.skills.map((sk: string) => (
                                                                    <Badge key={sk} variant="outline">{sk}</Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-muted-foreground italic text-sm">No skills</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Interests</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {fullUserDetails.interests && fullUserDetails.interests.length > 0 ? (
                                                                fullUserDetails.interests.map((interest: string) => (
                                                                    <Badge key={interest} variant="outline">{interest}</Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground italic">No interests added</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Location & Institution */}
                                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">University</p>
                                                        <p className="text-sm">{fullUserDetails.university || <span className="text-muted-foreground italic">Not specified</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Department</p>
                                                        <p className="text-sm">{fullUserDetails.department || <span className="text-muted-foreground italic">Not specified</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">City</p>
                                                        <p className="text-sm">{fullUserDetails.city || <span className="text-muted-foreground italic">Not specified</span>}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Auth Provider</p>
                                                        <Badge variant="secondary">{fullUserDetails.authProvider || 'local'}</Badge>
                                                    </div>
                                                </div>

                                                {/* Social Links */}
                                                <div className="space-y-2 border-t pt-4">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Social Links</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Portfolio:</span>{' '}
                                                            {fullUserDetails.portfolio ? (
                                                                <a href={fullUserDetails.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{fullUserDetails.portfolio}</a>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">None</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">GitHub:</span>{' '}
                                                            {fullUserDetails.github ? (
                                                                <a href={fullUserDetails.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{fullUserDetails.github}</a>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">None</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">LinkedIn:</span>{' '}
                                                            {fullUserDetails.linkedin ? (
                                                                <a href={fullUserDetails.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{fullUserDetails.linkedin}</a>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">None</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Twitter:</span>{' '}
                                                            {fullUserDetails.twitter ? (
                                                                <a href={fullUserDetails.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{fullUserDetails.twitter}</a>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Privacy Settings */}
                                                {fullUserDetails.privacy && (
                                                    <div className="border-t pt-4">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Privacy Settings</p>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>Show Email: <Badge variant={fullUserDetails.privacy.showEmail ? "default" : "secondary"}>{fullUserDetails.privacy.showEmail ? "Yes" : "No"}</Badge></div>
                                                            <div>Show Portfolio: <Badge variant={fullUserDetails.privacy.showPortfolio ? "default" : "secondary"}>{fullUserDetails.privacy.showPortfolio ? "Yes" : "No"}</Badge></div>
                                                            <div>Show University: <Badge variant={fullUserDetails.privacy.showUniversity ? "default" : "secondary"}>{fullUserDetails.privacy.showUniversity ? "Yes" : "No"}</Badge></div>
                                                            <div>Show City: <Badge variant={fullUserDetails.privacy.showCity ? "default" : "secondary"}>{fullUserDetails.privacy.showCity ? "Yes" : "No"}</Badge></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Account Status */}
                                                <div className="border-t pt-4">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Account Status</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>Verified: <Badge variant={fullUserDetails.isVerified ? "default" : "secondary"}>{fullUserDetails.isVerified ? "Yes" : "No"}</Badge></div>
                                                        <div>Banned: <Badge variant={fullUserDetails.isBanned ? "destructive" : "secondary"}>{fullUserDetails.isBanned ? "Yes" : "No"}</Badge></div>
                                                    </div>
                                                    {fullUserDetails.isBanned && fullUserDetails.banReason && (
                                                        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                                                            <p className="text-xs font-semibold text-destructive">Ban Reason:</p>
                                                            <p className="text-sm">{fullUserDetails.banReason}</p>
                                                            {fullUserDetails.bannedAt && (
                                                                <p className="text-xs text-muted-foreground mt-1">Banned on: {format(new Date(fullUserDetails.bannedAt), 'MMM d, yyyy HH:mm')}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 border-t pt-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                promoteUserMutation.mutate({ userId: fullUserDetails.id, isAdmin: !fullUserDetails.isAdmin });
                                                                setShowUserDetail(false);
                                                            }}
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            <Crown className="mr-2 h-4 w-4" />
                                                            {fullUserDetails.isAdmin ? "Demote from Admin" : "Promote to Admin"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                promoteOrganiserMutation.mutate({ userId: fullUserDetails.id, isOrganiser: !fullUserDetails.isOrganiser });
                                                                setShowUserDetail(false);
                                                            }}
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            <UserCog className="mr-2 h-4 w-4" />
                                                            {fullUserDetails.isOrganiser ? "Demote from Organiser" : "Promote to Organiser"}
                                                        </Button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {fullUserDetails.isBanned ? (
                                                            <Button
                                                                onClick={() => {
                                                                    adminUnbanUser(fullUserDetails.id);
                                                                    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
                                                                    queryClient.invalidateQueries({ queryKey: ["adminUserDetails", fullUserDetails.id] });
                                                                    toast({ title: "User unbanned successfully" });
                                                                    setShowUserDetail(false);
                                                                }}
                                                                variant="outline"
                                                                className="flex-1"
                                                            >
                                                                Unban User
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => {
                                                                    setBanUserTarget(fullUserDetails);
                                                                    setBanDialogOpen(true);
                                                                    setShowUserDetail(false);
                                                                }}
                                                                variant="outline"
                                                                className="flex-1"
                                                            >
                                                                <Hammer className="mr-2 h-4 w-4" />
                                                                Ban User
                                                            </Button>
                                                        )}
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" className="flex-1">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete User
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete <strong>@{fullUserDetails.username}</strong> and remove all their data.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
                                                                        deleteUserMutation.mutate(fullUserDetails.id);
                                                                        setShowUserDetail(false);
                                                                    }}>
                                                                        Delete User
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Failed to load user details
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {/* Ban User Dialog */}
                        <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                            <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Ban <strong>@{banUserTarget?.username}</strong> and provide a reason. They will see this reason on the banned page.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <label className="text-sm font-medium">Ban Reason</label>
                                        <Input
                                            placeholder="e.g., Violation of community guidelines, Harassment"
                                            value={banReason}
                                            onChange={(e) => setBanReason(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        disabled={!banReason.trim() || banUserMutation.isPending}
                                        className="bg-orange-600 hover:bg-orange-700"
                                        onClick={() => {
                                            if (banUserTarget && banReason.trim()) {
                                                banUserMutation.mutate({ userId: banUserTarget.id, reason: banReason.trim() });
                                            }
                                        }}
                                    >
                                        {banUserMutation.isPending ? "Banning..." : "Ban User"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TabsContent>

                    {/* REPORTS TAB */}
                    <TabsContent value="reports" className="space-y-4">
                        <ReportsPanel />
                    </TabsContent>

                    {/* CONTENT TAB */}
                    <TabsContent value="content" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Content Moderation</CardTitle>
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search posts..." className="pl-8" value={postSearch} onChange={e => setPostSearch(e.target.value)} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Author</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPosts?.map((post) => (
                                            <TableRow key={post.id}>
                                                <TableCell className="font-medium">{post.title}</TableCell>
                                                <TableCell>{post.userName}</TableCell>
                                                <TableCell>
                                                    {post.eventName ? <Badge variant="secondary">Event</Badge> : <Badge variant="outline">Teammate</Badge>}
                                                </TableCell>
                                                <TableCell>{format(new Date(post.createdAt), 'MMM d, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePostMutation.mutate(post.id)}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ANALYTICS TAB */}
                    <TabsContent value="analytics" className="space-y-4">
                        <AnalyticsPanel />
                    </TabsContent>

                    {/* OBSERVABILITY TAB */}
                    <TabsContent value="observability" className="space-y-4">
                        <ObservabilityPanel />
                    </TabsContent>

                    {/* SYSTEM TAB */}
                    <TabsContent value="system" className="space-y-4">
                        <MaintenancePanel />                        
                        {/* Data Export Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Data Export</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-semibold mb-1">User Skills & Interests</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Export a CSV file containing all users with their skills and interests data.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch("/api/admin/export/user-skills", {
                                                    credentials: "include",
                                                });
                                                if (!response.ok) throw new Error("Export failed");
                                                
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `user-skills-${Date.now()}.csv`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                                
                                                toast({ title: "Export successful", description: "User skills data has been downloaded." });
                                            } catch (error) {
                                                toast({ title: "Export failed", variant: "destructive" });
                                            }
                                        }}
                                        className="gap-2"
                                    >
                                        <Download size={16} />
                                        Export CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>                    </TabsContent>

                    {/* ORGANISERS TAB */}
                    <TabsContent value="organisers" className="space-y-4">
                        {!organizerDashboardView ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Organisers List */}
                                <div className="lg:col-span-1">
                                    <Card className="h-full">
                                        <CardHeader>
                                            <CardTitle className="text-base">Organisers</CardTitle>
                                            <div className="relative mt-4">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Search organisers..." 
                                                    className="pl-8 text-sm"
                                                    value={organisersSearch}
                                                    onChange={(e) => {
                                                        setOrganisersSearch(e.target.value);
                                                        setOrganisersPage(1);
                                                    }}
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 overflow-y-auto max-h-[600px]">
                                            {organisersLoading ? (
                                                <LoadingSpinner />
                                            ) : organisers?.organisers && organisers.organisers.length > 0 ? (
                                                <>
                                                    {organisers.organisers
                                                        .filter((org: any) => 
                                                            org.name.toLowerCase().includes(organisersSearch.toLowerCase()) ||
                                                            org.email.toLowerCase().includes(organisersSearch.toLowerCase())
                                                        )
                                                        .map((org: any) => (
                                                            <Button
                                                                key={org.id}
                                                                variant={selectedOrganiser?.id === org.id ? "default" : "ghost"}
                                                                className="w-full justify-start h-auto py-2 px-3 text-sm"
                                                                onClick={() => {
                                                                    setSelectedOrganiser(org);
                                                                    setSelectedOrganizerEvent(null);
                                                                }}
                                                            >
                                                                <div className="text-left">
                                                                    <div className="font-medium truncate">{org.name}</div>
                                                                    <div className="text-xs text-muted-foreground truncate">{org.email}</div>
                                                                </div>
                                                            </Button>
                                                        ))}
                                                    {/* Pagination */}
                                                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={organisersPage === 1}
                                                            onClick={() => setOrganisersPage(p => Math.max(1, p - 1))}
                                                        >
                                                            Prev
                                                        </Button>
                                                        <span className="text-xs text-muted-foreground">
                                                            Page {organisersPage}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!organisers?.pagination || organisersPage >= organisers.pagination.pages}
                                                            onClick={() => setOrganisersPage(p => p + 1)}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-8">
                                                    No organisers found
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Events List */}
                                <div className="lg:col-span-2">
                                    {selectedOrganiser ? (
                                        <Card className="h-full">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-base">{selectedOrganiser.name}'s Events</CardTitle>
                                                        <p className="text-xs text-muted-foreground mt-1">{selectedOrganiser.email}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedOrganiser(null);
                                                            setSelectedOrganizerEvent(null);
                                                        }}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {organizerEventsLoading ? (
                                                    <LoadingSpinner />
                                                ) : organizerEvents && organizerEvents.length > 0 ? (
                                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                                        {organizerEvents.map((event: any) => (
                                                            <Button
                                                                key={event.id}
                                                                variant={selectedOrganizerEvent?.id === event.id ? "default" : "outline"}
                                                                className="w-full justify-between h-auto py-2 px-3 text-sm"
                                                                onClick={() => {
                                                                    setSelectedOrganizerEvent(event);
                                                                    setOrganizerDashboardView(true);
                                                                }}
                                                            >
                                                                <div className="text-left flex-1">
                                                                    <div className="font-medium truncate">{event.eventName}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {event.eventDate ? format(new Date(event.eventDate), 'MMM d, yyyy') : 'No date'}
                                                                    </div>
                                                                </div>
                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                    {event.eventRegistrationCount || 0} registrations
                                                                </Badge>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        No events found for this organiser
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="h-full">
                                            <CardContent className="flex items-center justify-center h-[400px]">
                                                <p className="text-muted-foreground">Select an organiser to view their events</p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Dashboard View
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => {
                                        setOrganizerDashboardView(false);
                                        setSelectedOrganizerEvent(null);
                                    }}
                                >
                                    ← Back
                                </Button>

                                {dashboardLoading ? (
                                    <LoadingSpinner />
                                ) : dashboardData ? (
                                    <>
                                        <Card>
                                            <CardHeader>
                                                <div>
                                                    <CardTitle>Event Dashboard</CardTitle>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Organiser: {selectedOrganiser?.name}<br/>
                                                        Event: {selectedOrganizerEvent?.eventName}
                                                    </p>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <Card>
                                                        <CardContent className="pt-6">
                                                            <div className="text-2xl font-bold">{dashboardData.stats?.total || 0}</div>
                                                            <p className="text-xs text-muted-foreground">Total Registrations</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-6">
                                                            <div className="text-2xl font-bold text-yellow-500">{dashboardData.stats?.pending || 0}</div>
                                                            <p className="text-xs text-muted-foreground">Pending</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-6">
                                                            <div className="text-2xl font-bold text-green-500">{dashboardData.stats?.approved || 0}</div>
                                                            <p className="text-xs text-muted-foreground">Approved</p>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardContent className="pt-6">
                                                            <div className="text-2xl font-bold text-red-500">{dashboardData.stats?.rejected || 0}</div>
                                                            <p className="text-xs text-muted-foreground">Rejected</p>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Registrations Table */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Registrations</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Email</TableHead>
                                                                <TableHead>Skill</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Applied Date</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {dashboardData.registrations && dashboardData.registrations.length > 0 ? (
                                                                dashboardData.registrations.map((reg: any) => (
                                                                    <TableRow key={reg.id}>
                                                                        <TableCell>{reg.userName}</TableCell>
                                                                        <TableCell>{reg.userEmail}</TableCell>
                                                                        <TableCell>{reg.userSkill}</TableCell>
                                                                        <TableCell>
                                                                            <Badge 
                                                                                variant={
                                                                                    reg.status === 'approved' ? 'default' :
                                                                                    reg.status === 'rejected' ? 'destructive' :
                                                                                    'secondary'
                                                                                }
                                                                            >
                                                                                {reg.status}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>{format(new Date(reg.createdAt), 'MMM d, yyyy')}</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="text-center py-8">
                                                                        No registrations yet
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                ) : (
                                    <Card>
                                        <CardContent className="flex items-center justify-center h-[400px]">
                                            <p className="text-muted-foreground">Unable to load dashboard data</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
