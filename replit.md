# Tutor IA - AI-Powered Interactive Learning Platform

## Overview
Tutor IA is an educational platform for children aged 7-9, designed to teach them about Artificial Intelligence and how to use AI assistants like OpenAI and Gemini. The platform offers structured, modular lessons with interactive widgets, quizzes, and chat-based tutoring utilizing both OpenAI GPT and Google Gemini. Its core purpose is to make learning engaging through a child-friendly Material Design interface, focusing on AI education rather than general academics. The project aims to deliver flexible learning experiences suitable for various age groups and difficulty levels, supported by an advanced lesson generation system.

## User Preferences
- Preferred communication language: **Spanish**
- Preferred communication style: Simple, everyday language
- Content focus: Teaching about **Artificial Intelligence** (how to use OpenAI and Gemini), not mathematics

## System Architecture

### Frontend Architecture
The frontend is built with **React 18+ and TypeScript**, using **Vite** for tooling, **Wouter** for routing, and **TanStack Query** for server state management. Styling is handled by **Tailwind CSS** with **shadcn/ui** (New York variant) and **Radix UI** primitives, enhanced by **Framer Motion** for animations. The design system is based on Material Design, adapted for children, featuring Inter and Fredoka typography, custom HSL-based theming, and responsive layouts. Key components include authentication flows, a lesson renderer, an interactive AI chat interface, various interactive widgets, and comprehensive admin panels for lesson and user management.

### Backend Architecture
The backend uses **Node.js 18+ with TypeScript** and **Express.js** for its REST API. Data persistence is managed with **Drizzle ORM** configured for **Neon serverless PostgreSQL**. Authentication is handled by **Passport.js** with a Local Strategy and PostgreSQL-backed sessions. The API provides endpoints for user authentication, content delivery (lessons, quizzes, AI tutor chat), and admin functionalities with robust role-based access control (admin/student). It integrates both **OpenAI GPT (via Replit AI Integrations)** and **Google Gemini 2.5 (Flash/Pro)**, abstracting provider differences.

### Authentication & Authorization
A production-ready authentication system is implemented using **Passport.js** with username/password, **Scrypt hashing** for passwords, and **PostgreSQL-backed sessions**. It enforces **role-based access control** (admin/student) across all routes, securing admin-specific functionalities and ensuring students only access published content. All sensitive data like password hashes are sanitized from API responses.

### Lesson Content System
Lessons are defined using a structured **JSON schema** supporting a variety of interactive elements such as AI tutor messages, images, quizzes, custom widgets, and reflection prompts. This content is stored in a **PostgreSQL database** with full CRUD API endpoints and an authoring interface in the admin panel.

### Automatic Lesson Generation System
The platform features an **AI-powered lesson generation system** (`POST /api/lessons/generate`) that uses **OpenAI GPT-5** (via Replit AI Integrations) to create full lesson timelines based on metadata inputs (title, age, objectives). It generates tutor messages, quizzes, reflection prompts, and even suggests educational images, which are then mapped to pre-generated assets.

### LLM Orquestador - Conversational Lesson Creator
A conversational AI assistant (`/admin/orchestrator`) that guides educators through lesson creation via natural dialogue. The orchestrator asks strategic questions to gather requirements (audience, duration, level, type, objectives), automatically extracts parameters from conversation context, and generates complete lessons with all new interactive widgets. Features real-time parameter detection, manual override capability, and seamless integration with the lesson generation system.

## External Dependencies

### AI Services
- **Replit AI Integrations**: OpenAI-compatible API providing access to GPT-5.
- **Google Gemini API**: Optional alternative AI provider.

### Database & Storage
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database.
- **Drizzle ORM**: Type-safe ORM for database interactions.

### UI & Component Libraries
- **shadcn/ui**: Pre-built accessible UI components.
- **Radix UI**: Unstyled, accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Frontend build tool.
- **TypeScript**: Language for type safety.
- **Zod**: Runtime schema validation.
- **Wouter**: Lightweight routing solution.

### Google Fonts
- **Inter**: Primary UI font.
- **Fredoka**: Display font for headings.

### Environment Variables
- `DATABASE_URL`
- `SESSION_SECRET`
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `GEMINI_API_KEY` (optional)
- `NODE_ENV`