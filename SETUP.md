# Markaz An-noor Student Reporting System - Setup Guide

## Overview
A full-stack Next.js and Supabase application for managing student participation, grading, and reports at Markaz An-noor Islamic education institution.

## Features
- 🔐 Role-based authentication (Admin, Staff, Student)
- 📊 Participation tracking with Islamic daily schedule (A01-A10)
- 📈 Real-time analytics and reporting
- 🚨 Alert system for urgent student concerns
- 📅 Leave management and tracking
- 📄 CSV/PDF export functionality
- 🎨 Islamic-inspired responsive design
- 🔒 Row-level security with Supabase

## Quick Start

### 1. Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (or local Supabase setup)

### 2. Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd markaz-an-noor-student-record-system
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup
Run the migrations in order:
1. `001_create_users_and_auth.sql`
2. `002_create_activities_and_records.sql` 
3. `003_seed_initial_data.sql`

### 5. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000`

## Demo Accounts

### Admin
- **Email**: ahmedimfas@gmail.com
- **Password**: password123
- **Access**: Full system management, reports, user management

### Staff/Teacher
- **Email**: teacher1@markaz.edu
- **Password**: password123
- **Access**: Daily grading, attendance, alerts

### Student
- **Email**: abdullah@markaz.edu
- **Password**: password123
- **Access**: Personal dashboard, progress tracking

## Database Schema

### Core Tables
- `users` - Authentication and roles
- `students` - Student profiles  
- `teachers` - Staff profiles
- `activities` - Islamic daily schedule (A01-A10)
- `participation_records` - Daily grading
- `alerts` - Urgent student concerns
- `leaves` - Absence tracking

### Islamic Daily Schedule
- A01: Morning Prayer (Fajr) - 4:30 AM
- A02: Quran Recitation - 5:00 AM
- A03: Breakfast - 6:30 AM
- A04: Academic Classes - 8:00 AM
- A05: Lunch & Break - 12:00 PM
- A06: Afternoon Classes - 3:00 PM
- A07: Play Time - 5:00 PM
- A08: Evening Prayer (Maghrib) - 6:00 PM
- A09: Homework Review - 7:00 PM
- A10: Night Prayer & Sleep (Isha) - 9:00 PM

### Grade System
- **A**: Did the activity properly
- **B**: Attended the activity  
- **C**: Late for the activity
- **D**: Unattended

## Key Features by Role

### Admin Dashboard
- Overview statistics and analytics
- Student and staff management
- Alert monitoring and resolution
- Report generation and export
- System configuration

### Staff Dashboard
- Daily participation grading
- Student alert creation
- Leave record management
- Class performance tracking
- Activity-based assessments

### Student Dashboard
- Personal performance analytics
- Grade distribution visualization
- Alert and notice viewing
- Leave history tracking
- Progress over time

## Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with Islamic color scheme
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Charts**: Recharts
- **PDF Export**: jsPDF with autoTable
- **Date Handling**: date-fns

## Security Features
- Row Level Security (RLS) policies
- Role-based access control
- Secure authentication flows
- Data validation and sanitization
- Environment variable protection

## Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

## Deployment
1. Deploy to Vercel/Netlify
2. Set environment variables
3. Configure Supabase production database
4. Run migrations on production
5. Create auth users in Supabase dashboard

## Sample Data
The system includes realistic sample data:
- 4 demo students with varied performance
- Complete activity schedule
- Sample grading records
- Alert examples
- Leave entries

## Support
For issues or questions, refer to the codebase documentation or contact the development team.

---
*Built for Markaz An-noor Islamic Education Institution*