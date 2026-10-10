# SentinelRAG - Current Working Features

This document describes what is currently implemented and available in the
SentinelRAG project.

## 1. Web application

The project currently has a React/Vite frontend with these pages:

- **Landing page**: Shows the SentinelRAG product introduction, security
  features, demo users, and links to the main modules.
- **Secure Chat**: Allows an authenticated demo user to ask questions about
  authorized enterprise documents.
- **Vault / Document Management**: Displays documents stored in the vault,
  including title, department, sensitivity, file type, permissions, access
  status, and chunk count.
- **Security Center**: Displays security statistics, security events, audit
  logs, and a PromptGuard testing playground.
- **Profile**: Shows the signed-in user's identity, role, department, and
  email, and allows the user to upload a profile image.
- **Theme switching**: Supports dark and light mode in the frontend.

## 2. Demo user authentication

- The application loads the four default users from Supabase through the
  backend.
- If the profiles table is empty, the backend initializes the four default
  profiles.
- If the backend demo-user endpoint is unavailable, the frontend falls back
  to local demo profiles.
- Users can switch between these roles from the interface:
  - `ADMIN`
  - `HR_MANAGER`
  - `FINANCE_MANAGER`
  - `EMPLOYEE`
- The selected user's access token is stored in browser local storage and
  sent with API requests.
- The backend supports JWT-based identity information containing the user ID,
  role, and department.
- Users can register from the user menu. New accounts are stored in Supabase
  with the `EMPLOYEE` role and selected department.
- Registered users can sign in with their email and password.
- Authenticated users can see peer profiles in the organization list, but
  peer entries are display-only and cannot be selected to impersonate another
  account. Document and chat access always use the signed-in user's JWT.
- Administrators can view registered users in the Security Center and assign
  `ADMIN`, `HR_MANAGER`, `FINANCE_MANAGER`, or `EMPLOYEE` roles. The backend
  protects this operation with an admin-only permission check.

## 3. Document upload and ingestion

Authorized users (`ADMIN`, `HR_MANAGER`, and `FINANCE_MANAGER`) can upload
documents from the Vault page.

The backend currently:

1. Accepts a document upload with title, description, department,
   sensitivity, and allowed roles.
2. Reads PDF files using PyMuPDF.
3. Reads non-PDF text files as UTF-8 text.
4. Splits document text into overlapping chunks.
5. Generates embeddings for the chunks.
6. Stores document metadata, permissions, and chunks in the configured vault
   database or local fallback store.
7. Records a document-upload audit event.

When Supabase is configured, the original uploaded file is also stored in the
private Supabase Storage bucket named `documents`. The `documents.file_path`
column stores the Storage object path. The original file is removed from
Storage when an administrator deletes the document.

During upload, the user can explicitly select which roles may access the
document:

- `ADMIN`
- `HR_MANAGER`
- `FINANCE_MANAGER`
- `EMPLOYEE`

Multiple roles can be selected. If no roles are selected, the existing
sensitivity and department policy determines access. Explicit role selections
are enforced in addition to the document sensitivity policy, and invalid role
values are rejected by the backend.

The frontend shows upload progress and reports the number of processed chunks.

## 4. Document listing and document viewing

The Vault page currently fetches documents from the backend and shows them to
the user.

Available behavior includes:

- Fetching all vault documents with `GET /api/documents/all`.
- Showing document metadata and whether the current user has access.
- Showing the number of indexed chunks for each document.
- Filtering the document list by available UI filters.
- Opening an authorized document to fetch and display its indexed chunks.
- Preventing unauthorized users from inspecting document chunks.
- Deleting documents when the current user has the required permission.

The current implementation displays parsed/indexed document chunks in the
application. It does not currently provide a separate original-file download
endpoint.

## 5. Secure chat and RAG retrieval

Authenticated users can submit questions through the Secure Chat page.

The backend chat flow currently:

1. Checks the query with PromptGuard.
2. Creates an embedding for the query.
3. Applies role, department, sensitivity, and document-permission checks
   before retrieval.
4. Searches only authorized document chunks.
5. Generates an answer from the authorized chunks.
6. Returns citations containing the document title, page number, source type,
   and a content snippet.
7. Displays a security trace containing searched documents, authorized
   documents, denied documents, and retrieved chunks.

If a query targets a restricted document, the response reports that access
was denied and explains that the restricted content was filtered before it
reached the AI context.

## 6. Prompt injection protection

PromptGuard currently detects several unsafe patterns, including:

- Attempts to ignore or override previous instructions.
- Jailbreak and developer-mode requests.
- System prompt or hidden-context extraction requests.
- Security-policy and permission bypass requests.
- Context delimiter injection.
- Obfuscated payload execution requests.

Blocked prompts return a security error and create security/audit events.

## 7. PII detection and redaction

The backend currently detects and masks these PII patterns in generated
responses and PromptGuard test input:

- Social Security numbers
- Credit card numbers
- Email addresses
- Phone numbers
- Bank or routing identifiers

When PII is redacted from an AI response, the response security trace reports
the number of redacted items and the application records a security event.

## 8. Security dashboard and audit telemetry

The Security Center currently provides:

- Dynamic total query, authorized query, and access-denied counts based on
  stored `CHAT_QUERY` audit records.
- Dynamic prompt-injection and PII-redaction counts based on stored security
  events.
- Dynamic vault document and vector-chunk counts from the database.
- A dynamic threat-breakdown donut based on recorded PromptGuard categories:
  instruction overrides, security policy overrides, prompt exfiltration, and
  context delimiters.
- PromptGuard, PII scanner, RBAC, and vector database status indicators.
- Security event history.
- Audit log history.
- A live PromptGuard test endpoint for checking an arbitrary prompt.

The dashboard no longer uses fabricated minimum values or hardcoded threat
percentages. Empty databases can therefore correctly display zero activity.

## 9. Backend API currently available

The FastAPI backend currently exposes:

- `GET /api/health`
- `GET /api/auth/demo-users`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/profile/avatar`
- `GET /api/auth/roles`
- `POST /api/documents/upload`
- `GET /api/documents/`
- `GET /api/documents/all`
- `GET /api/documents/{doc_id}/chunks`
- `DELETE /api/documents/{doc_id}`
- `POST /api/chat/`
- `GET /api/admin/roles`
- `POST /api/admin/roles`
- `POST /api/admin/members`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{user_id}/role`
- `GET /api/admin/stats`
- `GET /api/admin/events`
- `GET /api/admin/audit-logs`
- `POST /api/admin/test-guard`

Interactive API documentation is available at `/docs` when the backend is
running.

## 10. Current run commands

### Backend

From the `backend` directory:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

From the `frontend` directory:

```powershell
npm run dev
```

Default development URLs:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Backend API docs: `http://127.0.0.1:8000/docs`

## 11. Profile and avatar persistence

- Profile data is loaded from the authenticated user's `profiles` record.
- Avatar uploads are limited server-side to JPG, PNG, WEBP, or GIF files up to
  2 MB.
- The validated avatar is persisted in the Supabase `profiles.avatar_url`
  column and returned to the frontend.
- The navbar and profile page update immediately after a successful upload.
- The current implementation stores the image as a data URL in the profile
  record; it does not currently upload profile images to Supabase Storage.

## 12. Vercel deployment

- The frontend includes `frontend/vercel.json` with Vite build settings and a
  single-page-app fallback for React Router routes.
- Set the Vercel project root to `sentinelrag/frontend`.
- Use `npm run build` as the build command and `dist` as the output directory.
- Set `VITE_API_URL` in Vercel to the deployed FastAPI base URL ending in
  `/api`.
- Local development leaves `VITE_API_URL` empty and uses Vite's `/api` proxy.

## 13. Configuration-dependent behavior

The complete database and AI workflow depends on the backend `.env` values,
including:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `LLM_API_KEY`
- `EMBEDDING_API_KEY`

When external services are not configured, the project includes a local
fallback store for demo and testing behavior, but AI generation, embeddings,
and persistent Supabase storage require valid service configuration.

## Dynamic roles and member management
- Admins can create custom roles and organization members from Security Center.
- New admin-created members receive the initial password Sentinel@123 and must change it before entering the application.
- Roles are persisted in the roles table and are available for document restrictions.

If role creation reports that the roles table is unavailable, run supabase/fix_dynamic_roles.sql in the Supabase SQL Editor once, then restart the backend.
