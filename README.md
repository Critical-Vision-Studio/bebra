# FastAPI + React + PostgreSQL Template

A minimal template for building web applications with:
- **Backend**: FastAPI with PostgreSQL using raw SQL
- **Frontend**: React with TypeScript and Vite
- **Database**: PostgreSQL with connection pooling

## Project Structure

```
fastapi-react-template/
├── backend/
│   ├── src/
│   │   ├── main.py          # FastAPI application entry point
│   │   └── database.py      # Database utility functions
│   ├── db/
│   │   └── schema.sql       # Database schema
│   ├── requirements.txt     # Python dependencies
│   └── env_example.txt      # Environment variables template
└── frontend/
    ├── src/
    │   ├── main.tsx         # React entry point
    │   ├── App.tsx          # Main React component
    │   └── api.ts           # API client configuration
    ├── package.json         # Node.js dependencies
    ├── vite.config.ts       # Vite configuration
    ├── tsconfig.json        # TypeScript configuration
    └── index.html           # HTML template
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

#### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

##### Option 1: Using PostgreSQL Command Line
1. **Install PostgreSQL** (if not already installed):
   - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`
   - Windows: Download from https://www.postgresql.org/download/

2. **Start PostgreSQL service**:
   - Ubuntu/Debian: `sudo systemctl start postgresql`
   - macOS: `brew services start postgresql`
   - Windows: Start from Services or use installer

3. **Create database and user**:
   ```bash
# Connect as postgres user
   sudo -u postgres psql
   
# Create database
   CREATE DATABASE your_database;
   
# Create user (optional, for security)
   CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
   
# Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE your_database TO your_username;
    \c your_database
    GRANT SELECT, INSERT, DELETE, UPDATE  ON ALL TABLES IN SCHEMA public TO your_username;
# Exit
    exit
# Test priveleges
   psql -h localhost -U mytemplate_user -d mytemplate_db -c "SELECT * from sample_table;"
   \q
   ```

4. **Run the schema**:
   ```bash
   psql -U postgres -d your_database -f backend/db/schema.sql
   ```

##### Option 2: Using Docker
```bash
# Run PostgreSQL container
docker run --name postgres-fastapi \
  -e POSTGRES_DB=your_database \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Wait a moment for container to start, then run schema
docker exec -i postgres-fastapi psql -U your_username -d your_database < backend/db/schema.sql
```

##### Verify Database Setup
```bash
# Test connection
psql -h localhost -U your_username -d your_database -c "SELECT * FROM sample_table;"
```

</details>

### Backend Setup

#### Option A: Using pyenv (Recommended)
1. Navigate to backend directory: `cd backend`
2. Install Python 3.12.7: `pyenv install 3.12.7`
3. Create virtual environment: `pyenv virtualenv 3.12.7 fastapi-react-backend`
4. Set local environment: `pyenv local fastapi-react-backend`
5. Activate local environment: `pyenv activate fastapi-react-backend`
6. Install dependencies: `pip install -r requirements.txt`
7. Copy environment file: `cp env_example.txt .env`
8. Update `.env` with your database URL
9. Start server: `uvicorn src.main:app --reload --port 8000`

#### Option B: Using standard venv
1. Navigate to backend directory: `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: 
   - Linux/Mac: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy environment file: `cp env_example.txt .env`
6. Update `.env` with your database URL
7. Start server: `uvicorn src.main:app --reload --port 8000`

**Note**: Option A is recommended as it ensures Python 3.12.7 with all required system libraries.

### Frontend Setup
1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Usage

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Frontend Features

- **React Query (TanStack Query)**: Server state management with caching, background updates, and optimistic updates
- **React Router**: Client-side routing with navigation
- **Custom Hooks**: Reusable API hooks in `frontend/src/hooks/useApi.ts`
- **TypeScript Types**: Type definitions in `frontend/src/types/`
- **Utility Functions**: Common helpers in `frontend/src/utils/`
- **API Client**: Configured Axios instance with interceptors
- **Basic Styling**: CSS utilities and components

## Project Structure Details

```
frontend/src/
├── components/          # React components
│   ├── HomePage.tsx     # Home page with React Query examples
│   └── About.tsx        # About page
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API-related hooks
├── styles/             # CSS files
│   └── main.css        # Global styles and utilities
├── types/              # TypeScript definitions
│   └── index.ts        # Common types
├── utils/              # Utility functions
│   └── index.ts        # Common helpers
├── api.ts              # Axios configuration and API service
├── App.tsx             # Main app with routing
└── main.tsx            # App entry point with providers
```

## Customization

This template provides the basic structure. Customize by:
1. Adding your own database tables to `backend/db/schema.sql`
2. Creating API routes in `backend/src/`
3. Building React components in `frontend/src/components/`
4. Adding custom hooks in `frontend/src/hooks/`
5. Extending types in `frontend/src/types/`
6. Adding utility functions in `frontend/src/utils/`

## Backend Structure

The backend is organized into separate modules:

```
backend/src/
├── __init__.py          # Package initialization
├── main.py              # FastAPI app setup and configuration
├── database.py          # Database utility functions
├── routes.py            # Basic routes (/, /health, /db-test)
└── api_router.py        # API routes with CRUD examples (/api/items)
```

## API Examples

### Database Utilities
```python
from .database import execute_query, execute_query_one, execute_command

# In your route handler
async def get_items(request: Request):
    items = await execute_query(request, "SELECT * FROM your_table")
    return items
```

### Router Organization
```python
from fastapi import APIRouter

# Create a router with prefix and tags
router = APIRouter(prefix="/api", tags=["api"])

@router.get("/items")
async def get_items():
    return []

# Include in main.py
app.include_router(router)
```

### Available Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /db-test` - Database connectivity test
- `GET /api/items` - List all items
- `GET /api/items/{item_id}` - Get specific item
- `POST /api/items` - Create new item
- `PUT /api/items/{item_id}` - Update item
- `DELETE /api/items/{item_id}` - Delete item