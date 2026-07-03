import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, MessageSquare, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  engagementMetrics: {
    dau: number;
    mau: number;
    avgSessionDuration: number;
    retention7Day: number;
  };
  featureUsage: { feature: string; usage: number }[];
  userFeedback: { id: string; userId: string; userName: string; feedback: string; rating: number; timestamp: string }[];
}

interface PersonalizationMetrics {
  days: number;
  ctr: number;
  connectionRate: number;
  trackedSearches: number;
  trackedInteractions: number;
}

import { useState } from "react";

export function AnalyticsPanel() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [personalizationDays, setPersonalizationDays] = useState(30);

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["analytics", startDate, endDate],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      const res = await apiRequest("GET", `/api/admin/analytics?${query.toString()}`);
      return res.json();
    }
  });

  const { data: personalizationMetrics } = useQuery<PersonalizationMetrics>({
    queryKey: ["personalization-metrics", personalizationDays],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/personalization/metrics?days=${personalizationDays}`);
      return res.json();
    }
  });

  const exportTrainingData = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/export/training-data");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-data-${Date.now()}.json`;
      a.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const exportUserData = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/export/users");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${Date.now()}.csv`;
      a.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const exportAnalytics = async () => {
    try {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const res = await apiRequest("GET", `/api/admin/analytics/export?${query.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${startDate || 'all'}-to-${endDate || 'now'}.csv`;
      a.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.dau}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.mau}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session (min)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.avgSessionDuration}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Retention</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementMetrics.retention7Day}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personalization Health</CardTitle>
          <select
            value={personalizationDays}
            onChange={(e) => setPersonalizationDays(Number(e.target.value))}
            className="px-3 py-1 text-sm border rounded-lg bg-background"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Recommendation CTR</div>
              <div className="text-2xl font-bold">{((personalizationMetrics?.ctr || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Connection Rate</div>
              <div className="text-2xl font-bold">{((personalizationMetrics?.connectionRate || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Tracked Searches</div>
              <div className="text-2xl font-bold">{personalizationMetrics?.trackedSearches || 0}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">Tracked Interactions</div>
              <div className="text-2xl font-bold">{personalizationMetrics?.trackedInteractions || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {analytics.userGrowth.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={analytics.userGrowth}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                   <YAxis allowDecimals={false} fontSize={12} />
                   <Tooltip />
                   <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No growth data yet
                </div>
             )}
          </CardContent>
        </Card>

        {/* Feature Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.featureUsage} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="feature" type="category" width={100} fontSize={12} />
                <Tooltip />
                <Bar dataKey="usage" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Feedback */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            User Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.userFeedback.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.userFeedback.map((fb) => (
                  <TableRow key={fb.id}>
                    <TableCell className="font-medium">{fb.userName}</TableCell>
                    <TableCell className="max-w-md truncate">{fb.feedback}</TableCell>
                    <TableCell>
                      <Badge variant={fb.rating >= 4 ? "default" : "secondary"}>
                        {fb.rating}/5
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(fb.timestamp), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No feedback submitted yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Data Export</CardTitle>
          <div className="flex items-center gap-2">
            <input 
                type="date" 
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-muted-foreground">-</span>
            <input 
                type="date" 
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
            />
            <Button onClick={exportAnalytics} variant="default" size="sm">
                <Download size={16} className="mr-2" />
                Export Analytics CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={exportTrainingData} variant="outline">
            <Download size={16} className="mr-2" />
            Export Training Data (JSON)
          </Button>
          <Button onClick={exportUserData} variant="outline">
            <Download size={16} className="mr-2" />
            Export Users (CSV)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
