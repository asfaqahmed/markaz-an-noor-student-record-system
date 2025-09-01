# Supabase CLI Setup Guide

## ✅ CLI Installation Complete
Your Supabase CLI is successfully installed at: `./supabase.exe`

## 🐳 Next Step: Install Docker Desktop

### 1. Download Docker Desktop
Visit: https://www.docker.com/products/docker-desktop/

### 2. Install Docker Desktop
- Download the Windows installer
- Run the installer as Administrator
- Follow the setup wizard
- Restart your computer when prompted

### 3. Verify Docker Installation
```bash
docker --version
```

## 🚀 Start Local Supabase Development

Once Docker is installed:

### 1. Start Supabase Services
```bash
./supabase.exe start
```

This will:
- Pull required Docker images (first time only)
- Start PostgreSQL database
- Start Supabase Studio (Admin UI)
- Start API Gateway and Auth services
- Generate local API keys

### 2. Check Status
```bash
./supabase.exe status
```

### 3. Expected Output
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: your-jwt-secret
        anon key: your-anon-key
service_role key: your-service-role-key
   Analytics URL: http://127.0.0.1:54327
```

### 4. Update Environment Variables
Copy the keys from the output and update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-output
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-output
```

## 📊 Apply Database Migrations

### 1. Reset Database with Migrations
```bash
./supabase.exe db reset
```

### 2. Or Apply Migrations Manually
```bash
./supabase.exe db push
```

### 3. Check Migration Status
```bash
./supabase.exe migration list
```

## 🎯 Access Supabase Studio

Once started, visit: http://127.0.0.1:54323

In Studio you can:
- View your database tables
- Run SQL queries
- Manage authentication users
- View real-time data
- Test API endpoints

## 🔧 Useful Commands

```bash
# Stop all services
./supabase.exe stop

# View logs
./supabase.exe logs

# Generate types for TypeScript
./supabase.exe gen types typescript --local > src/types/supabase.ts

# Create new migration
./supabase.exe migration new your_migration_name

# Reset database (applies all migrations)
./supabase.exe db reset

# Seed database
./supabase.exe db seed
```

## 🚨 Alternative: Cloud Supabase (No Docker Required)

If you prefer not to install Docker:

### 1. Create Cloud Project
- Visit: https://supabase.com/dashboard
- Create new project: "Markaz An-noor Student System"
- Note your Project URL and API keys

### 2. Apply Migrations in SQL Editor
- Go to SQL Editor in dashboard
- Run each migration file:
  1. `001_create_users_and_auth.sql`
  2. `002_create_activities_and_records.sql`
  3. `003_seed_initial_data.sql`

### 3. Create Auth Users
In Authentication > Users, add:
- ahmedimfas@gmail.com / password123 (Admin)
- teacher1@markaz.edu / password123 (Staff)
- abdullah@markaz.edu / password123 (Student)

### 4. Update Environment
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-cloud-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-cloud-service-key
```

## 🎮 Test Your Setup

### 1. Start Next.js Development Server
```bash
npm run dev
```

### 2. Visit Application
http://localhost:3000

### 3. Test Login
Use demo accounts:
- Admin: ahmedimfas@gmail.com / password123
- Staff: teacher1@markaz.edu / password123
- Student: abdullah@markaz.edu / password123

## 📝 Next Steps

1. **Install Docker Desktop** (recommended for local development)
2. **Start Supabase**: `./supabase.exe start`
3. **Apply migrations**: `./supabase.exe db reset`
4. **Create auth users** in Studio
5. **Test the application**: `npm run dev`

## 🆘 Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Try restarting Docker Desktop
- Check Docker has sufficient resources

### Migration Issues
```bash
# Force reset database
./supabase.exe db reset --debug

# Check migration files
./supabase.exe migration list
```

### Connection Issues
- Verify ports 54321-54327 are available
- Check firewall settings
- Ensure .env.local has correct URLs

Your Supabase CLI is ready! Choose Docker for local development or Cloud for quick setup.