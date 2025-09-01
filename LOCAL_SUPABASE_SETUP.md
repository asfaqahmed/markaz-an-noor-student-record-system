# Local Supabase Setup Guide

## Option 1: Using Docker (Recommended)

### 1. Install Docker Desktop
Download and install Docker Desktop from: https://www.docker.com/products/docker-desktop/

### 2. Initialize Supabase Project
```bash
# Create supabase config
mkdir -p supabase
```

### 3. Create Docker Compose File
Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  # Supabase Database
  db:
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-super-secret-and-long-postgres-password
      POSTGRES_HOST: db
    volumes:
      - ./supabase/migrations:/docker-entrypoint-initdb.d

  # Supabase Studio (Admin Dashboard)
  studio:
    image: supabase/studio:20231103-f4daca6
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: your-super-secret-and-long-postgres-password
      DEFAULT_ORGANIZATION_NAME: "Markaz An-noor"
      DEFAULT_PROJECT_NAME: "Student System"

  # Kong API Gateway
  kong:
    image: kong:2.8.1
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
    volumes:
      - ./supabase/config/kong.yml:/var/lib/kong/kong.yml:ro

  # Auth Server
  auth:
    image: supabase/gotrue:v2.99.0
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:8000
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:postgres@db:5432/postgres
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: "*"
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
</services>

networks:
  default:
    name: supabase_network_markaz
```

### 4. Start Services
```bash
docker-compose up -d
```

## Option 2: Manual PostgreSQL Setup (Alternative)

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/windows/

### 2. Create Database
```sql
-- Connect to PostgreSQL as admin
CREATE DATABASE markaz_student_system;
CREATE USER markaz_user WITH PASSWORD 'markaz_password';
GRANT ALL PRIVILEGES ON DATABASE markaz_student_system TO markaz_user;
```

### 3. Update Environment Variables
Update your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Option 3: Cloud Supabase (Easiest)

### 1. Create Supabase Account
Visit: https://supabase.com/dashboard

### 2. Create New Project
- Click "New Project"
- Name: "Markaz An-noor Student System"
- Database Password: (generate strong password)
- Region: Choose closest to you

### 3. Get API Keys
From Settings > API:
- Copy Project URL
- Copy anon/public API Key
- Copy service_role API Key

### 4. Update Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Apply Database Migrations

### Using SQL Editor (Cloud Supabase)
1. Go to SQL Editor in your Supabase dashboard
2. Run each migration file in order:
   - `001_create_users_and_auth.sql`
   - `002_create_activities_and_records.sql`
   - `003_seed_initial_data.sql`

### Using psql (Local Setup)
```bash
# Connect to your database
psql -h localhost -p 5432 -U postgres -d markaz_student_system

# Run migrations
\i supabase/migrations/001_create_users_and_auth.sql
\i supabase/migrations/002_create_activities_and_records.sql
\i supabase/migrations/003_seed_initial_data.sql
```

## Create Auth Users

### In Supabase Dashboard (Authentication > Users)
Create these users:
1. **Admin**: ahmedimfas@gmail.com / password123
2. **Staff**: teacher1@markaz.edu / password123
3. **Student**: abdullah@markaz.edu / password123

### Or via SQL
```sql
-- Note: This is handled automatically by the seed data
-- The users table will be populated, but you need to create auth users manually
```

## Test Your Setup

### 1. Check Database Connection
```bash
npm run dev
```

### 2. Test Login
- Visit http://localhost:3000
- Try logging in with demo accounts
- Verify role-based dashboards work

## Troubleshooting

### Connection Issues
- Verify environment variables are correct
- Check database is running
- Confirm migrations ran successfully

### Authentication Issues
- Ensure auth users are created in Supabase dashboard
- Verify JWT tokens are valid
- Check RLS policies are applied

### Database Issues
- Check PostgreSQL is running on port 5432
- Verify user permissions
- Review migration logs for errors

## Next Steps
1. Choose your preferred setup method
2. Follow the specific instructions
3. Run the database migrations
4. Create auth users
5. Test the application

**Recommendation**: Use Cloud Supabase for quickest setup, or Docker for local development.