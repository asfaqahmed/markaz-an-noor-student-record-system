# Markaz An-noor Student Record System

A comprehensive Islamic education management system built with Next.js 15, TypeScript, and Supabase.

## System Features

### ✅ Core Functionality Completed

#### Authentication & Authorization
- Role-based access control (Admin, Staff, Student)
- Supabase authentication integration
- Row Level Security (RLS) policies

#### User Management
- Admin dashboard with system overview
- Staff dashboard for daily operations
- Student dashboard for personal progress tracking

#### Academic Management
- **Activities Management**: 10 structured Islamic daily activities (A01-A10)
  - Morning Prayer (Fajr) - 4:30 AM
  - Quran Recitation - 5:00 AM  
  - Breakfast - 6:30 AM
  - Academic Classes - 8:00 AM
  - Lunch & Break - 12:00 PM
  - Afternoon Classes - 3:00 PM
  - Play Time - 5:00 PM
  - Evening Prayer (Maghrib) - 6:00 PM
  - Homework Review - 7:00 PM
  - Night Prayer & Sleep (Isha) - 9:00 PM

#### Grading System
- **Grade A**: Did the activity properly
- **Grade B**: Attended the activity
- **Grade C**: Late for the activity
- **Grade D**: Unattended/Absent

#### Data Management
- Participation record tracking
- Student alert system with priority levels
- Leave/absence management
- Comprehensive reporting and analytics

#### Export Capabilities
- CSV export for participation records
- PDF export for alerts and reports
- Data visualization and statistics

## Pages Implemented

### `/` (Dashboard)
- Role-based dashboard routing
- Admin: System overview and statistics
- Staff: Daily grading and student management
- Student: Personal progress and performance

### `/students`
- Student directory and profiles
- Class-based filtering and search
- Student statistics and summary cards

### `/activities`
- Islamic daily schedule management
- Activity timeline with time categories
- Activity coverage and statistics

### `/participation`
- Participation record management
- Advanced filtering and search
- Grade distribution analysis
- Export functionality

### `/alerts`
- Student alert management
- Priority-based alert system
- Status tracking (Open, Reviewing, Resolved)
- Alert resolution workflow

### `/reports` (Admin only)
- Comprehensive analytics dashboard
- Grade distribution analysis
- Attendance reporting
- Multi-format export options

### `/progress` (Students only)
- Personal academic progress tracking
- Grade history and trends
- Weekly/monthly performance analysis
- Leave history and alerts

## Technical Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Backend & Database
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Database with RLS
- **Row Level Security**: Data protection policies

### Export & Analytics
- **jsPDF**: PDF generation
- **jsPDF AutoTable**: PDF table formatting
- **CSV Export**: Data export functionality
- **date-fns**: Date manipulation and formatting

## Database Schema

### Core Tables
- `users`: User accounts with roles
- `students`: Student profiles linked to users
- `teachers`: Staff/teacher profiles
- `activities`: Islamic daily schedule activities
- `participation_records`: Daily participation grading
- `leaves`: Student absence tracking
- `alerts`: Behavioral/academic concern alerts

### Relationships
- Users → Students (1:1)
- Users → Teachers (1:1)
- Students → Participation Records (1:N)
- Activities → Participation Records (1:N)
- Teachers → Participation Records (1:N)
- Students → Leaves (1:N)
- Students → Alerts (1:N)

## Security Features

### Authentication
- Supabase Auth integration
- Email/password authentication
- Session management

### Authorization
- Role-based access control
- PostgreSQL Row Level Security
- API endpoint protection

### Data Protection
- RLS policies for all tables
- Role-based data filtering
- Secure API calls

## Demo Data Included

### Users
- **Admin**: ahmedimfas@gmail.com (password123)
- **Staff**: teacher1@markaz.edu (password123)
- **Student**: abdullah@markaz.edu (password123)

### Sample Data
- 4 demo students with participation records
- 10 Islamic daily activities (A01-A10)
- Sample alerts and leave records
- Grade distributions and analytics

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Docker Desktop (for local Supabase)

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Start Docker Desktop
4. Start Supabase: `./supabase.exe start`
5. Run development server: `npm run dev`
6. Access at `http://localhost:3000`

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## System Architecture

### Frontend Architecture
- App Router with client components
- Context-based state management
- Type-safe API calls
- Responsive design patterns

### Backend Architecture
- Supabase managed PostgreSQL
- Automatic API generation
- Real-time subscriptions ready
- Row Level Security policies

### Data Flow
1. User authentication via Supabase Auth
2. Role-based component rendering
3. Protected API calls with RLS
4. Real-time data synchronization
5. Export and analytics generation

## Development Status

✅ **Completed Components**
- All page routes and navigation
- Authentication and authorization
- Database schema and migrations
- Core business logic
- Export functionality
- Responsive UI components

⚠️ **Requires Setup**
- Docker Desktop for local development
- Supabase project configuration
- Database migrations execution

## Production Deployment

### Supabase Setup
1. Create Supabase project
2. Run database migrations
3. Configure authentication
4. Set up RLS policies

### Environment Setup
1. Update environment variables
2. Configure production database
3. Set up domain and SSL

This system provides a complete Islamic educational management solution with role-based access, comprehensive tracking, and detailed reporting capabilities.