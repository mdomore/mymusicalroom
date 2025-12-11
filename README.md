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
- **Database**: PostgreSQL
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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Project Structure

```
mymusicalroom/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
├── resources/        # Local file storage (created automatically)
└── docker-compose.yml
```

### Environment Variables

Create a `.env` file in the root directory (see `.env.example` in backend):

- `DATABASE_URL`: PostgreSQL connection string
- `RESOURCES_DIR`: Path to resources directory
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Development

The application runs in development mode with hot-reload enabled for both frontend and backend.

## License

MIT
