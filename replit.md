# Tutor IA - AI-Powered Interactive Learning Platform

## Overview

Tutor IA is an educational platform designed for children aged 7-9, teaching them about **Artificial Intelligence** and how to use AI assistants like OpenAI and Gemini. The application delivers structured lessons with quizzes, interactive widgets, and chat-based tutoring using multiple AI providers (OpenAI GPT and Google Gemini). The platform focuses on making learning engaging through a child-friendly Material Design interface with custom adaptations for educational contexts.

## User Preferences

- Preferred communication language: **Spanish**
- Preferred communication style: Simple, everyday language
- Content focus: Teaching about **Artificial Intelligence** (how to use OpenAI and Gemini), not mathematics

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
- `LessonRenderer`: Main orchestrator for displaying structured lesson content
- `ChatInterface`: Real-time AI tutor chat with message history
- `QuizWidget`: Interactive multiple-choice assessments with server-side grading
- `OrderStepsWidget`: Drag-and-drop sequencing exercises
- `TutorMessage`: Friendly AI tutor message displays with role-based icons

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js for REST API
- **Database ORM:** Drizzle ORM configured for PostgreSQL
- **Database Provider:** Neon serverless PostgreSQL
- **AI Integration:** Dual provider support (OpenAI + Google Gemini)
- **Session Management:** In-memory storage with planned PostgreSQL session store (connect-pg-simple)

**API Design:**
- RESTful endpoints with Zod schema validation
- `/api/tutor`: AI chat completions with conversation history
- `/api/grade`: Server-side answer validation and scoring
- `/healthz`: Health check with provider availability status

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

**Current Implementation:**
- Memory-based user storage (MemStorage class)
- User schema defined with Drizzle ORM
- Placeholder authentication (no active session validation)
- Designed for future PostgreSQL session persistence

**Planned Architecture:**
- PostgreSQL-backed session store using connect-pg-simple
- Cookie-based session management
- User roles for students and educators

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
- Currently: Static demo lesson in client code
- Designed for: Database-backed lesson library with versioning

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
- `AI_INTEGRATIONS_OPENAI_API_KEY`: Replit AI integration token (auto-provided)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: Replit AI endpoint (auto-provided)
- `GEMINI_API_KEY`: Optional Google Gemini API key
- `NODE_ENV`: Environment mode (development/production)