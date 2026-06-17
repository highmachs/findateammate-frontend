# FindATeammate - Current Features 🚀

FindATeammate is a comprehensive platform designed for developers, designers, and visionaries to connect, collaborate, and build amazing projects together.

## 🌟 Core Features

### 1. Real-Time Communication
- **Instant Messaging**: Powered by **Socket.io**, enabling real-time chat between teammates.
- **Chat Rooms**: Private chat spaces created automatically once a connection request is accepted.
- **Message Persistence**: All chats are saved in the database for future reference.

### 2. Progressive Web App (PWA) 📱
- **Installable**: Can be added to the home screen on iOS, Android, and Desktop.
- **Custom Branding**: Features a unique, modern app icon and manifest with primary theme colors.
- **Native Feel**: Optimized for a slick, standalone mobile experience.

### 3. Professional Profile Management
- **Custom Profiles**: Users can list their skills, bio, portfolio, GitHub, and more.
- **Secure File Uploads**: Upload profile pictures directly via **Multer**-integrated backend.
- **Multi-Tenancy & Privacy**: Strict authorization ensures only you can edit your profile. Privacy switches for Email, Portfolio, and University.

### 4. Teammate & Event Discovery
- **Post Search**: Browse for teammates based on skills offered and skills wanted.
- **Event Integration**: Specific posting for Hackathons, Competitions, and Conferences.
- **Voting System**: Upvote/Downvote events to highlight the most popular opportunities.
- **Rate Limiting**: Intelligent limits (50 posts per 48h) to prevent spam while allowing active usage.

### 5. Connection Workflow
- **Requests**: Send connection requests with custom messages.
- **Approvals**: Once a request is accepted, a real-time chat is instantly unlocked.
- **Management**: Easily view and manage pending and received requests.

### 6. Authentication & Security
- **Full Auth Suite**: Secure Login, Register, and Logout functionality.
- **Google OAuth (Ready for Integration)**: UI placeholder implemented with a sleek Google button.
- **Session Management**: Secure session handling with cookie-based affinity.
- **Password Hashing**: Top-tier security using **Argon2** encryption.

### 7. Modern UI/UX & Design
- **Premium Aesthetics**: Glassmorphism, vibrant gradients, and smooth micro-animations.
- **AhiLight Branding**: Integrated throughout the application (legal pages, footer, auth).
- **Responsive Layout**: Fully optimized for Desktop, Tablet, and Mobile screens.

### 8. SEO & Social 🚀
- **OpenGraph Integration**: Rich previews when links are shared on Twitter, LinkedIn, or Discord.
- **Dynamic Meta Tags**: Title and description tags optimized for search engines.

### 9. Advanced Security & Password Recovery
- **Stateless Single-Use Tokens**: Secure 15-minute expiring JWT tokens for password reset flows that instantly self-destruct upon use by validating against the current database password hash.
- **Automated Transactional Emails**: Integrated Resend API to deliver automated Welcome Emails upon registration and Secure Password Reset links.

### 10. Real-Time Data Sync & Caching
- **Intelligent Cache Invalidation**: Full integration with TanStack Query for instantaneous dashboard updates and state synchronization across the platform without requiring page reloads (e.g., creating patients, booking appointments, and deleting records).

### 11. Compliance & Legal
- **Legal Pages**: Dedicated, SEO-optimized pages for Privacy Policy and Terms & Conditions to maintain trust and legal compliance.

---
*Product by AhiLight*
