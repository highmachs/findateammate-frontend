import { useQuery, useMutation } from "@tanstack/react-query";
import { updateSystemStatus, getMaintenanceStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ShieldAlert, AlertTriangle, CheckCircle2, Power, AlertOctagon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type MaintenanceStatus = {
  enabled: boolean;
  mode: "OFF" | "PARTIAL" | "FULL";
  message: string;
  eta?: string;
};

export function MaintenancePanel() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MaintenanceStatus>({
    enabled: false,
    mode: "OFF",
    message: "",
    eta: ""
  });

  const { data: status, isLoading } = useQuery<MaintenanceStatus>({
    queryKey: ["maintenance"],
    queryFn: getMaintenanceStatus,
    refetchInterval: 5000,
  });

  // Sync state with server data if not editing? 
  // Actually, better to just load init state.
  useEffect(() => {
    if (status) {
        setFormData({
            enabled: status.enabled,
            mode: status.mode,
            message: status.message || "System is under maintenance.",
            eta: status.eta || ""
        });
    }
  }, [status]);

  const mutation = useMutation({
    mutationFn: updateSystemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      toast({ title: "System status updated successfully" });
    },
    onError: (err: any) => {
      toast({ 
        title: "Failed to update status", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  const handleApply = () => {
    mutation.mutate(formData);
  };

  const handleModeChange = (val: "OFF" | "PARTIAL" | "FULL") => {
    setFormData(prev => ({ 
        ...prev, 
        mode: val,
        enabled: val !== "OFF"
    }));
  };

  if (isLoading) return <div>Loading status...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            System Control
          </CardTitle>
          <CardDescription>
            Manage the global maintenance state of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base">Maintenance Mode</Label>
            <RadioGroup 
                value={formData.mode} 
                onValueChange={(v) => handleModeChange(v as any)}
                className="grid grid-cols-1 gap-4"
            >
              <div className={cn(
                  "flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-all hover:bg-accent",
                  formData.mode === "OFF" ? "border-green-500 bg-green-500/5 ring-1 ring-green-500" : ""
              )}>
                <RadioGroupItem value="OFF" id="off" />
                <div className="flex-1">
                    <Label htmlFor="off" className="font-bold cursor-pointer text-green-600 dark:text-green-400">Live (Normal Operation)</Label>
                    <p className="text-sm text-muted-foreground">The system is fully operational. All users have access.</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>

              <div className={cn(
                  "flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-all hover:bg-accent",
                  formData.mode === "PARTIAL" ? "border-yellow-500 bg-yellow-500/5 ring-1 ring-yellow-500" : ""
              )}>
                <RadioGroupItem value="PARTIAL" id="partial" />
                <div className="flex-1">
                    <Label htmlFor="partial" className="font-bold cursor-pointer text-yellow-600 dark:text-yellow-400">Partial Maintenance (Read-Only)</Label>
                    <p className="text-sm text-muted-foreground">Users can view content but cannot create posts, messages, or requests.</p>
                </div>
                 <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>

              <div className={cn(
                  "flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-all hover:bg-accent",
                  formData.mode === "FULL" ? "border-destructive bg-destructive/5 ring-1 ring-destructive" : ""
              )}>
                <RadioGroupItem value="FULL" id="full" />
                <div className="flex-1">
                    <Label htmlFor="full" className="font-bold cursor-pointer text-destructive">Full Maintenance (Offline)</Label>
                    <p className="text-sm text-muted-foreground">The site is inaccessible to non-admins. Maintenance page is shown.</p>
                </div>
                 <AlertOctagon className="h-5 w-5 text-destructive" />
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-2">
              <Label htmlFor="message">Display Message</Label>
              <Input 
                id="message" 
                placeholder="e.g., We are upgrading the database..." 
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">This message will be shown to users on the maintenance page or banner.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eta">Estimated Completion (Optional)</Label>
              <Input 
                id="eta" 
                placeholder="e.g., 2 hours, 14:00 UTC" 
                value={formData.eta || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            className="w-full" 
            variant={formData.mode === "FULL" ? "destructive" : "default"}
            onClick={handleApply}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Updating..." : "Update System Status"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status Preview</CardTitle>
          <CardDescription>
            This is how the system currently behaves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="rounded-lg border p-6 flex flex-col items-center justify-center text-center space-y-4 bg-background/50">
                {status?.mode === "FULL" && (
                     <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertOctagon size={32} className="text-destructive" />
                     </div>
                )}
                {status?.mode === "PARTIAL" && (
                     <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <AlertTriangle size={32} className="text-yellow-500" />
                     </div>
                )}
                 {(!status?.mode || status?.mode === "OFF") && (
                     <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-green-500" />
                     </div>
                )}

                <div className="space-y-1">
                    <h3 className="font-bold text-xl">
                        {status?.mode === "FULL" && "System Offline"}
                        {status?.mode === "PARTIAL" && "Read-Only Mode"}
                        {(!status?.mode || status?.mode === "OFF") && "All Systems Operational"}
                    </h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        {status?.message || "No active notices."}
                    </p>
                    {status?.eta && (
                        <p className="text-xs font-mono bg-muted py-1 px-2 rounded-md inline-block mt-2">
                            ETA: {status.eta}
                        </p>
                    )}
                </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                <p className="font-semibold flex items-center gap-2">
                    <ShieldAlert size={14} /> Admin Access
                </p>
                <p className="text-muted-foreground">
                    As an administrator, you always bypass maintenance mode restrictions. You can continue to use the site normally even when functionality is disabled for other users.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
