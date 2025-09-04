# Development Setup Guide

## Prerequisites

### Required Software
1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
3. **Git**: Download from [git-scm.com](https://git-scm.com/)

### Optional but Recommended
- **VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **VS Code Extensions**:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Importer
  - Prettier - Code formatter

## Setup Instructions

### 1. Clone the Repository
```bash
git clone [repository-url]
cd markaz-an-noor-student-record-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
The project includes a pre-configured `.env.local` file for local development:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### 4. Start Docker Desktop
1. Open Docker Desktop application
2. Wait for it to fully start (Docker icon should not show "Starting...")
3. Ensure Docker is running in the system tray/menu bar

### 5. Start Supabase Local Development
```bash
# Windows
./supabase.exe start

# macOS/Linux
./supabase start
```

This command will:
- Download necessary Docker images
- Start PostgreSQL database
- Start Supabase services
- Run database migrations
- Seed initial data

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

## Demo Accounts

Once the system is running, you can login with these demo accounts:

### Administrator Account
- **Email**: ahmedimfas@gmail.com
- **Password**: password123
- **Access**: Full system administration

### Staff Account
- **Email**: teacher1@markaz.edu
- **Password**: password123
- **Access**: Daily operations and student management

### Student Account
- **Email**: abdullah@markaz.edu
- **Password**: password123
- **Access**: Personal progress and performance tracking

## Development Workflow

### 1. Database Changes
If you make database schema changes:
```bash
# Create a new migration
./supabase.exe db diff -f new_migration_name

# Apply migrations
./supabase.exe db reset
```

### 2. Code Formatting
```bash
# Check TypeScript types
npm run type-check

# Lint code
npm run lint

# Build project
npm run build
```

### 3. Supabase Management
```bash
# Check Supabase status
./supabase.exe status

# Stop Supabase
./supabase.exe stop

# View database
./supabase.exe db dashboard
```

## Troubleshooting

### Docker Issues
- **Error**: "Docker Desktop is not running"
  - **Solution**: Start Docker Desktop and wait for it to fully initialize

- **Error**: "Port already in use"
  - **Solution**: Stop conflicting services or change ports in Supabase config

### Supabase Issues
- **Error**: "Failed to connect to database"
  - **Solution**: Restart Supabase with `./supabase.exe stop` then `./supabase.exe start`

- **Error**: "Migration failed"
  - **Solution**: Reset database with `./supabase.exe db reset`

### Node.js Issues
- **Error**: "Module not found"
  - **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`

- **Error**: "TypeScript errors"
  - **Solution**: Run `npm run type-check` to identify and fix type issues

### Application Issues
- **Error**: "Authentication failed"
  - **Solution**: Check if Supabase is running and environment variables are correct

- **Error**: "Page not loading"
  - **Solution**: Check browser console for JavaScript errors and network requests

## Project Structure

```
src/
├── app/                 # Next.js 13+ App Router
│   ├── (auth)/         # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── dashboards/     # Role-specific dashboards
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── utils/             # Utility functions

supabase/
├── migrations/        # Database migrations
└── config.toml       # Supabase configuration
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

## Database Schema Overview

### Core Tables
- **users**: User accounts with roles (admin, staff, student)
- **students**: Student profiles linked to users
- **teachers**: Staff profiles linked to users
- **activities**: Islamic daily schedule (A01-A10)
- **participation_records**: Daily grading records
- **leaves**: Student absence tracking
- **alerts**: Behavioral/academic alerts

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication via Supabase Auth

## Next Steps

1. Explore the demo data and functionality
2. Review the code structure and components
3. Make modifications as needed
4. Test all features thoroughly
5. Deploy to production when ready

For production deployment, see the separate DEPLOYMENT.md guide.