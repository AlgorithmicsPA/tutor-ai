# Tutor IA - AI-Powered Interactive Learning Platform

## Overview

Tutor IA is an educational platform designed for children aged 7-9, teaching them about **Artificial Intelligence** and how to use AI assistants like OpenAI and Gemini. The application delivers structured lessons with quizzes, interactive widgets, and chat-based tutoring using multiple AI providers (OpenAI GPT and Google Gemini). The platform focuses on making learning engaging through a child-friendly Material Design interface with custom adaptations for educational contexts.

## User Preferences

- Preferred communication language: **Spanish**
- Preferred communication style: Simple, everyday language
- Content focus: Teaching about **Artificial Intelligence** (how to use OpenAI and Gemini), not mathematics

## Recent Changes (October 31, 2025)

### Complete Authentication System Implementation
- **User Authentication**: Passport.js with local strategy (username/password)
- **Secure Password Hashing**: Scrypt algorithm with per-user salts
- **Session Management**: PostgreSQL-backed sessions with express-session + connect-pg-simple
- **Role-Based Access Control**: Two roles (admin/student) with route protection
- **Security Hardening**: Password hashes sanitized from all API responses (never sent to client)
- **Protected Routes**: All application routes require authentication; admin routes require admin role
- **Auth UI**: Material Design login/register page with form validation and error handling

### Student/Admin Separation Architecture
- **Student Area (/)**: Home page displays only published lessons with double filtering (backend + frontend) for security
- **Admin Area (/admin)**: Dashboard with statistics, quick actions, and lesson management
- **Navigation**: Clear separation maintained - admin buttons always return to /admin context
- **Security**: Separate endpoints ensure students never see draft content; role-based access enforced

### Complete Admin Panel with Sidebar Navigation
- **AdminLayout**: Shadcn sidebar-based navigation for all admin routes (Dashboard, Lecciones, Usuarios, Seguimiento)
- **User Management Page**: Full CRUD interface for managing users with create/edit modal and interactive table
- **Progress Tracking Page**: Comprehensive student progress monitoring with aggregated statistics and individual metrics
- **Division-by-Zero Protection**: Robust validation in both frontend and backend to prevent NaN values in progress calculations
- **Quiz Score Normalization**: Backend handles both legacy (numeric) and current (object) quiz score formats
- **Responsive Design**: Material Design-based admin interface with sidebar collapsing and mobile support

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite for fast development and optimized production builds
- **Routing:** Wouter (lightweight alternative to React Router)
- **State Management:** TanStack Query (React Query) for server state, no global client state manager
- **Styling:** Tailwind CSS with shadcn/ui component library (New York variant)
- **Animations:** Framer Motion for smooth, engaging transitions
- **UI Components:** Radix UI primitives wrapped with custom styling

**Design System:**
- Material Design foundation adapted for children
- Typography: Inter (UI/body) and Fredoka (headings/friendly content)
- Custom color scheme with HSL-based theming supporting light/dark modes
- Responsive layouts optimized for tablets and desktops (educational contexts)
- Accessibility-first component design

**Key Frontend Components:**
- `AuthPage`: Login/register page with Material Design and form validation
- `AuthProvider`: Context provider for authentication state management
- `ProtectedRoute`: Route protection component with role-based access control
- `LessonRenderer`: Main orchestrator for displaying structured lesson content
- `ChatInterface`: Real-time AI tutor chat with message history
- `QuizWidget`: Interactive multiple-choice assessments with server-side grading
- `OrderStepsWidget`: Drag-and-drop sequencing exercises
- `TutorMessage`: Friendly AI tutor message displays with role-based icons and Text-to-Speech
- `TimelineBuilder`: Visual drag-and-drop editor for lesson content creation
- `LessonEditorPage`: Complete authoring interface with metadata, content, and live preview tabs
- `HomePage`: Student-facing lesson browser showing only published lessons (authentication required)
- `LessonViewPage`: Student-facing lesson player with full interactive experience (authentication required)
- `AdminDashboard`: Admin panel with statistics and quick actions (admin role required)
- `AdminLayout`: Shadcn sidebar-based layout with navigation for all admin pages
- `UsersPage`: User management interface with CRUD operations and role assignment
- `ProgressPage`: Student progress tracking dashboard with aggregated metrics and individual student details

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js for REST API
- **Database ORM:** Drizzle ORM configured for PostgreSQL
- **Database Provider:** Neon serverless PostgreSQL
- **Authentication:** Passport.js with Local Strategy
- **Session Management:** express-session with PostgreSQL store (connect-pg-simple)
- **AI Integration:** Dual provider support (OpenAI + Google Gemini)

**API Design:**
- RESTful endpoints with Zod schema validation
- **Authentication**: 
  - `POST /api/register`: User registration (username, password, name, role)
  - `POST /api/login`: User authentication
  - `POST /api/logout`: Session termination
  - `GET /api/user`: Get current authenticated user
- **Content**:
  - `/api/tutor`: AI chat completions with conversation history
  - `/api/grade`: Server-side answer validation and scoring
  - `/api/lessons`: Endpoint returning ONLY published lessons (requires authentication)
  - `/api/admin/lessons`: Admin endpoint returning ALL lessons (requires admin role)
  - `/api/lessons/:id`: Full CRUD for individual lessons (GET/POST/PUT/DELETE)
  - `/api/progress`: User progress tracking and quiz score persistence
- **Admin Management**:
  - `GET /api/admin/users`: List all users (requires admin role)
  - `POST /api/admin/users`: Create new user with username, password, name, role (requires admin role)
  - `PUT /api/admin/users/:id`: Update user details including role (requires admin role)
  - `DELETE /api/admin/users/:id`: Delete user account (requires admin role)
  - `GET /api/admin/progress`: Aggregated student progress data with division-by-zero protection (requires admin role)
- **Health**: `/healthz`: Health check with provider availability status

**AI Provider Strategy:**
- Primary: OpenAI via Replit AI Integrations (GPT-5 model, no API key required)
- Secondary: Google Gemini 2.5 (Flash/Pro) with optional API key
- Provider selection configurable per-request
- Unified interface abstracts provider differences

**Data Flow:**
1. Client sends request with Zod-validated payload
2. Express middleware logs request/response for debugging
3. AI provider generates response based on educational context
4. Server validates and transforms response before returning
5. Client updates UI with TanStack Query cache management

### Authentication & Authorization

**Implementation (Production-Ready):**
- **Backend**: Passport.js with Local Strategy for username/password authentication
- **Password Security**: Scrypt hashing with per-user salts, never exposed to client
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple
- **User Storage**: PostgreSQL via Drizzle ORM (not in-memory)
- **Session Cookie**: Secure, HTTP-only session cookies with 7-day expiration
- **Response Sanitization**: All auth endpoints use `sanitizeUser()` to strip password hashes before sending to client

**Roles:**
- **admin**: Full access to all features including lesson management, statistics, and admin dashboard
- **student**: Access to published lessons only, cannot access admin routes

**Protected Routes:**
- All application routes require authentication (redirect to /auth if not logged in)
- `/admin/*` routes require admin role (students see "Access Denied")
- Public route: `/auth` (login/register page)

**API Endpoints:**
- `POST /api/register`: Create new account with username, password, name, and role
- `POST /api/login`: Authenticate with username and password
- `POST /api/logout`: Destroy session and log out
- `GET /api/user`: Get current authenticated user (without password hash)

**Frontend Components:**
- `AuthProvider`: React context providing auth state and mutations (login, logout, register)
- `useAuth`: Hook for accessing current user and auth functions
- `ProtectedRoute`: Component for route protection with optional admin requirement
- `AuthPage`: Login/Register page with Material Design, tabs, and form validation

### Lesson Content System

**Lesson DSL (Domain-Specific Language):**
- Structured JSON schema defining lesson flow
- Timeline-based content delivery with multiple item types:
  - `tutor_say`: AI tutor messages with optional voice/role
  - `show_image`: Visual content with accessibility captions
  - `quiz`: Multiple-choice assessments with server-side validation
  - `interactive`: Custom widgets (drag-drop, sequencing)
  - `reflection`: Open-ended prompts for critical thinking
- Adaptive learning paths based on performance thresholds
- Metadata includes target age range, language, and learning objectives

**Content Storage:**
- PostgreSQL database-backed lesson library
- Full CRUD API endpoints for lesson management
- Lesson authoring interface at `/admin/lessons`
- Real-time preview and validation system

## Automatic Lesson Generation System

**AI-Powered Content Creation:**
- Endpoint: `POST /api/lessons/generate`
- Input: Lesson metadata (title, age, objectives, language)
- Output: Complete lesson timeline with educational content
- AI Model: OpenAI GPT-5 via Replit AI Integrations

**Content Types Generated:**
- Tutor messages (`tutor_say`): Friendly explanations adapted to child's age
- Multiple-choice quizzes (`quiz`): 4-option questions with correct answer index
- Reflection prompts (`reflection`): Open-ended thinking exercises
- Educational images (`show_image`): Auto-mapped from AI descriptions to pre-generated assets

**Image Processing Pipeline:**
1. AI generates `GENERATE_IMAGE: <description>` markers in timeline
2. Backend `getEducationalImage()` function maps descriptions to pre-generated educational images
3. Keyword-based matching (robot, ChatGPT, Gemini, AI diagrams, comparisons)
4. Five high-quality child-friendly AI illustrations stored in `attached_assets/generated_images/`
5. Automatic replacement of markers with actual image paths before returning to client

**Educational Images Library:**
- Robot teacher with diverse children (`Robot_teacher_with_diverse_children_bc4de1b4.png`)
- How AI works diagram (`How_AI_works_simple_diagram_62b5bad7.png`)
- ChatGPT character illustration (`ChatGPT_friendly_character_illustration_431b9259.png`)
- Gemini star character (`Gemini_friendly_star_character_8a90e0c2.png`)
- ChatGPT vs Gemini comparison (`ChatGPT_vs_Gemini_comparison_illustration_b8018ed9.png`)

**Frontend Integration:**
- "Generar Automáticamente" button in Metadata tab of lesson editor
- TanStack Query mutation with loading states and error handling
- Automatic validation of required metadata before generation
- Success toast notification with generated timeline preview
- Seamless integration with TimelineBuilder for further editing

## External Dependencies

### AI Services
- **Replit AI Integrations**: OpenAI-compatible API with GPT-5 model access, billing through Replit credits
- **Google Gemini API**: Optional alternative AI provider requiring `GEMINI_API_KEY` environment variable

### Database & Storage
- **Neon Serverless PostgreSQL**: Cloud-hosted Postgres with connection pooling via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **Drizzle Kit**: Database migrations and schema management

### UI & Component Libraries
- **shadcn/ui**: Pre-built accessible components built on Radix UI primitives
- **Radix UI**: Unstyled, accessible component primitives (accordion, dialog, select, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Framer Motion**: Declarative animation library for React
- **Lucide React**: Icon library for consistent visual language

### Development Tools
- **Vite**: Frontend build tool with HMR and optimized bundling
- **TypeScript**: Type safety across client, server, and shared code
- **Zod**: Runtime schema validation for API contracts
- **Wouter**: Minimal routing solution for single-page app navigation

### Google Fonts
- **Inter**: Primary UI font (clean, highly legible)
- **Fredoka**: Display font for headings (child-friendly, rounded)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `SESSION_SECRET`: Secret key for session encryption (auto-generated by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Replit AI integration token (auto-provided)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: Replit AI endpoint (auto-provided)
- `GEMINI_API_KEY`: Optional Google Gemini API key
- `NODE_ENV`: Environment mode (development/production)