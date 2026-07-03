import { create } from "zustand";
import { apiRequest } from "@/lib/queryClient";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
}

interface ObservabilityState {
  auditLogs: AuditLog[];

  // Actions
  fetchAuditLogs: () => Promise<void>;
}

export const useObservability = create<ObservabilityState>((set) => ({
  auditLogs: [],

  fetchAuditLogs: async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/observability/audit");
      const logs = await res.json();
      set({ auditLogs: logs });
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  }
}));
