# Mémoire d'âme - Setup Instructions

Welcome to **Mémoire d'âme**, a biographical memory capture application for preserving life stories through audio recordings and generating beautiful annual memory books.

## 📦 What's Included

This complete monorepo includes:

- Next.js 15 App Router with TypeScript
- Prisma ORM with PostgreSQL schemas
- NextAuth v5 authentication
- MinIO S3 storage integration
- BullMQ job queue with Redis
- Audio processing pipeline
- PDF generation system
- Complete test suite (Vitest + Playwright)
- CI/CD pipeline (GitHub Actions)

## 🚀 Quick Start

### Prerequisites

Ensure you have installed:

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- MinIO (or S3-compatible storage)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/memoire_dame"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# MinIO S3
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="memoire-dame"
MINIO_USE_SSL="false"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

### 3. Set Up Services

#### PostgreSQL

```bash
# Create database
createdb memoire_dame

# Or using psql
psql -U postgres -c "CREATE DATABASE memoire_dame;"
```

#### Redis

```bash
# Start Redis (if using Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu/Debian
```

#### MinIO

```bash
# Start MinIO (if using Docker)
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Access MinIO Console at http://localhost:9001
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
# Start Next.js development server
npm run dev
```

The application will be available at http://localhost:3000

### 6. Start Background Workers (Optional)

In separate terminal windows:

```bash
# Audio processing worker
tsx workers/audio-processor.ts

# PDF generation worker
tsx workers/pdf-generator.ts
```

## 🧪 Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Lint
npm run lint

# Format
npm run format
```

## 📁 Project Structure

```
memoire-dame/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── questions/         # Question pages
│   └── ...
├── components/            # React components
│   └── AudioRecorder.tsx  # Audio recording UI
├── lib/                   # Core utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── queue.ts          # BullMQ setup
│   └── storage.ts        # MinIO/S3 utilities
├── workers/               # Background job workers
│   ├── audio-processor.ts # Audio processing
│   └── pdf-generator.ts   # PDF generation
├── pdf/                   # PDF generation
│   └── generator.ts       # PDF templates
├── prisma/                # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Seed data
├── e2e/                   # E2E tests
├── test/                  # Test setup
└── ...
```

## 🎯 Key Features

### Audio Recording

- `/questions/weekly` - Record answers to weekly questions
- MediaRecorder API with pause/resume
- Progress tracking and accessibility features

### Audio Processing Pipeline

- Automatic transcription (STT stub)
- AI narrative generation (biographer model stub)
- Auto-tagging (era, theme, emotion, family links)

### PDF Book Generation

- Annual memory books with beautiful layouts
- Cover pages, table of contents, chapters
- Organized by time periods and themes
- API: `POST /api/books/[year]/generate`

### Authentication

- Google OAuth
- Email/password login
- NextAuth v5 with Prisma adapter

## 🔧 Development

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create new migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset
```

### Code Quality

```bash
# Run linter
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## 🚢 Deployment

### Environment Variables

Make sure to set production environment variables:

- Use a secure `NEXTAUTH_SECRET`
- Configure production database URL
- Set up production S3/MinIO endpoints
- Configure Redis connection

### Build

```bash
npm run build
npm start
```

### Docker Compose (Optional)

Create a `docker-compose.yml` for all services:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: memoire_dame
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

Start all services:

```bash
docker-compose up -d
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session

### Answers

- `POST /api/answers/upload` - Upload audio recording

### Books

- `POST /api/books/[year]/generate` - Generate annual book
- `GET /api/books/[year]/generate` - Get book status

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Lint: `npm run lint`
5. Commit with descriptive message
6. Push and create a pull request

## 📝 Notes

### TODO Items

The following features have stub implementations ready for integration:

1. **STT Integration** - Replace stub in `workers/audio-processor.ts` with actual STT service (OpenAI Whisper, Google Speech-to-Text, etc.)

2. **AI Biographer Model** - Replace stub with LLM integration (GPT-4, Claude, etc.) for narrative generation

3. **QR Code Integration** - Uncomment and implement QR code generation in PDFs

4. **PDF Merging** - Implement proper PDF merging for combining cover, TOC, and chapters

5. **Email Notifications** - Add email notifications for completed audio processing and PDF generation

### Database Schema

The database includes 11 models:

- **Users** - User accounts
- **Relatives** - People being interviewed
- **Questions** - Interview questions
- **Answers** - Audio recordings with transcripts and narratives
- **Stories** - Grouped narratives by era/theme
- **Media** - Photos, videos, documents
- **Books** - Annual PDF compilations
- **StoryAnswer** - Junction table
- **BookMedia** - Junction table
- **Account, Session, VerificationToken** - NextAuth tables

### Testing Strategy

- Unit tests for utilities and business logic
- Integration tests for API endpoints
- E2E tests for user flows
- All tests use fixtures and mocks for external services

## 📞 Support

For issues or questions:

1. Check the documentation
2. Review existing issues on GitHub
3. Create a new issue with detailed information

## 📄 License

[Your License Here]

---

Built with ❤️ for preserving precious memories
