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
    │   │   │   ├── cancel/
    │   │   │   │   └── route.ts
    │   │   │   └── create/
    │   │   │       └── route.ts
    │   │   ├── google-calendar/
    │   │   │   ├── create-event/
    │   │   │   │   └── route.ts
    │   │   │   └── delete-event/
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
    │   ├── middleware.ts
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

### App Directory
- **`app/layout.tsx`** - Root layout component with global providers
- **`app/(home)/page.tsx`** - Main landing page with provider search
- **`app/(home)/layout.tsx`** - Layout wrapper for authenticated home routes
- **`app/auth/login/page.tsx`** - Authentication login page
- **`app/auth/callback/page.tsx`** - OAuth callback handler for authentication
- **`app/(home)/appointments/page.tsx`** - User appointments management page
- **`app/(home)/profile/page.tsx`** - User profile and settings page
- **`app/error/page.tsx`** - Global error boundary page
- **`app/not-found.tsx`** - Custom 404 page for unmatched routes

### API Routes
- **`api/appointments/create/route.ts`** - Creates new appointments with calendar sync
- **`api/appointments/cancel/route.ts`** - Cancels appointments and removes calendar events
- **`api/google-calendar/create-event/route.ts`** - Creates Google Calendar events for appointments
- **`api/google-calendar/delete-event/route.ts`** - Deletes Google Calendar events
- **`api/reviews/route.ts`** - Handles provider review submissions
- **`api/ratings/providers/route.ts`** - Fetches provider ratings and reviews data
- **`api/send-appointment-email/route.ts`** - Sends appointment confirmation emails
- **`api/send-cancellation-email/route.ts`** - Sends appointment cancellation notifications

### Components
- **`AppointmentBooking.tsx`** - Modal component for booking appointments with insurance selection
- **`AppointmentsPage.tsx`** - Complete appointments management with filtering and pagination
- **`Header.tsx`** - Navigation header with authentication and search
- **`ProviderCard.tsx`** - Provider display card with ratings and pricing
- **`AllHospitalSection.tsx`** - Provider listing section with search and filtering
- **`RecommendedSection.tsx`** - AI-powered provider recommendations display
- **`Chatbot.tsx`** - AI-powered healthcare assistance chatbot
- **`CompareHospitals.tsx`** - Side-by-side provider comparison tool
- **`FilterSidebar.tsx`** - Advanced filtering interface for provider search
- **`ViewHospitalDetails.tsx`** - Detailed provider information and booking interface
- **`ProviderRating.tsx`** - Provider rating display and submission component
- **`ProfilePage.tsx`** - User profile management with Google Calendar integration
- **`LocationSearch.tsx`** - Location-based provider search with geolocation
- **`ServiceSearch.tsx`** - Healthcare service search and filtering
- **`CalendarAPITest.tsx`** - Development component for testing Google Calendar integration

### Services
- **`AppointmentService.ts`** - Handles appointment CRUD operations via API
- **`AuthService.ts`** - User authentication and session management
- **`GoogleCalendarService.ts`** - Google Calendar integration for appointment sync
- **`LocationService.tsx`** - Location-based provider search functionality
- **`services/Recommendation/`** - AI recommendation engine with Gemini integration

### Context & State Management
- **`AuthContext.tsx`** - Global authentication state management
- **`LocationContext.tsx`** - User location and geolocation services
- **`PriceaiContext.tsx`** - Application-wide state and configuration

### Utilities & Libraries
- **`lib/supabase/`** - Supabase database client configuration
- **`lib/calendar.ts`** - Calendar utilities for appointment scheduling
- **`lib/utils.ts`** - Common utility functions and helpers

### Type Definitions
- **`types/LocationTypes.ts`** - TypeScript interfaces for location data
- **`types/ProviderCardTypes.ts`** - Type definitions for provider data structures
- **`types/ReviewTypes.ts`** - Review and rating data type definitions

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
    "status": "PENDING",
    "google_calendar_event_id": "calendar_event_id"
  },
  "message": "Appointment created successfully"
}
```

#### `POST /api/appointments/cancel`
Cancels an existing appointment and removes associated calendar events.

**Request Body:**
```json
{
  "appointmentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment_id": "uuid",
    "status": "CANCELLED",
    "calendar_event_deleted": true
  }
}
```

### Google Calendar API

#### `POST /api/google-calendar/create-event`
Creates a calendar event for an appointment using stored OAuth tokens.

**Request Body:**
```json
{
  "userId": "uuid",
  "appointmentId": "uuid",
  "title": "Appointment with Dr. Smith",
  "description": "Healthcare consultation appointment",
  "start_time": "2025-08-15T10:30:00",
  "end_time": "2025-08-15T11:00:00",
  "location": "123 Medical Center Dr, Health City"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "google_calendar_event_id",
    "html_link": "https://calendar.google.com/event?eid=...",
    "status": "confirmed"
  },
  "message": "Calendar event created successfully"
}
```

#### `POST /api/google-calendar/delete-event`
Deletes a Google Calendar event associated with an appointment.

**Request Body:**
```json
{
  "eventId": "google_calendar_event_id",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Calendar event deleted successfully"
}
```

### Provider Reviews & Ratings API

#### `POST /api/reviews`
Submits a new provider review and rating.

**Request Body:**
```json
{
  "provider_id": "uuid",
  "service_id": "uuid",
  "rating": 5,
  "reviews": "Excellent service and professional care. Highly recommended!",
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
    "rating": 5,
    "created_at": "2025-08-15T10:30:00Z"
  }
}
```

#### `GET /api/ratings/providers`
Retrieves aggregated provider ratings and reviews data.

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
      "totalReviews": 150,
      "ratingDistribution": {
        "5": 85,
        "4": 35,
        "3": 20,
        "2": 7,
        "1": 3
      }
    },
    {
      "providerId": 456,
      "averageRating": 4.2,
      "totalReviews": 89,
      "ratingDistribution": {
        "5": 45,
        "4": 30,
        "3": 10,
        "2": 3,
        "1": 1
      }
    }
  ]
}
```

### Email Notification API

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
  "estimatedCost": 150.00,
  "insuranceName": "Blue Cross Blue Shield",
  "location": "123 Medical Center Dr, Health City"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment confirmation email sent successfully",
  "data": {
    "email_sent": true,
    "recipient": "patient@example.com",
    "subject": "Appointment Confirmation - Dr. Smith Medical Center"
  }
}
```

#### `POST /api/send-cancellation-email`
Sends appointment cancellation notification to patient.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "patientEmail": "patient@example.com",
  "patientName": "John Doe",
  "providerName": "Dr. Smith Medical Center",
  "appointmentDate": "2025-08-15",
  "appointmentTime": "10:30 AM",
  "reason": "Provider schedule change",
  "rescheduling_available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cancellation notification sent successfully",
  "data": {
    "email_sent": true,
    "recipient": "patient@example.com",
    "subject": "Appointment Cancellation - Dr. Smith Medical Center"
  }
}
```

### Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details if applicable"
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side error)

---

## Technologies Used

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **External APIs:** Google Calendar API, Insurance pricing APIs

## Team

**Virtusa Hackathon 2025 - Lexicons**

This project was developed as part of the Virtusa Hackathon focusing on healthcare data processing and automation solutions.

