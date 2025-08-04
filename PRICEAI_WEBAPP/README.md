# PriceAI Healthcare Web Application

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive healthcare platform that enables users to search for healthcare providers, compare prices, book appointments, and manage their healthcare journey with integrated insurance pricing and Google Calendar synchronization.

## Demo Video

**Web Application Demo**


https://github.com/user-attachments/assets/edf549fa-aec9-40f6-a4f1-853d2f5e328f



This demo showcases:
- Healthcare provider search and filtering
- Price comparison across different providers
- View Insurance pricing
- Appointment booking with calendar sync
- Provider ratings and reviews system
- AI healthcare chatbot assistance

## Folder Structure

```
├── eslint.config.mjs
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   ├── (home)/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── appointments/
    │   │   │   └── page.tsx
    │   │   └── profile/
    │   │       └── page.tsx
    │   ├── api/
    │   │   ├── appointments/
    │   │   │   └── create/
    │   │   │       └── route.ts
    │   │   ├── google-calendar/
    │   │   │   ├── connect/
    │   │   │   │   └── route.ts
    │   │   │   ├── create-event/
    │   │   │   │   └── route.ts
    │   │   │   ├── delete-event/
    │   │   │   │   └── route.ts
    │   │   │   └── status/
    │   │   │       └── route.ts
    │   │   ├── ratings/
    │   │   │   └── providers/
    │   │   │       └── route.ts
    │   │   ├── reviews/
    │   │   │   └── route.ts
    │   │   ├── send-appointment-email/
    │   │   │   └── route.ts
    │   │   └── send-cancellation-email/
    │   │       └── route.ts
    │   ├── auth/
    │   │   ├── callback/
    │   │   │   └── page.tsx
    │   │   └── login/
    │   │       └── page.tsx
    │   └── error/
    │       └── page.tsx
    ├── components/
    │   ├── AllHospitalSection.tsx
    │   ├── Header.tsx
    │   ├── ProviderCard.tsx
    │   ├── RecommendedSection.tsx
    │   ├── appointments/
    │   │   ├── AppointmentBooking.tsx
    │   │   └── AppointmentsPage.tsx
    │   ├── chat/
    │   │   └── Chatbot.tsx
    │   ├── compare/
    │   │   ├── CompareHospitals.tsx
    │   │   └── FilterSidebar.tsx
    │   ├── hospitals_details/
    │   │   ├── ProviderRating.tsx
    │   │   └── ViewHospitalDetails.tsx
    │   ├── profile/
    │   │   ├── HealthDocuments.tsx
    │   │   └── ProfilePage.tsx
    │   ├── search/
    │   │   ├── LocationSearch.tsx
    │   │   └── ServiceSearch.tsx
    │   └── ui/
    │       ├── badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── input.tsx
    │       ├── Loader.tsx
    │       ├── priceai-checkbox.tsx
    │       ├── progress.tsx
    │       ├── scroll-area.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── skeleton.tsx
    │       ├── StarRating.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       ├── toast.tsx
    │       └── tooltip.tsx
    ├── context/
    │   ├── AuthContext.tsx
    │   ├── LocationContext.tsx
    │   └── PriceaiContext.tsx
    ├── lib/
    │   ├── calendar.ts
    │   ├── utils.ts
    │   └── supabase/
    │       ├── client.ts
    │       ├── middleware.ts
    │       ├── server.ts
    │       └── supabase.ts
    ├── services/
    │   ├── appointments/
    │   │   └── AppointmentService.ts
    │   ├── auth/
    │   │   └── AuthService.ts
    │   ├── GoogleCalendar/
    │   │   └── GoogleCalendarService.ts
    │   ├── Location/
    │   │   └── LocationService.tsx
    │   └── Recommendation/
    │       ├── gemini.ts
    │       ├── index.ts
    │       ├── prompts.ts
    │       └── test.ts
    └── types/
        ├── LocationTypes.ts
        ├── ProviderCardTypes.ts
        └── ReviewTypes.ts
```

## File Descriptions

### Core Application Files
- **`middleware.ts`** - Next.js middleware for authentication and route protection
- **`next.config.ts`** - Next.js configuration with TypeScript support
- **`package.json`** - Project dependencies and scripts

### App Directory
- **`app/layout.tsx`** - Root layout component with global providers
- **`app/(home)/page.tsx`** - Main landing page with provider search
- **`app/auth/login/page.tsx`** - Authentication login page
- **`app/appointments/page.tsx`** - User appointments management page
- **`app/profile/page.tsx`** - User profile and settings page

### Components
- **`AppointmentBooking.tsx`** - Modal component for booking appointments with insurance selection
- **`Header.tsx`** - Navigation header with authentication and search
- **`ProviderCard.tsx`** - Provider display card with ratings and pricing
- **`Chatbot.tsx`** - AI-powered healthcare assistance chatbot
- **`CompareHospitals.tsx`** - Side-by-side provider comparison tool

### Services
- **`AppointmentService.ts`** - Handles appointment CRUD operations via API
- **`AuthService.ts`** - User authentication and session management
- **`GoogleCalendarService.ts`** - Google Calendar integration for appointment sync
- **`LocationService.tsx`** - Location-based provider search functionality

### Context & State Management
- **`AuthContext.tsx`** - Global authentication state management
- **`LocationContext.tsx`** - User location and geolocation services
- **`PriceaiContext.tsx`** - Application-wide state and configuration

### Utilities & Libraries
- **`lib/supabase/`** - Supabase database client configuration
- **`lib/calendar.ts`** - Calendar utilities for appointment scheduling
- **`lib/utils.ts`** - Common utility functions and helpers

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Google Cloud Console project (for Calendar API)

### Environment Variables
Create a `.env` file in the root directory (example):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ROLE_KEY=your_supabase_role_key

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_ROLE_KEY=your_supabase_role_key

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_REST_API_URL=http://localhost:8001
NEXT_PUBLIC_REST_API_PREFIX=/api
NEXT_PUBLIC_REST_API_VERSION=v1

EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google-calendar/callback
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/tharuneshwar-s/VIRTUSA-JatayuS4-Lexicons.git
   cd VIRTUSA-JatayuS4-Lexicons/PRICEAI_WEBAPP
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Access the application**
   Open [http://localhost:3001](http://localhost:3001) in your browser.

## API Routes

### Appointments API

#### `POST /api/appointments/create`
Creates a new appointment with insurance pricing and optional calendar sync.

**Request Body:**
```json
{
  "user_id": "uuid",
  "provider_id": "uuid", 
  "service_id": "uuid",
  "appointment_date": "2025-08-15",
  "appointment_time": "10:30",
  "appointment_period": "AM",
  "appointment_type": "CONSULTATION",
  "patient_name": "John Doe",
  "patient_email": "john@example.com",
  "patient_phone": "+1234567890",
  "notes": "Follow-up appointment",
  "insurance_id": "insurance_uuid",
  "estimated_cost": 150.00,
  "status": "PENDING",
  "sync_with_calendar": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointment_id": "uuid",
    "user_id": "uuid",
    "appointment_date": "2025-08-15",
    "status": "PENDING"
  },
  "calendar_sync": {
    "status": "success",
    "message": "Calendar event created successfully"
  }
}
```

### Google Calendar API

#### `POST /api/google-calendar/connect`
Initiates Google Calendar OAuth connection for the authenticated user.

**Response:**
```json
{
  "success": true,
  "auth_url": "https://accounts.google.com/oauth2/auth?..."
}
```

#### `POST /api/google-calendar/create-event`
Creates a calendar event for an appointment (requires valid OAuth tokens).

**Request Body:**
```json
{
  "appointment_id": "uuid",
  "user_id": "uuid",
  "title": "Appointment with Dr. Smith",
  "description": "Healthcare appointment",
  "start_time": "2025-08-15T10:30:00",
  "end_time": "2025-08-15T11:00:00"
}
```

#### `GET /api/google-calendar/status`
Checks Google Calendar connection status for the authenticated user.

**Response:**
```json
{
  "connected": true,
  "email": "user@gmail.com",
  "expires_at": "2025-08-15T10:30:00Z"
}
```

### Email Notifications API

#### `POST /api/send-appointment-email`
Sends appointment confirmation email to patient.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "providerName": "Dr. Smith Medical Center",
  "appointmentDate": "2025-08-15",
  "appointmentTime": "10:30 AM",
  "estimatedCost": 150.00
}
```

#### `POST /api/send-cancellation-email`
Sends appointment cancellation notification.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "patientEmail": "patient@example.com",
  "reason": "Provider schedule change"
}
```

### Provider Data API

#### `POST /api/reviews`
Submits a new provider review.

**Request Body:**
```json
{
  "provider_id": "uuid",
  "service_id": "uuid",
  "rating": 5,
  "reviews": "Excellent service and care",
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review_id": "uuid",
    "provider_id": "uuid",
    "rating": 5
  }
}
```

#### `GET /api/ratings/providers`
Retrieves provider ratings and reviews data from the backend API.

**Query Parameters:**
- `providerIds` - Comma-separated list of provider IDs (required)

**Example:** `/api/ratings/providers?providerIds=123,456,789`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "providerId": 123,
      "averageRating": 4.5,
      "totalReviews": 150
    },
    {
      "providerId": 456,
      "averageRating": 4.2,
      "totalReviews": 89
    }
  ]
}
```

---

## Technologies Used

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **External APIs:** Google Calendar API, Insurance pricing APIs

## Team

**Virtusa Hackathon 2025 - Lexicons**

This project was developed as part of the Virtusa Hackathon focusing on healthcare data processing and automation solutions.

