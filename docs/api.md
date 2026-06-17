# API Documentation

This document exhaustively details every API endpoint and Real-Time event in the system.
**Note:** All protected routes require a valid session cookie.

## **Security & Performance Notes**

### Recent Security Hardening:
- ✅ **CSRF Protection**: All mutating requests (POST, PATCH, DELETE) **MUST** include `x-csrf-token` header.
- ✅ **Secure Cookies**: Cookies are `secure: true` in production.
- ✅ **Rate Limiting**: Applied to Auth, Voting, and Password Reset endpoints.
- ✅ **Input Validation**: Strict Zod schema validation on all inputs.

### System Policies:
- 🕒 **Data Retention**: Messages, Chats, and Posts are automatically deleted **36 hours** after creation.

---

## **Real-Time (Socket.IO)**
The backend serves a Socket.IO server at `/socket.io/`.
**Connection:** Requires valid session cookie (same as REST API). Automatic authentication on handshake.

### **Client -> Server Events**
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `join_chat` | `chatId` (string) | Joins a specific chat room. **Server checks if user is a participant.** |
| `leave_chat` | `chatId` (string) | Leaves a specific chat room. |

### **Server -> Client Events**
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `receive_message` | `Message` (Object) | Emitted to room `chatId` when a new message is sent. |
| `chat_updated` | `{ chatId: string }` | Emitted to specific users when a connection request is accepted (Chat created). |
| `notification` | *(No Payload)* | Signal to refetch notifications (New request, etc.). |

---

## **Authentication & Security**

### **Get CSRF Token**
**CRITICAL:** Must be called before any POST/PATCH/DELETE request to get the token.
- **Method:** `GET`
- **Route:** `/api/csrf-token`
- **Response:**
  ```json
  {
    "csrfToken": "string"
  }
  ```

### **Register User**
- **Method:** `POST`
- **Route:** `/api/register`
- **Request:**
  ```json
  {
    "name": "string (1-100 chars)",
    "username": "string (1-50 chars)",
    "email": "string (email)",
    "password": "string (min 8 chars)",
    "skill": "string",
    "bio": "string",
    "portfolio": "url string",
    "github": "url string",
    "twitter": "url string (optional)",
    "linkedin": "url string (optional)",
    "university": "string (optional)",
    "city": "string (optional)",
    "avatar": "string (optional)",
    "skillLevel": "Beginner|Intermediate|Expert (optional)",
    "privacy": {
      "showEmail": boolean,
      "showPortfolio": boolean,
      "showUniversity": boolean,
      "showCity": boolean
    }
  }
  ```
- **Response:** `User object` (without password)

### **Login**
- **Method:** `POST`
- **Route:** `/api/login`
- **Headers:** `x-csrf-token: <value>`
- **Request:** `{ "email": "...", "password": "..." }`
- **Response:** `User object`

### **Logout**
- **Method:** `POST`
- **Route:** `/api/logout`
- **Response:** `{ "message": "Logged out successfully" }`

### **Password Reset**
- **Request:** `POST /api/password-reset` -> `{ "email": "..." }`
- **Confirm:** `POST /api/password-reset/confirm` -> `{ "token": "...", "password": "..." }`

### **Email Verification**
- **Verify:** `GET /api/verify-email?token=...` -> Redirects to login with `?verified=true`
- **Resend:** `POST /api/resend-verification` -> `{ "message": "Verification email sent" }`

### **Google Auth**
- **Start:** `GET /api/auth/google`
- **Callback:** `GET /api/auth/google/callback`
- **Onboarding:** `POST /api/auth/onboarding` (Only for new Google users) -> `{ "username": "...", "skill": "...", "bio": "..." }`

### **Check Username**
- `GET /api/auth/check-username?username=...` -> `{ "available": boolean }`

### **Get Current User**
- `GET /api/me` -> `User object` or `null` or `401`

---

## **Users**

### **Get Profile**
- `GET /api/users/:id` -> `User object` (Masked based on privacy settings)

### **Update Profile**
- `PATCH /api/users/:id` -> Request: `Partial<User>` -> Response: `Updated User`

### **Change Password**
- `POST /api/users/:id/change-password` -> `{ "currentPassword": "...", "newPassword": "..." }`

### **Upload Avatar**
- `POST /api/users/:id/avatar` -> Multipart Form (`avatar` file) -> Response: `Updated User`

### **Delete Account (Self)**
- `DELETE /api/users/me` -> `{ "success": true, "message": "Account deleted successfully" }`

---

## **Posts**

### **Get Posts**
- `GET /api/posts?limit=20&cursor=DATE` -> `Array<Post>` or `{ items: [...], nextCursor: "..." }`

### **Get Single Post**
- `GET /api/posts/:id` -> `Post object`

### **Create Teammate Post**
- **Method:** `POST`
- **Route:** `/api/posts/teammate`
- **Limit:** 1 per 48h
- **Request:**
  ```json
  {
    "title": "string",
    "description": "string",
    "city": "string",
    "availability": "string",
    "skillsOffered": [{ "name": "...", "level": "..." }],
    "skillsWanted": [{ "name": "...", "level": "..." }],
    "projectType": "string"
  }
  ```

### **Create Event Post**
- **Method:** `POST`
- **Route:** `/api/posts/event`
- **Limit:** 5 per 48h
- **Request:** Same as Teammate + `eventName`, `eventWebsite`, `eventImage`, `eventDetails`.

### **Interact**
- `PATCH /api/posts/:id` -> Update
- `DELETE /api/posts/:id` -> Delete
- `POST /api/posts/:id/upvote` -> Upvote Event
- `POST /api/posts/:id/downvote` -> Downvote Event

---

## **Connection Requests**

- `GET /api/requests` -> `Array<Request>`
- `POST /api/requests` -> `{ "postId": "...", "toUserId": "...", ... }`
- `POST /api/requests/:id/accept`
- `POST /api/requests/:id/reject`
- `DELETE /api/requests/:id`

---

## **Messages (Chats)**

- `GET /api/chats?userId=...` -> `Array<Chat>`
- `GET /api/chats/:chatId/messages?before=DATE` -> `Array<Message>`
- `POST /api/chats/:chatId/messages` -> `{ "text": "...", "senderId": "..." }`
- `POST /api/chats/:chatId/clear` -> Clear history for self

---

## **Notifications**

- `GET /api/notifications`
- `POST /api/notifications/read-all`
- `POST /api/notifications/:id/read`
- `DELETE /api/notifications/all`
- `DELETE /api/notifications/:id`

---

## **Dashboard (DAP)**

### **Get Dashboard Data**
- **Method:** `GET`
- **Route:** `/api/dashboard`
- **Response:**
  ```json
  {
    "user": { ...UserObject },
    "unreadCount": 5,
    "feed": {
      "items": [ ...Posts ],
      "nextCursor": "2023-10-27T10:00:00Z"
    }
  }
  ```

---

## **Reports & Feedback**

### **Submit Report**
- `POST /api/reports` -> `{ "type": "bug|feedback", "subject": "...", "description": "...", "pageSection": "..." }`

### **Submit Feedback (Legacy)**
- `POST /api/feedback` -> `{ "feedback": "...", "rating": 5 }`

---

## **Admin API**

### **User Management**
- `GET /api/admin/users`: List users (masked emails)
- `POST /api/admin/promote/:id`: `{ "isAdmin": boolean }`
- `DELETE /api/admin/users/:id`
- `DELETE /api/admin/posts/:id`
- `GET /api/admin/feedback`: List user feedback (Limit 50)
- `GET /api/admin/reports`: List support reports
- `PATCH /api/admin/reports/:id`: Update status (`pending`, `resolved`, `dismissed`) + `adminNotes`
- `DELETE /api/admin/reports`: Batch delete reports (Query: `?ids=1,2,3` or `?all=true`)

### **Stats & Analytics**
- `GET /api/admin/stats`
  - **Response:**
  ```json
  {
    "totalUsers": 100,
    "totalPosts": 50,
    "totalEvents": 10,
    "totalReports": 5,
    "pendingReports": 2,
    "postsByDate": { "2023-10-25": 10, "2023-10-24": 5 },
    "skills": { "React": 20, "Node.js": 15 }
  }
  ```

- `GET /api/admin/analytics`
  - **Response:**
  ```json
  {
    "userGrowth": [{ "date": "2023-10-01", "count": 10 }],
    "engagementMetrics": {
      "dau": 150,
      "mau": 3000,
      "avgSessionDuration": 12.5,
      "retention7Day": 45.2
    },
    "featureUsage": [{ "feature": "chat", "usage": 500 }],
    "userFeedback": []
  }
  ```

### **Observability & Exports**
- `POST /api/observability/errors`: Log client error
- `POST /api/analytics`: Log generic event
- `POST /api/observability/audit`: Log audit event
- `GET /api/admin/observability/audit`: View logs
- `GET /api/admin/observability/errors`: View errors
- `DELETE /api/admin/observability/errors`: Clear errors

**CSV Downloads:**
- `GET /api/admin/audit/download` (Audit Logs CSV)
- `GET /api/admin/observability/audit/export` (Audit Logs Custom Date)
- `GET /api/admin/observability/errors/export` (Error Logs CSV)
- `GET /api/admin/export/users` (Users CSV)
- `GET /api/admin/analytics/export` (Analytics Events CSV)
- `GET /api/admin/export/training-data` (JSON Dump for ML)

---

## **System**

- `GET /`: Root check
- `GET /api/health`: Health check (`{ "status": "ok", "db": "connected" }`)
- `GET /api/status`: System status
- `GET /api/maintenance`: Check mode
- `POST /api/maintenance`: Set mode (`{ "enabled": true, "mode": "FULL", "message": "...", "eta": "..." }`)

---

## **Uploads**

### **Generic File Upload**
- **Method:** `POST`
- **Route:** `/api/upload`
- **Content-Type:** `multipart/form-data`
- **Key:** `file`
- **Validations:** Signature checked (Magic numbers) for images/pdf.
- **Response:** `{ "url": "/uploads/filename.ext" }`
