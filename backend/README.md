# DeepR Backend

A FastAPI-based backend for the DeepR research platform that enables users to conduct deep research on any topic and generate comprehensive reports.

## Features

- User authentication and authorization using JWT tokens
- Integration with Google's Gemini AI for deep research
- PDF report generation
- Research history tracking
- Concurrent request handling

## Tech Stack

- FastAPI: Modern, fast web framework for building APIs
- Supabase: Backend-as-a-Service for database and authentication
- Google Gemini AI: Advanced AI model for research and content generation
- FPDF: PDF generation library

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   Update the following variables in `.env`:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase API key
   - `SECRET_KEY`: A secret key for JWT token generation (you can generate one with `openssl rand -hex 32`)

5. Start the server:
   ```bash
   python run.py
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/token`: Login and get access token

### Users
- `GET /api/users/me`: Get current user profile
- `GET /api/users/{user_id}`: Get user by ID

### Research
- `POST /api/research/`: Start a new research task
- `GET /api/research/{research_id}/status`: Get research status
- `GET /api/research/{research_id}`: Get research report
- `GET /api/research/{research_id}/pdf`: Download research report as PDF
- `GET /api/research/history`: Get user's research history

## Supabase Database Schema

The application requires the following tables in your Supabase database:

### users
- `id`: int, primary key
- `email`: text, unique
- `username`: text
- `hashed_password`: text
- `created_at`: timestamp

### research_reports
- `id`: text, primary key
- `user_id`: int, foreign key
- `topic`: text
- `summary`: text
- `sections`: json
- `sources`: json
- `created_at`: timestamp
- `report_json`: json

## License

MIT 