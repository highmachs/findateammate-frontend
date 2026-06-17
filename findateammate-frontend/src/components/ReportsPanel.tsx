import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Report } from "@shared/schema";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Bug, MessageSquare, LifeBuoy, Search, Filter, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { getAdminReports, updateReportStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReportsPanel() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [resolutionNote, setResolutionNote] = useState("");

    const { data: reports, isLoading } = useQuery<Report[]>({
        queryKey: ["/api/admin/reports", statusFilter, searchTerm],
        queryFn: () => getAdminReports(statusFilter, searchTerm)
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // ... existing statusFilter state ...

    // ... existing useQuery ...

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => 
            updateReportStatus(id, status, adminNotes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
            toast({
                title: "Report Updated",
                description: "The report status has been updated and user notified if resolved.",
            });
            setSelectedReport(null);
            setResolutionNote("");
        },
        onError: (error: any) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (ids: string[]) => import("@/lib/api").then(mod => mod.deleteReports(ids)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
            toast({ title: "Reports Deleted", description: "Selected reports have been removed." });
            setSelectedIds([]);
        },
        onError: (error: any) => toast({ title: "Delete Failed", description: error.message, variant: "destructive" })
    });

    const clearAllMutation = useMutation({
        mutationFn: () => import("@/lib/api").then(mod => mod.deleteAllReports()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
            toast({ title: "All Reports Cleared", description: "All support tickets have been deleted." });
            setSelectedIds([]);
        },
        onError: (error: any) => toast({ title: "Clear Failed", description: error.message, variant: "destructive" })
    });

    const handleBulkDelete = () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} reports?`)) {
            deleteMutation.mutate(selectedIds);
        }
    };

    const handleClearAll = () => {
        if (confirm("WARNING: This will delete ALL reports in the system. Are you sure?")) {
            clearAllMutation.mutate();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bug': return <Bug size={16} className="text-red-500" />;
            case 'feedback': return <MessageSquare size={16} className="text-blue-500" />;
            case 'support': return <LifeBuoy size={16} className="text-green-500" />;
            default: return <ClipboardList size={16} className="text-muted-foreground" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle size={12} className="mr-1" /> Resolved</Badge>;
            case 'dismissed': return <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle size={12} className="mr-1" /> Dismissed</Badge>;
            default: return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock size={12} className="mr-1" /> Pending</Badge>;
        }
    };

    return (
        <Card className="glass-panel border-white/10">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl">Support System</CardTitle>
                    <CardDescription>Review bugs, feedback, and support tickets</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search subject or description..." 
                            className="pl-9 w-full sm:w-[250px] h-9" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>


                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-muted/50 p-2 rounded-lg flex items-center justify-between mb-4 border border-border">
                        <span className="text-sm font-semibold ml-2">{selectedIds.length} selected</span>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleBulkDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete Selected
                        </Button>
                    </div>
                )}
                
                <div className="flex justify-end mb-4">
                     <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={handleClearAll}
                        disabled={reports?.length === 0 || clearAllMutation.isPending}
                     >
                        Clear All Reports
                     </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : reports?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No reports found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <input 
                                            type="checkbox" 
                                            checked={reports?.length ? selectedIds.length === reports.length : false}
                                            onChange={(e) => {
                                                if (e.target.checked && reports) {
                                                    setSelectedIds(reports.map(r => r.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                            className="rounded border-gray-400"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead>Subject & Context</TableHead>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports?.map((report) => (
                                    <TableRow key={report.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(report.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(prev => [...prev, report.id]);
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => id !== report.id));
                                                    }
                                                }}
                                                className="rounded border-gray-400"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-semibold capitalize">
                                                {getIcon(report.type)}
                                                <span className="text-xs">{report.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm truncate" title={report.subject}>
                                                    {report.subject}
                                                </span>
                                                {report.pageSection && (
                                                    <span className="text-[10px] text-primary font-medium uppercase tracking-tight">
                                                        At: {report.pageSection}
                                                    </span>
                                                )}
                                                <p className="text-xs text-muted-foreground truncate opacity-70 mt-1">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs">
                                                <span className="font-semibold text-foreground/80">
                                                    {report.reporterEmail || "Anonymous"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    ID: {report.reporterId ? report.reporterId.slice(0, 8) : "N/A"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-medium text-muted-foreground uppercase">
                                            {format(new Date(report.createdAt), "MMM d, h:mm a")}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(report.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-8 px-2 text-xs font-bold gap-1.5"
                                                    onClick={() => setSelectedReport(report)}
                                                >
                                                    View Details
                                                </Button>
                                                {report.status === 'pending' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                        onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'dismissed' })}
                                                    >
                                                        <XCircle size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Report Detail Modal */}
                <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                    <DialogContent aria-describedby={undefined} className="max-w-xl glass-panel border-border shadow-2xl rounded-2xl">
                        {selectedReport && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusBadge(selectedReport.status)}
                                        <Badge variant="outline" className="capitalize">{selectedReport.type}</Badge>
                                    </div>
                                    <DialogTitle className="text-2xl font-bold">{selectedReport.subject}</DialogTitle>
                                    {selectedReport.pageSection && (
                                        <DialogDescription className="text-primary font-semibold">
                                            Context: {selectedReport.pageSection}
                                        </DialogDescription>
                                    )}
                                </DialogHeader>
                                
                                <div className="space-y-4 my-4">
                                    <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">Report Details</h4>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {selectedReport.description}
                                        </p>
                                    </div>

                                    {selectedReport.status === 'pending' ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-muted-foreground ml-1">Resolution Note (Emailed to user)</label>
                                            <Textarea 
                                                placeholder="Explain how the issue was fixed or addressed..." 
                                                className="min-h-[100px] bg-muted/20 border-border resize-none"
                                                value={resolutionNote}
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                            />
                                        </div>
                                    ) : selectedReport.adminNotes && (
                                        <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                                            <h4 className="text-xs font-black uppercase text-green-500 mb-2">Resolution Note</h4>
                                            <p className="text-sm italic">
                                                "{selectedReport.adminNotes}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setSelectedReport(null)}>
                                        Close
                                    </Button>
                                    {selectedReport.status === 'pending' && (
                                        <Button 
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                            onClick={() => updateStatusMutation.mutate({ 
                                                id: selectedReport.id, 
                                                status: 'resolved', 
                                                adminNotes: resolutionNote || "Your issue has been resolved." 
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            Mark as Resolved & Notify User
                                        </Button>
                                    )}
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

