# Code Carnival 3.0 — Idea Submission Deck (The Heist Plan)
## Project: SentinelRAG 🛡️ (Secure Multi-Modal AI Knowledge Vault)

> **Submission Guide / Professor's Rules:**
> - Final deck has **9 slides** (Instructions slide deleted).
> - Keep exact slide titles & section headers.
> - Bullets, not paragraphs (max 6 crisp bullets per slide).
> - Content below is tailored to **SentinelRAG** and ready to copy-paste directly into the PPTX template slides.

---

### SLIDE 1: Title Slide — The Heist Plan
* **TEAM NAME**: `[Your Team Name]`
* **TEAM ID**: `[Your Team ID from ADSC Portal]`
* **TEAM LEADER**: `[Team Leader Full Name]`
* **PROBLEM STATEMENT TITLE**: Enterprise Data Privacy & Zero-Trust Security in Generative AI / RAG Systems
* **THEME / TRACK**: AI / CyberSecurity / Enterprise Tech

---

### SLIDE 2: 01 — THE TARGET (Problem Statement & Understanding)

#### PROBLEM STATEMENT
* Generative AI and RAG systems routinely leak confidential corporate data through unauthorized retrieval.
* Enterprises across healthcare, finance, and HR face severe compliance risks (GDPR, HIPAA, SOC 2).
* Global breach costs average $4.88M per incident; LLM prompt injection is ranked OWASP #1 LLM vulnerability.

#### OUR UNDERSTANDING
* **Root Cause**: Traditional RAG queries all documents indiscriminately, relying on LLMs to self-censor ("Don't tell the user X").
* **Critical Gap**: LLMs are susceptible to prompt injection; once unauthorized data enters context, data exfiltration is trivial.
* **Urgency**: Organizations are halting enterprise AI adoption until mathematical, zero-trust retrieval guarantees exist.

> 💡 **Presenter Tip**: Emphasize that traditional LLM guardrails are like asking a thief nicely not to steal — SentinelRAG locks the vault door before retrieval even occurs.

---

### SLIDE 3: 02 — THE PLAN (Proposed Solution)

#### OUR IDEA
* **One-Line Pitch**: Permission-Aware Multi-Modal RAG that mathematically prevents data leaks by filtering data *before* vector retrieval.
* **Zero-Trust Retrieval**: Enforces Role-Based Access Control (RBAC) and document sensitivity tags directly at the vector database query layer.
* **Mathematically Immune**: Unauthorized chunks never enter LLM prompt context, rendering prompt injection extraction physically impossible.
* **Enterprise-Ready**: Real-time PromptGuard filter blocks jailbreaks; output scanner automatically scrubs PII (emails, SSNs, phone numbers).
* **Who Benefits**: Enterprise CXOs, HR, Legal, and Finance teams looking to adopt AI safely without exposing company secrets.

*(Visual to Insert: SentinelRAG High-Level Architecture Diagram / Concept Flow)*

---

### SLIDE 4: 03 — THE ARSENAL (Key Features / Functionality)

#### 01. Pre-Retrieval RBAC & Sensitivity Firewall
* Evaluates user role, department, and classification (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`) at the database level before semantic search.

#### 02. Real-Time PromptGuard & Jailbreak Quarantine
* Intercepts heuristic overrides, system prompt extraction, and instruction injection attacks with instant 403 quarantine triggers.

#### 03. Multi-Modal Document Ingestion & Chunking
* Securely parses PDFs and documents with metadata-tagged chunking, enterprise file previews, and instant vectorized indexing.

#### 04. Automated PII Redaction & Security Audit Logs
* Scans generated LLM outputs for sensitive identifiers, attaching an immutable trace of chunks retrieved vs. chunks denied.

---

### SLIDE 5: 04 — THE EXECUTION (How the Solution Will Work)

#### STEP 1: Authenticated Identity & Persona Resolution
* User logs in via JWT; role (`ADMIN`, `FINANCE_MANAGER`, `HR_MANAGER`, `EMPLOYEE`) and department context are cryptographically verified.

#### STEP 2: PromptGuard Heuristic Inspection
* Incoming prompt is scanned against known injection signatures and jailbreak syntax before triggering any backend workload.

#### STEP 3: Permission-Enforced Vector Search
* Vector search query executes SQL filter `WHERE sensitivity <= user_clearance AND (dept = user_dept OR dept = 'GLOBAL')` via pgvector.

#### STEP 4: Guarded Synthesis & Verifiable Citations
* Authorized chunks are injected into GPT-4o; response is scrubbed for PII and returned alongside a transparent security audit badge.

*(Visual to Insert: Execution Flowchart — User -> Auth -> PromptGuard -> RBAC Vector Store -> Safe LLM Response)*

---

### SLIDE 6: 05 — THE GEAR (Technology / Tech Stack)

| Layer | Technology | Why We Chose It |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | Blazing-fast responsive SPA with type safety and claymorphic design system |
| **Styling & UI** | Tailwind CSS + Framer Motion + Lucide | Dynamic modern UI, micro-animations, and clean security status indicators |
| **Backend** | Python 3.11 + FastAPI + Pydantic | High-performance asynchronous REST API with strict request validation |
| **Database & Vector** | Supabase PostgreSQL + `pgvector` | Native relational ACID security combined with scalable high-dimensional embeddings |
| **AI & LLM** | OpenAI GPT-4o + `text-embedding-3-small` | State-of-the-art reasoning combined with cost-efficient semantic vectorization |
| **Security & Auth** | Python-Jose (JWT) + Regex Heuristics | Zero-trust token issuance and sub-millisecond prompt injection interception |

---

### SLIDE 7: 06 — INSIDE THE MINT (Current Progress / Work Done)

#### COMPLETED
* Full end-to-end working prototype with FastAPI backend running on port 8000 and React Vite UI on port 3000.
* Multi-persona live switching (`ADMIN`, `FINANCE_MANAGER`, `HR_MANAGER`, `EMPLOYEE`) with distinct permission graphs.
* Prompt injection defense engine successfully catching and rejecting malicious queries (HTTP 403 test validated).
* Complete in-memory seed vault & Supabase migration schema for instant demonstration without cloud friction.

#### IN PROGRESS
* Multi-modal OCR pipeline integration using PyMuPDF and LayoutLM for scanned tabular reports.
* Streaming response support via Server-Sent Events (SSE) for sub-second perceived latency.
* Fine-tuning confidence thresholds for multi-tenant document classification.

*(Visual to Insert: Screenshot of SentinelRAG Dashboard showing successful query with security trace & denied query)*

---

### SLIDE 8: 07 — THE GETAWAY (Future Plan / Next Steps)

#### PHASE 1: During the Hackathon
* Polish live demo scenarios (Executive financial inquiry vs. unauthorized employee salary probe).
* Add live interactive policy simulator slider allowing judges to tweak clearance levels in real time.
* Package clean Docker Compose container for single-click deployment.

#### PHASE 2: Right After the Hackathon
* Local air-gapped LLM/Embedding fallback using ONNX & Ollama for classified networks.
* Enterprise connectors for Google Drive, Microsoft SharePoint, Slack, and Notion vaults.
* Cohere Rerank integration for precision chunk reordering post-RBAC filtering.

#### PHASE 3: Long-Term Vision
* Turn SentinelRAG into an open-source security gateway middleware for enterprise AI platforms.
* Commercial SaaS offering with SOC2/HIPAA automated compliance certification reporting.
* Federated zero-trust knowledge vaults for multi-organization consortiums.

---

### SLIDE 9: 08 — THE VAULT (Repository Link & Demo)

#### GITHUB REPOSITORY LINK
* `https://github.com/[username]/sentinelrag` *(Replace with your actual GitHub repo link)*

#### REPOSITORY HEALTH CHECKLIST
* ✅ **PUBLIC**: Repository visibility is configured to public for evaluation.
* ✅ **README**: Comprehensive guide with problem statement, architecture diagrams, setup, and demo personas.
* ✅ **COMMITS**: Clean, descriptive commit history across frontend and backend modules.

#### DEMO
* **Local Demo**: Running live on `http://localhost:3000` (Frontend) & `http://localhost:8000/docs` (Backend API).
* **Live Video / Link**: `[Optional Loom or YouTube demo walkthrough link]`
