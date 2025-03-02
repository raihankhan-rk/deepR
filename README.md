# DeepR - Deep Research Platform

DeepR is a comprehensive research platform that enables users to conduct deep research on any topic and generate detailed reports with sources. The platform uses Google's Gemini AI to perform thorough research and present findings in a structured format.

## Project Structure

This project consists of two main components:

1. **Backend (FastAPI)**: Located in the `backend` directory
2. **Frontend (React)**: Located in the `frontend` directory

## Features

- User authentication and authorization
- Deep research on any topic using Gemini AI
- Web search integration for up-to-date information
- Structured report generation with sections and sources
- PDF export of research reports
- Research history tracking
- Responsive UI for desktop and mobile

## Tech Stack

### Backend
- FastAPI: Modern, fast web framework for building APIs
- Supabase: Backend-as-a-Service for database and authentication
- Google Gemini AI: Advanced AI model for research and content generation
- FPDF: PDF generation library

### Frontend
- React: Frontend library for building user interfaces
- TypeScript: Type-safe JavaScript
- Tailwind CSS: Utility-first CSS framework
- React Router: For navigation and routing
- Axios: For API requests

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd deepR-backend
   ```

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
   - `SECRET_KEY`: A secret key for JWT token generation

5. Start the server:
   ```bash
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd deepR-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_KEY=your_supabase_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Supabase Database Setup

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