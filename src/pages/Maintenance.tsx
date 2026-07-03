import { useQuery } from "@tanstack/react-query";
import { getMaintenanceStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, PowerOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Maintenance() {
  const [_, setLocation] = useLocation();
  const [lastChecked, setLastChecked] = useState(new Date());

  const { data: status, refetch, isLoading } = useQuery<{ enabled: boolean; mode: string; message: string; eta?: string }>({
    queryKey: ["maintenance"],
    queryFn: getMaintenanceStatus,
    refetchInterval: 30000, // Check every 30s
  });


  useEffect(() => {
    if (status && !status.enabled) {
      // If maintenance is over, go home
      setLocation("/");
    }
  }, [status, setLocation]);

  const handleRefresh = async () => {
    setLastChecked(new Date());
    await refetch();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        
        <div className="flex justify-center mb-6">
           <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <PowerOff size={48} className="text-primary" />
           </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black tracking-tight">
            System Maintenance
          </h1>
          <p className="text-muted-foreground">
            {status?.message || "We are currently performing scheduled maintenance to improve your experience."}
          </p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <ShieldAlert className="text-yellow-500" size={20} />
              Status: {status?.mode || "Unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.eta && (
              <div className="bg-muted p-3 rounded-lg text-sm font-medium">
                Estimated Completion: <span className="text-foreground font-bold">{status.eta}</span>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>

            <Button onClick={handleRefresh} variant="outline" className="w-full gap-2" disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Check Status
            </Button>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
           Need urgent help? <a href="mailto:FindATeammate@findateammate.online" className="text-primary hover:underline">Contact Support</a>
        </div>
      </div>
    </div>
  );
}
