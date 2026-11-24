# Recruitment Automation System - Technical Documentation

## Overview

This document provides a comprehensive technical description of the **Automated Recruitment System** built as a Next.js application. The system streamlines the complete hiring process from job posting through candidate selection and hiring communication.

The application is a full-stack web platform that combines a React/Next.js frontend with backend automation workflows, Google Sheets integration, and AI-powered candidate screening.

---

## Project Structure

### Core Directory Layout

```
E:\recruiter automation\
├── app/                    # Next.js 13+ app router directory
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page with features showcase
│   ├── components/         # Reusable UI components
│   ├── api/                # API routes (Drive integration)
│   └── contexts/           # React context providers
├── components/             # Legacy/components-shared components
├── .env.example            # Environment variable templates
├── .env.local              # Local environment config (Supabase)
├── package.json            # Dependencies and scripts
├── next.config.ts          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── CLAUDE.md, AGENTS.md    # Project instructions
```

---

## Technology Stack

- **Framework**: Next.js 16.x with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Custom React components (Card, FeatureCard, InteractiveBadge, TableComponent)
- **State Management**: React Hooks (useState, useEffect, useContext, useMemo, useCallback)
- **Data Parsing**: PapaParse for CSV/Google Sheets data
- **Document Generation**: docx library for Word document export
- **API Integrations**: Google Drive API, Supabase, n8n webhooks
- **Icons**: react-icons (Pi, Fa, Ri, Io, Md families)

---

## Data Flow & Architecture

### 1. Application Initialization

The app starts with `layout.tsx` which sets up the root HTML structure and metadata. The `RootLayout` component renders a `ClientLayout` wrapper that provides the overall page structure including:

- Persistent navigation sidebar (desktop and mobile variants)
- Top bar with page title, language selector, user profile, and logout
- Page content area

### 2. Language Management

The system supports bilingual interface (English and German):

- `LanguageContext` manages the current language state
- All text strings are stored in a `translations.ts` dictionary
- Language switching is available via a toggle button in the navigation
- The `navAndSidebar.tsx` component handles the language selector UI

### 3. User Authentication & Session

- `UserContext` provides user session data
- Default user profile: "Alex Morgan" with Premium Pro plan
- User ID and email stored in localStorage
- User data includes profile picture, notification count, and webhook URLs for various automation steps
- Logout clears the user email from localStorage and redirects to root

### 4. Google Sheets Integration

Core data storage uses Google Sheets as the database:

- **Mapper Sheet** (GID: 744129216): Maps user emails to their respective candidate sheets
- **Candidate Sheets**: Individual sheets per user containing application data
- Data fetching uses Google Sheets CSV export endpoints
- PapaParse library parses CSV data into JavaScript objects
- Column data is normalized and transformed for consistent access

### 5. Table Component & Data Display

The `TableComponent` is the central data display component:

- Fetches data from Google Sheets using cached requests
- Supports formula evaluation (IF, CONTAINS, RANK functions)
- Provides filtering, searching, and status tracking
- Renders application cards with status badges
- Tracks metrics: applied, under review, interview scheduled, offers, rejected

### 6. Interactive Badges

`InteractiveBadge` component allows status progression:

- Supports 5 badge types: Applied, Interview, Review, Offer, Reject
- Clickable badges cycle through status types
- On-click triggers a webhook call to n8n workflow
- Updates Google Sheet row with new status
- Visual styles differentiate each status type

### 7. Feature Showcase

The home page displays 4 key features:

1. **AI Candidate Matching** - AI analyzes applicants and matches to roles
2. **Smart ATS Screening** - Automatic resume scoring against job descriptions
3. **Automated Interviews** - AI-conducted and evaluated structured interviews
4. **Real-time Analytics** - Live dashboards tracking applicants and hiring funnels

---

## Component Library

### Core Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Card` | Generic container with header/body/footer slots | header, body, footer, width, height, position, className |
| `FeatureCard` | Display feature with optional number, title, subtitle, badge, actions | number, title, subtitle, icon, badge, actions, divided |
| `InteractiveBadge` | Status badge that can be clicked to progress | initialStatus, applicationId, roleName, userId |
| `TableComponent` | Data table with filtering, searching, metrics | title, cols, userId, baseUrl, onData, debug |
| `GoogleSheetReader` | Reads candidate data from Google Sheets | userId, onDataLoaded, debug |
| `DocxGenerator` | Exports cover letters as .docx files | None (uses DOM element) |
| `FeatureCard` | Display feature cards on home page | number, title, subtitle, icon, badge, actions |

### Context Components

| Context | Purpose | Key Data |
|---------|---------|----------|
| `UserContext` | User session management | user object with profile, webhooks, plan |
| `LanguageContext` | Internationalization (EN/DE) | translation dictionary, current language |

---

## API Routes

### Drive API (`app/api/drive/`)

- `route.ts` - Main Drive API endpoint
- `auth/route.ts` - OAuth authentication handler
- `callback/route.ts` - OAuth callback handler

### n8n Webhooks

The system integrates with n8n workflow automation through several webhook endpoints:

- `ApplicationsStatus` - Updates candidate application status in Google Sheet
- `dataFetch` - Fetches table data from Google Sheets
- `user-info` - Retrieves user information
- `coverLetterGenerator` - Generates cover letters
- `Interview_Prep_AI` - AI interview preparation
- `InterviewEvaluation` - Processes interview evaluations

All webhooks expect query parameters including `userId`, `statusState`, `id`, `role`, and `dataBaseId`.

---

## Workflow Automation

The system uses **n8n workflows** for backend automation. Four core workflows are required:

### Workflow 1: CV Collection, Extraction and ATS Scoring

- Collects CVs from application system and recruitment email
- Extracts candidate information (contact, education, skills, experience, qualifications)
- Structures data for consistent access
- Compares candidate against Job Description
- Generates ATS score based on job match
- Shortlists candidates meeting threshold threshold
- Sends automated rejection notifications to candidates below threshold

### Workflow 2: Shortlist and Interview Communication

- Sends congratulations email to shortlisted candidates
- Provides available interview dates and time slots
- Records candidate's selected slot in recruitment calendar
- Sends formal interview invitation with details

### Workflow 3: Interview Invitation and Calendar Scheduling

- Processes selected interview date and time
- Adds appointment to recruitment calendar
- Sends formal interview invitation to candidate

### Workflow 4: Final Hiring Decision and Feedback Email

- Evaluates final interview score against threshold
- Sends hiring confirmation email to selected candidates
- Sends rejection/feedback email to non-selected candidates

---

## Frontend Development Scope

### Pages and Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page with feature showcase and CTA |
| `/pages/login` | Login/registration page |
| `/pages/about` | About page |
| `/pages/job-requisitions` | Job posting/management page |

### Key Frontend Features

1. **Job Posting Interface** - HR can create and publish job vacancies with title, description, required skills, experience, qualifications
2. **Candidate Application Form** - Candidates submit personal information and upload CV
3. **Candidate Scoring** - ATS scores displayed alongside candidate data
4. **Shortlisted Candidates** - View and manage shortlisted applicants
5. **Interview Evaluation** - Enter and evaluate interview scores
6. **Real-time Analytics** - Live dashboards tracking hiring funnel metrics

### UI Patterns

- **Sticky sidebar** with navigation for large screens (lg+)
- **Mobile sidebar overlay** for small screens
- **Top bar** with page title, language selector, user profile
- **Gradient backgrounds** with radial gradient accents
- **Card-based layout** for features and data display
- **Interactive badges** for status tracking
- **Search/filter** functionality in tables
- **Language switching** (EN/DE) with persistent storage

---

## Backend Automation Scope

### n8n Workflow Configuration

Each workflow connects to the others through webhook calls:

1. **Trigger events**: Google Sheet row updates, form submissions, status changes
2. **Data processing**: CSV parsing, AI screening, score calculation
3. **Email notifications**: Automated sendGrid or SES emails
4. **Calendar integration**: Schedule interview slots
5. **Status progression**: Badge cycling through application pipeline

### Data Storage Model

- **Primary**: Google Sheets (per-user candidate sheets)
- **Mapper**: Central mapping sheet linking users to their sheets
- **Structure**: Column-oriented data with headers like:
  - `applicantname`, `role`, `company`, `email`, `location`
  - `atsscore`, `status`, `review`, `interview`, `offer`, `reject`
  - `dateApplied`, `relativeDate`, `skillsneeded`
  - `rank`, `workplace`

### Webhook Parameter Schema

All n8n webhooks accept these core parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User email or identifier |
| `id` | number | Application/row ID in Google Sheet |
| `statusState` | string | Badge type (applied, interview, review, offer, reject) |
| `role` | string | Job position/role name |
| `dataBaseId` | string | Google Sheet base ID |
| `formula` | string | Spreadsheet formula to evaluate |
| `cols` | array | Columns to modify/evaluate |

---

## Security & Configuration

### Environment Variables

**.env.example** defines required variables:

```
# Google Drive Integration
NEXT_PUBLIC_GOOGLE_API_KEY=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=

# N8N Webhook URLs
N8N_WEBHOOK_URL=
N8N_INTERVIEW_WEBHOOK_URL=

# Supabase (configured in .env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**.env.local** currently contains Supabase configuration for authentication and storage.

### Google Sheets Sharing

Sheets must be shared as "Anyone with the link can view" for the CSV export to work. The system reads data via public export endpoints.

### OAuth 2.0

Google Drive integration requires:
1. Create Google Cloud project
2. Enable Drive API
3. Create OAuth 2.0 Client ID
4. Add `http://localhost:3000/api/drive/callback` to authorized redirect URIs

---

## Development & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Configuration Steps

1. Set up Google Cloud project with Drive API
2. Configure OAuth 2.0 credentials
3. Set up n8n workflows with appropriate webhooks
4. Configure Supabase project (if using authentication)
5. Create Google Sheets mapper and candidate sheets
6. Update .env.local with required values
7. Run `npm run dev` to start local development

### Deployment Notes

- Next.js app runs on port 3000 by default
- n8n webhooks should point to deployed instance URL
- Google Sheets sharing settings must allow public read access
- Environment variables must be set in deployment environment

---

## Troubleshooting

### Common Issues

1. **Google Sheets returns HTML instead of CSV**
   - Ensure sheet is shared as "Anyone with the link can view"
   - Check sharing settings and permissions

2. **Data not loading in table**
   - Verify userId matches a mapper sheet entry
   - Check Google Sheet permissions
   - Console will show specific error messages

3. **Status badge webhook failing**
   - Verify n8n webhook URL is correct
   - Check that userId and applicationId are valid
   - Ensure webhook accepts expected query parameters

4. **Language not switching**
   - Check localStorage for persisted language preference
   - LanguageContext should update on toggle

5. **Formula evaluation errors**
   - Check column headers match expected names
   - Verify formula syntax (IF, CONTAINS, RANK)
   - Console logs will show parse errors

### Debug Mode

Set `debug={true}` on `GoogleSheetReader` component to see:
- Loading state
- Error messages
- Transformed column data
- Row counts and structure

---

## Future Enhancements

Potential additions to the system:

1. **AI-powered interview scheduling** - Auto-suggest time slots based on availability
2. **Candidate ranking algorithm** - Beyond simple ATS scoring
3. **Email template system** - Branded communication templates
4. **Integration with ATS platforms** - Direct connections to Lever, Greenhouse, etc.
5. **Interview recording and analysis** - Audio/video capture with AI evaluation
6. **Dashboard customization** - User-selectable metrics and views
7. **Bulk operations** - Multiple candidate status updates at once
8. **API endpoints** - Restful API for external system integration

---

## Summary

This recruitment automation system provides a complete hiring workflow from job posting to final selection, leveraging:

- **Next.js 16** with App Router for the frontend
- **Google Sheets** as the primary data store
- **n8n workflows** for backend automation
- **React components** for consistent UI patterns
- **TypeScript** for type safety and developer experience
- **Tailwind CSS** for responsive styling

The system is designed to be extensible, with clear separation between frontend presentation, backend automation, and data storage. New features can be added by extending the component library, adding new n8n workflows, or enhancing the Google Sheets data model.

The bilingual (EN/DE) support makes it suitable for international teams, and the interactive badge system provides a visual progress tracker through the hiring pipeline.