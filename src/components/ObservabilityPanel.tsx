import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Trash2 } from "lucide-react";
import { useObservability } from "@/hooks/use-observability";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function ObservabilityPanel() {
  const { fetchAuditLogs } = useObservability();
  const queryClient = useQueryClient();

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      await fetchAuditLogs();
      return useObservability.getState().auditLogs;
    }
  });

  const handleClearAudit = async () => {
    try {
      await apiRequest("DELETE", "/api/admin/observability/audit");
      queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
    } catch (err) {
      console.error("Clear audit failed", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Audit Trail
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAudit}
              disabled={auditLogs.length === 0}
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await apiRequest("GET", "/api/admin/audit/download");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Download failed", error);
                }
              }}
            >
              <Download size={16} className="mr-2" />
              Download Audit Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {auditLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.resource}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
