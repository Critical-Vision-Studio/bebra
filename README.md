
## Run Instructions
`docker compose up --build -d`
## Run DEV Instructions
1. `docker compose up db`
2. backend: activate venv + start uvicorn server. See "Backend Setup".
3. frontend: cd frontend && npm run dev

# DB Check Instructions
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
   \d friendship_requests
   \d relationships
   \d interactions

   -- Query data
   SELECT * FROM users;
   SELECT * FROM friendship_requests;
   SELECT * FROM relationships;

   -- Exit
   \q
```

#### Manual Setup
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
