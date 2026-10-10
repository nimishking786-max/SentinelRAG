# SentinelRAG

## The Problem

Enterprise AI can expose confidential information when retrieval ignores user permissions, prompt injections bypass safeguards, and sensitive data reaches the model context.

## Problem Statement

Organizations want employees to use AI over internal documents, but conventional RAG systems often retrieve data based on semantic similarity instead of authorization. As a result, an employee may receive confidential financial, HR, or executive information simply because the model found it relevant; malicious prompts can further manipulate retrieval, while sensitive identifiers can leak through generated responses. Enterprises therefore need a system that enforces access control before retrieval, prevents hostile queries from reaching the model, and proves how every answer was produced.

## Our Solution

SentinelRAG is a zero-trust enterprise AI vault that filters documents before retrieval with RBAC, blocks prompt injection, sanitizes PII, manages secure documents, and records tamper-evident audit trails.

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, GSAP, Lenis, and Recharts
- **Backend:** Python, FastAPI, Uvicorn, JWT authentication, Passlib, and bcrypt
- **Data and storage:** Supabase PostgreSQL, pgvector, Supabase Storage, and row-level security
- **AI security:** Permission-aware retrieval, PromptGuard heuristics, metadata filtering, and output sanitization

## Functionality

- User registration, login, persistent sessions, logout, and mandatory first-login password changes
- Role-based access control with admin-managed members and custom roles
- Secure document upload, processing, storage, deletion, and role restrictions
- Permission-filtered vector retrieval before AI context construction
- Prompt-injection detection, query security analysis, PII masking, and audit logging
- Secure chat with citations, security traces, and access-denied explanations
- Security dashboard with live telemetry, audit events, and sandbox testing
- Responsive cinematic interface with dark/light themes and smooth scrolling

## Scope

SentinelRAG is designed for internal enterprise knowledge workflows where employees need fast answers from sensitive documents without receiving information outside their authorization. The current scope covers authenticated document-grounded chat, organization-level RBAC, secure ingestion, retrieval-time enforcement, response sanitization, and security observability; future scope can include SSO, fine-grained team policies, multi-tenant deployment, external model providers, compliance exports, and production-scale retrieval infrastructure.
