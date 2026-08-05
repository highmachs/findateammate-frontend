import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API Base URL - Vercel rewrites handle proxying in production,
// but VITE_API_URL can override for direct backend access
function normalizeApiBaseUrl(raw?: string): string {
  const value = (raw || "").trim();
  if (!value) return "";
  // Normalize trailing slash so URL joins stay predictable.
  return value.replace(/\/+$/, "");
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE_URL) return normalizedPath;

  // Guard against common env format: VITE_API_URL ending with /api
  // while callers already pass paths like /api/upload.
  const baseEndsWithApi = /\/api$/i.test(API_BASE_URL);
  const pathStartsWithApi = /^\/api\//i.test(normalizedPath);
  const dedupedPath = baseEndsWithApi && pathStartsWithApi
    ? normalizedPath.replace(/^\/api/i, "")
    : normalizedPath;

  return `${API_BASE_URL}${dedupedPath}`;
}

// Keep empty by default so same-origin requests use Vercel rewrites.
// This preserves session cookies and avoids cross-origin CORS issues.
// On Vercel, the API and frontend share the same origin, so API_BASE_URL is empty.
export const API_BASE_URL: string = "";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 503) {
      // Trigger global maintenance check immediately
      window.dispatchEvent(new Event("maintenance_503"));
      // CRITICAL FIX: Throw error for 503 so caller knows request failed
      throw new Error("Server is under maintenance (503)");
    }
    let message = res.statusText;
    let errorCode: string | undefined;

    try {
      const body = await res.json();
      message = body.message || body.error || message;
      errorCode = body.code;

    } catch (e) {
      // Body is not JSON or empty
    }

    // Handle ONBOARDING_REQUIRED error by redirecting to onboarding page
    if (res.status === 403 && errorCode === "ONBOARDING_REQUIRED") {
      window.location.href = "/onboarding";
      throw new Error(message || "Please complete your profile first");
    }

    if (res.status === 403) {
      // CSRF token might be invalid or expired
      csrfToken = null;
    }
    throw new Error(message || "An error occurred");
  }
}

let csrfToken: string | null = null;

async function getCsrfToken(forceRefresh = false) {
  // FIX: Allow CSRF token refresh when 403 is encountered
  if (csrfToken && !forceRefresh) return csrfToken;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timed out after 30s"), 30000); // 30s timeout

    try {
      console.log('inside getcsrf token start-------')
      const res = await fetch(buildApiUrl("/api/csrf-token"), {
        credentials: "include",
        signal: controller.signal
      });
      console.log('inside getcsrf token end---------')
      if (res.ok) {
        const data = await res.json();
        csrfToken = data.csrfToken;
        return csrfToken;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e) {
    console.error("Failed to fetch CSRF token", e);
  }
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | FormData | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};

  // Set JSON content-type only if it's not FormData
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const isMutatingRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());

  if (isMutatingRequest) {
    const token = await getCsrfToken();
    if (token) {
      headers["x-csrf-token"] = token;
    }
  }

  const fullUrl = url.startsWith("http") ? url : buildApiUrl(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("Request timed out after 30s"), 30000); // 30s timeout

  try {
    let res = await fetch(fullUrl, {
      method,
      headers,
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
      signal: controller.signal,
    });

    // If CSRF token expired, refresh and retry once transparently.
    if (isMutatingRequest && res.status === 403) {
      const refreshedToken = await getCsrfToken(true);
      if (refreshedToken) {
        headers["x-csrf-token"] = refreshedToken;
        res = await fetch(fullUrl, {
          method,
          headers,
          body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
          credentials: "include",
          signal: controller.signal,
        });
      }
    }

    await throwIfResNotOk(res);
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = queryKey.join("/") as string;
      const fullUrl = url.startsWith("http") ? url : buildApiUrl(url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort("Request timed out after 30s"), 30000); // 30s timeout

      try {
        const res = await fetch(fullUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } finally {
        clearTimeout(timeoutId);
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable window focus refetching
      staleTime: 0, // Data is always stale, forcing a background refetch
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
