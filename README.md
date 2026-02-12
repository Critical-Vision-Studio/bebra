
## Run Instructions
`docker compose up --build -d`
## Run DEV Instructions
1. `docker compose up db`
2. backend: activate venv + start uvicorn server. See "Backend Setup".
3. frontend: cd frontend && npm run dev

# DB 
## Migrations
TODO: basic dbmate usage
## Check Instructions
## Option 1: Using docker exec
docker exec -it bebra-db-1 psql -U bother -d bother

## Option 2: From host (if psql installed locally, CHECK PORT)
psql -h localhost -p 5432 -U bother -d bother

## Test users and tables

```
   -- List all tables
   \dt

   -- List all users/roles
   \du

   -- Show table structure
   \d users

   -- Query data
   SELECT * FROM users;

   -- Exit
   \q
```

#### Manual Setup


##### Option 1: Using PostgreSQL Command Line
1. **Install PostgreSQL** (if not already installed):
   - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`
   - Windows: Download from https://www.postgresql.org/download/

2. **Start PostgreSQL service**:
   - Ubuntu/Debian: `sudo systemctl start postgresql`
   - macOS: `brew services start postgresql`
   - Windows: Start from Services or use installer

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
