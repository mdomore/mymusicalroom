# My Musical Room

A web application for organizing guitar learning resources including videos, photos, documents, and music sheets.

## Features

- Create pages for songs and technical content
- Add resources (videos, photos, documents, music sheets) with title and description
- Support for local file uploads and external URLs (YouTube, etc.)
- Drag and drop reordering of resources
- Expand/collapse resource display
- Automatic directory structure matching page hierarchy

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js 14 with shadcn/ui
- **Database**: PostgreSQL (via shared Supabase instance)
- **Authentication**: Supabase Auth
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed

### Running the Application

1. Clone the repository
2. Start the services:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000/mymusicalroom
   - Backend API: http://localhost:8005
   - API Docs: http://localhost:8005/docs

**Note:** Make sure the shared Supabase instance is running and the `supabase_default` network exists.

### Project Structure

```
mymusicalroom/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
├── resources/        # Local file storage (created automatically)
└── docker-compose.yml
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

**Backend:**
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:password@supabase-db:5432/mymusicalroom`)
- `SUPABASE_URL`: Supabase API URL (e.g., `http://supabase-kong:8000`)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_POSTGRES_PASSWORD`: PostgreSQL password for Supabase
- `SUPABASE_JWT_SECRET`: JWT secret for token verification (usually same as service role key)
- `RESOURCES_DIR`: Path to resources directory (default: `/app/resources`)

**Frontend:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `/mymusicalroom`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase API URL (e.g., `http://supabase-kong:8000`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

**Note:** The project connects to a shared Supabase instance via the `supabase_default` Docker network.

## Development

The application runs in development mode with hot-reload enabled for both frontend and backend.

## License

MIT
