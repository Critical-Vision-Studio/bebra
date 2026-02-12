# BotherApp - Setup Instructions

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.12+ (for backend development)

### 1. Clone and Setup

```bash
cd /home/dev/workplace/bebra

# Copy environment files
cp .env.example .env
cp .env.docker.example .env.docker

# Update .env.docker with your settings
# Default values should work for local development
```

### 2. Start with Docker (Recommended)

```bash
# Start all services (database + backend + frontend)
docker compose up --build -d

# Check logs
docker compose logs -f

# Access:
# - Frontend: http://localhost:8020
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### 3. Development Mode (Recommended for Active Development)

```bash
# Terminal 1: Start database only
docker compose up db

# Terminal 2: Backend
cd backend
pyenv virtualenv 3.12.7 fastapi-react-backend  # or use venv
pyenv activate fastapi-react-backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm install
npm run dev

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

---

## Database Setup

### Check Database Connection

```bash
# Option 1: Using docker exec
docker exec -it bebra-db-1 psql -U bother -d bother

# Option 2: From host
psql -h localhost -p 5433 -U bother -d bother
```

### Verify Tables

```sql
-- List all tables
\dt

-- Check new tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('message_sets', 'messages', 'friendship_message_sets', 'conversation_messages');

-- Check users table columns
\d users

-- Exit
\q
```

### Manual Migration (If Needed)

```bash
# If schema changes aren't applied automatically
psql -h localhost -p 5433 -U bother -d bother < backend/db/schema.sql
```

---

## Testing the API

### 1. Using Swagger UI

Navigate to http://localhost:8000/docs

- Interactive API documentation
- Try out endpoints directly
- See request/response schemas

### 2. Using curl

```bash
# Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123",
    "email": "alice@example.com"
  }'

# Login
TOKEN=$(curl -X POST http://localhost:8000/auth/token \
  -d "username=alice&password=password123" | jq -r .access_token)

echo "Token: $TOKEN"

# Get current user
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Create a message set
curl -X POST http://localhost:8000/message-sets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friendly Greetings",
    "description": "Casual hello messages",
    "is_public": true,
    "tags": ["friendly", "casual", "greetings"]
  }'

# Add a message to the set
curl -X POST http://localhost:8000/message-sets/1/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_type": "text",
    "storage_type": "inline",
    "content": "Hey there! 👋",
    "display_order": 1
  }'

# Browse public message sets
curl http://localhost:8000/message-sets?public=true \
  -H "Authorization: Bearer $TOKEN" | jq

# Get user settings
curl http://localhost:8000/users/me/settings \
  -H "Authorization: Bearer $TOKEN" | jq

# Enable tinder-bother
curl -X PUT http://localhost:8000/users/me/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tinder_enabled": true,
    "tinder_interval_minutes": 10
  }' | jq
```

### 3. Create Test Data

```bash
# Script to create test users and message sets
# Save as backend/scripts/create_test_data.sh

#!/bin/bash
API_URL="http://localhost:8000"

# Create users
for user in alice bob charlie; do
  curl -X POST $API_URL/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$user\", \"password\": \"test123\"}"
done

# Login as alice
TOKEN=$(curl -X POST $API_URL/auth/token \
  -d "username=alice&password=test123" | jq -r .access_token)

# Create message sets
curl -X POST $API_URL/message-sets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Greetings",
    "description": "Say hello",
    "is_public": true,
    "tags": ["friendly"]
  }'

# Add messages
for i in {1..5}; do
  curl -X POST $API_URL/message-sets/1/messages \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"content_type\": \"text\",
      \"storage_type\": \"inline\",
      \"content\": \"Hello $i!\",
      \"display_order\": $i
    }"
done

echo "Test data created!"
```

---

## Frontend Development

### Install Dependencies

```bash
cd frontend
npm install
```

### Install Missing Icon Library (If Needed)

```bash
npm install @tabler/icons-react
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

### Check for TypeScript Errors

```bash
npx tsc --noEmit
```

---

## Common Issues & Solutions

### Issue: Database connection failed

**Solution**:
```bash
# Check if database is running
docker ps | grep bebra-db

# Check database logs
docker logs bebra-db-1

# Restart database
docker compose restart db
```

### Issue: Port already in use

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml or uvicorn command
```

### Issue: Frontend can't connect to backend

**Solution**:
```bash
# Check CORS settings in backend/src/main.py
# Ensure frontend URL is in allow_origins list

# Check VITE_API_URL in frontend/.env
echo "VITE_API_URL=http://localhost:8000" > frontend/.env
```

### Issue: npm install fails

**Solution**:
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Python dependencies fail

**Solution**:
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Issue: Database schema not updated

**Solution**:
```bash
# Rebuild database container
docker compose down -v  # WARNING: This deletes all data
docker compose up db --build

# Or manually apply migration
psql -h localhost -p 5433 -U bother -d bother < backend/db/schema.sql
```

---

## Development Workflow

### Making Backend Changes

1. Edit files in `backend/src/`
2. Uvicorn auto-reloads on save
3. Check http://localhost:8000/docs for updated API
4. Test with curl or Swagger UI

### Making Frontend Changes

1. Edit files in `frontend/src/`
2. Vite hot-reloads on save
3. Check browser console for errors
4. Use React DevTools for debugging

### Adding Database Changes

1. Edit `backend/db/schema.sql`
2. Create migration file in `backend/db/migrations/`
3. Apply migration:
   ```bash
   psql -h localhost -p 5433 -U bother -d bother < backend/db/migrations/XXX_name.sql
   ```
4. Or rebuild database container (loses data)

---

## Useful Commands

### Docker

```bash
# View logs
docker compose logs -f

# Restart service
docker compose restart backend

# Stop all services
docker compose down

# Remove volumes (deletes data)
docker compose down -v

# Rebuild specific service
docker compose up --build backend
```

### Database

```bash
# Connect to database
docker exec -it bebra-db-1 psql -U bother -d bother

# Backup database
docker exec bebra-db-1 pg_dump -U bother bother > backup.sql

# Restore database
docker exec -i bebra-db-1 psql -U bother -d bother < backup.sql

# Refresh materialized view
docker exec -it bebra-db-1 psql -U bother -d bother -c "REFRESH MATERIALIZED VIEW user_message_set_stats;"
```

### Backend

```bash
# Run with debug logging
uvicorn src.main:app --reload --port 8000 --log-level debug

# Check Python version
python --version

# List installed packages
pip list

# Run tests (when implemented)
pytest
```

### Frontend

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit security
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Project Structure Reference

```
bebra/
├── backend/
│   ├── db/
│   │   ├── schema.sql              # Complete database schema
│   │   └── migrations/             # Migration files
│   ├── src/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── auth.py                 # Authentication & users
│   │   ├── models.py               # Pydantic models
│   │   ├── database.py             # Database utilities
│   │   ├── message_sets.py         # Message sets endpoints
│   │   ├── friendships.py          # Friendships endpoints
│   │   ├── tinder_bother.py        # Tinder-bother endpoints
│   │   └── settings.py             # Settings endpoints
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                    # API client functions
│   │   ├── components/             # React components
│   │   ├── pages/                  # Page components
│   │   ├── utils/                  # Utility functions
│   │   └── main.tsx                # React entry point
│   └── package.json                # Node dependencies
├── docker-compose.yml              # Docker services config
├── TECHNICAL_SPEC.md               # Complete specification
├── IMPLEMENTATION_SUMMARY.md       # What was implemented
└── SETUP_INSTRUCTIONS.md           # This file
```

---

## Next Steps

1. ✅ Database is set up
2. ✅ Backend is running
3. ✅ Frontend is configured
4. 🔲 Build frontend pages (Dashboard, Friend Requests, etc.)
5. 🔲 Add React Query hooks
6. 🔲 Implement tinder-bother polling
7. 🔲 Add error handling and loading states
8. 🔲 Test end-to-end user flows
9. 🔲 Deploy to production

---

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **Technical Spec**: `TECHNICAL_SPEC.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **OpenAPI Spec**: `openapi_v2.yaml`

---

## Production Deployment Checklist

- [ ] Change JWT_SECRET in environment
- [ ] Update CORS origins for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure production database (not SQLite)
- [ ] Set up database backups
- [ ] Add rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up CI/CD pipeline
- [ ] Add health check endpoints
- [ ] Configure scheduled jobs (materialized view refresh, cleanup)
- [ ] Review and harden security settings
- [ ] Load test API endpoints
- [ ] Set up CDN for static assets
