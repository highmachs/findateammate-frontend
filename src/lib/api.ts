/**
 * API Adapter Layer
 * 
 * Rule 3: Frontend binds only to adapters
 * UI → adapter → API
 * If the backend changes, only adapters break.
 */

import { apiRequest, clearCsrfToken } from "./queryClient";

// ============================================
// ERROR HANDLING HELPER
// ============================================

/**
 * FIX #14: Consistent error handling for all API functions
 * Provides user-friendly error messages based on error type
 */
function handleApiError(error: unknown, context: string): never {
  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    throw new Error(`Network error - please check your connection (${context})`);
  }
  if (error instanceof Error) {
    if (error.message.includes("503")) {
      throw new Error(`Service temporarily unavailable (${context})`);
    }
    if (error.message.includes("401")) {
      throw new Error("Authentication required. Please log in again.");
    }
    if (error.message.includes("403")) {
      throw new Error("Access denied. You don't have permission for this action.");
    }
    if (error.message.includes("404")) {
      throw new Error(`Resource not found (${context})`);
    }
    // Re-throw with context
    throw new Error(`${error.message} (${context})`);
  }
  throw new Error(`An unexpected error occurred (${context})`);
}

// ============================================
// FILE UPLOAD ADAPTERS
// ============================================

export interface UploadResponse {
  url: string;
}

/**
 * Upload a generic file (images, PDFs)
 * One button → one endpoint → one responsibility (Rule 2)
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await apiRequest("POST", "/api/upload", formData);
    return await res.json();
  } catch (error) {
    // FIX: Distinguish between network errors and server errors
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Network error - please check your connection");
    }
    if (error instanceof Error && error.message.includes("503")) {
      throw new Error("Upload service temporarily unavailable");
    }
    throw error;
  }
}

/**
 * Upload user avatar
 * One button → one endpoint → one responsibility (Rule 2)
 */
export async function uploadAvatar(userId: string, file: File): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await apiRequest("POST", `/api/users/${userId}/avatar`, formData);
    return await res.json();
  } catch (error) {
    handleApiError(error, "avatar upload");
  }
}

export interface ContactMessagePayload {
  firstName: string;
  lastName: string;
  email: string;
  subject: "General Inquiry" | "Technical Support" | "Partnership" | "Feedback";
  message: string;
}

export async function submitContactMessage(data: ContactMessagePayload): Promise<{ success: true; reportId: string }> {
  try {
    const res = await apiRequest("POST", "/api/contact", data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "sending contact message");
  }
}

export async function markTourComplete(userId: string): Promise<void> {
  try {
    await apiRequest("POST", `/api/users/${userId}/tour-complete`);
  } catch (error) {
    handleApiError(error, "saving tour progress");
  }
}

/**
 * Fetch a single public user
 */
export async function getPublicUser(userId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/users/${userId}`);
  if (res.status === 404) return null;
  return await res.json();
}

// ============================================
// USER ADAPTERS
// ============================================

export async function logout() {
  await apiRequest("POST", "/api/logout");
  clearCsrfToken(); // Clear cache to force refresh on next request
}

export async function updateUserProfile(userId: string, data: any): Promise<any> {
  try {
    const res = await apiRequest("PATCH", `/api/users/${userId}`, data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "profile update");
  }
}

// ============================================
// POST ADAPTERS
// ============================================

export async function createTeammatePost(data: any): Promise<any> {
  try {
    const res = await apiRequest("POST", "/api/posts/teammate", data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "post creation");
  }
}

export async function fetchPosts(cursor?: string, limit: number = 20): Promise<{ items: any[], nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.append("cursor", cursor);
  params.append("limit", limit.toString());
  
  const res = await apiRequest("GET", `/api/posts?${params.toString()}`);
  return await res.json();
}

export async function getPost(postId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/posts/${postId}`);
  return await res.json();
}



export async function createEventPost(data: any): Promise<any> {
  try {
    const res = await apiRequest("POST", "/api/posts/event", data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "event creation");
  }
}

export async function updatePost(postId: string, data: any): Promise<any> {
  const res = await apiRequest("PATCH", `/api/posts/${postId}`, data);
  return await res.json();
}

export async function deletePost(postId: string): Promise<void> {
  await apiRequest("DELETE", `/api/posts/${postId}`);
}

export async function upvotePost(postId: string): Promise<void> {
  try {
    await apiRequest("POST", `/api/posts/${postId}/upvote`, {});
  } catch (error) {
    handleApiError(error, "event upvote");
  }
}

export async function downvotePost(postId: string): Promise<void> {
  try {
    await apiRequest("POST", `/api/posts/${postId}/downvote`, {});
  } catch (error) {
    handleApiError(error, "event downvote");
  }
}

export async function fulfillPost(postId: string): Promise<void> {
  await apiRequest("DELETE", `/api/posts/${postId}`);
}

// ============================================
// EVENT REGISTRATION ADAPTERS
// ============================================

export async function registerForEvent(eventId: string): Promise<any> {
  const res = await apiRequest("POST", `/api/events/${eventId}/register`, {});
  return await res.json();
}

export async function getEventMatchScore(eventId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/events/${eventId}/match-score`);
  return await res.json();
}

export async function getEventRegistrations(eventId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/events/${eventId}/registrations`);
  return await res.json();
}

export async function approveEventRegistration(eventId: string, registrationId: string): Promise<any> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}/registrations/${registrationId}/approve`, {});
  return await res.json();
}

export async function rejectEventRegistration(eventId: string, registrationId: string, reason: string): Promise<any> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}/registrations/${registrationId}/reject`, { reason });
  return await res.json();
}

export async function approveAllEventRegistrations(eventId: string): Promise<any> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}/registrations/approve-all`, {});
  return await res.json();
}

export async function rejectAllEventRegistrations(eventId: string, reason: string): Promise<any> {
  const res = await apiRequest("PATCH", `/api/events/${eventId}/registrations/reject-all`, { reason });
  return await res.json();
}

export async function deleteEventRegistration(eventId: string, registrationId: string): Promise<any> {
  const res = await apiRequest("DELETE", `/api/events/${eventId}/registrations/${registrationId}`);
  return await res.json();
}

// ============================================
// CONNECTION REQUEST ADAPTERS
// ============================================

// Note: backend uses req.user!.id from session, the userId param is kept for
// call-site compatibility only and is NOT sent to the server.
export async function fetchRequests(_userId?: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/requests`);
  return await res.json();
}

export async function createConnectionRequest(data: any): Promise<any> {
  try {
    const res = await apiRequest("POST", "/api/requests", data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "connection request");
  }
}

export async function acceptRequest(requestId: string): Promise<void> {
  await apiRequest("POST", `/api/requests/${requestId}/accept`);
}

export async function rejectRequest(requestId: string): Promise<void> {
  await apiRequest("POST", `/api/requests/${requestId}/reject`);
}

export async function deleteRequest(requestId: string): Promise<void> {
  await apiRequest("DELETE", `/api/requests/${requestId}`);
}

// ============================================
// MESSAGE ADAPTERS
// ============================================

export async function sendMessage(data: { chatId: string; text: string }): Promise<any> {
  try {
    const res = await apiRequest("POST", `/api/chats/${data.chatId}/messages`, data);
    return await res.json();
  } catch (error) {
    handleApiError(error, "message send");
  }
}

export async function fetchChats(userId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/chats?userId=${userId}`);
  return await res.json();
}

export async function fetchMessages(chatId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/chats/${chatId}/messages`);
  return await res.json();
}

export async function clearChat(chatId: string): Promise<void> {
  await apiRequest("POST", `/api/chats/${chatId}/clear`);
}

// ============================================
// NOTIFICATION ADAPTERS
// ============================================

export async function fetchNotifications(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/notifications");
  return await res.json();
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiRequest("POST", `/api/notifications/${notificationId}/read`);
}

// ============================================
// ADMIN ADAPTERS
// ============================================

export async function getAdminStats(): Promise<any> {
  const res = await apiRequest("GET", "/api/admin/stats");
  return await res.json();
}

export async function getAdminUsers(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/admin/users");
  return await res.json();
}

export async function getAdminUserDetails(userId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/admin/users/${userId}`);
  return await res.json();
}

export async function promoteUser(userId: string, isAdmin: boolean): Promise<any> {
  const res = await apiRequest("POST", `/api/admin/promote/${userId}`, { isAdmin });
  return await res.json();
}

export async function promoteOrganiser(userId: string, isOrganiser: boolean): Promise<any> {
  const res = await apiRequest("POST", `/api/admin/promote-organiser/${userId}`, { isOrganiser });
  return await res.json();
}

export async function deleteUser(userId: string): Promise<void> {
  await apiRequest("DELETE", `/api/admin/users/${userId}`);
}

export async function banUser(userId: string, reason: string): Promise<any> {
  const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason });
  return await res.json();
}

export async function unbanUser(userId: string): Promise<any> {
  const res = await apiRequest("POST", `/api/admin/users/${userId}/unban`);
  return await res.json();
}

export async function adminDeletePost(postId: string): Promise<void> {
  await apiRequest("DELETE", `/api/admin/posts/${postId}`);
}

// ============================================
// ORGANISER ADAPTERS
// ============================================

export async function getOrganizerEvents(): Promise<any[]> {
  const res = await apiRequest("GET", "/api/organiser/events");
  return await res.json();
}

export async function getOrganizerDashboard(eventId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/organiser/dashboard/${eventId}`);
  return await res.json();
}

// ============================================
// ADMIN ORGANISER MANAGEMENT ADAPTERS
// ============================================

export async function getAdminOrganisers(page: number = 1, limit: number = 10): Promise<any> {
  const res = await apiRequest("GET", `/api/admin/organisers?page=${page}&limit=${limit}`);
  return await res.json();
}

export async function getAdminOrganizerEvents(userId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/admin/organisers/${userId}/events`);
  return await res.json();
}

export async function getAdminOrganizerDashboard(userId: string, eventId: string): Promise<any> {
  const res = await apiRequest("GET", `/api/admin/organisers/${userId}/dashboard/${eventId}`);
  return await res.json();
}

// ============================================
// SUPPORT & REPORTING ADAPTERS
// ============================================

/**
 * Submit a new report or feedback
 */
export async function submitReport(data: any): Promise<any> {
  const res = await apiRequest("POST", "/api/reports", data);
  return await res.json();
}

/**
 * Fetch reports for admin moderation
 */
export async function getAdminReports(status?: string, search?: string): Promise<any> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  if (search) params.append("search", search);
  
  const res = await apiRequest("GET", `/api/admin/reports?${params.toString()}`);
  return await res.json();
}

/**
 * Update report status with resolution notes
 */
export async function updateReportStatus(id: string, status: string, adminNotes?: string): Promise<any> {
  const res = await apiRequest("PATCH", `/api/admin/reports/${id}`, { status, adminNotes });
  return await res.json();
}

export async function submitFeedback(data: any) {
  const res = await apiRequest("POST", "/api/feedback", data);
  return await res.json();
}

export async function deleteReports(ids: string[]): Promise<void> {
  const params = new URLSearchParams();
  params.append("ids", ids.join(","));
  await apiRequest("DELETE", `/api/admin/reports?${params.toString()}`);
}

export async function deleteAllReports(): Promise<void> {
  await apiRequest("DELETE", `/api/admin/reports?all=true`);
}

// ============================================
// SYSTEM ADAPTERS
// ============================================

export async function getMaintenanceStatus(): Promise<any> {
  const res = await apiRequest("GET", "/api/maintenance");
  return await res.json();
}

export async function updateSystemStatus(data: any): Promise<any> {
  const res = await apiRequest("POST", "/api/maintenance", data);
  return await res.json();
}

/**
 * Check if a username is available in real-time
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
  const res = await apiRequest("GET", `/api/auth/check-username?username=${username}`);
  return await res.json();
}

/**
 * Submit onboarding details for Google OAuth users
 */
export async function submitOnboarding(data: { 
  username: string; 
  department: string;
  skills: string[];
  bio?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  city: string;
  university: string;
}): Promise<any> {
  const res = await apiRequest("POST", "/api/auth/onboarding", data);
  return await res.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("POST", "/api/notifications/read-all");
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiRequest("DELETE", `/api/notifications/${notificationId}`);
}

export async function deleteAllNotifications(): Promise<void> {
  await apiRequest("DELETE", "/api/notifications/all");
}

export interface AnalyticsEvent {
  event: string;
  page: string;
  metadata?: Record<string, any>;
}

export async function logEvent(data: AnalyticsEvent): Promise<void> {
  // Fire and forget - don't block UI
  apiRequest("POST", "/api/analytics", data).catch(err => 
    console.error("Failed to log analytics:", err)
  );
}

/**
 * Permanently delete the authenticated user's account
 * This action cannot be undone
 */
export async function deleteAccount(): Promise<void> {
  try {
    await apiRequest("DELETE", "/api/users/me");
    clearCsrfToken(); // Clear CSRF token after account deletion
  } catch (error) {
    handleApiError(error, "account deletion");
  }
}
