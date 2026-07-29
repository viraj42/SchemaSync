<div align="center">

<h1>⚡ SchemaSync</h1>
<p><strong>An AI-assisted data onboarding middleware that intelligently maps messy B2B SaaS CSV uploads into standard schemas using Google Gemini, Kafka, Spring Boot 4, and React 19.</strong></p>

<br />

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-Event%20Streaming-231F20?style=flat-square&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-LangChain4j%201.15.1-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Persistence-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Tracking-red?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

<br />

| 🌐 Live Demo |
|:---:|
| `https://schemasync.vercel.app/` |

</div>

---

## 📋 Table of Contents

1. [What is SchemaSync?](#-what-is-schemasync)
2. [Architecture Overview](#-architecture-overview)
3. [Tech Stack](#-tech-stack)
4. [Feature Breakdown](#-feature-breakdown)
   - [Asynchronous Ingestion Pipeline](#1-asynchronous-ingestion-pipeline)
   - [AI-Powered Schema Mapping](#2-ai-powered-schema-mapping)
   - [Resilient Dead Letter Queue (DLQ)](#3-resilient-dead-letter-queue-dlq)
   - [Real-Time Progress Tracking](#4-real-time-progress-tracking)
   - [Interactive Failure Resolution](#5-interactive-failure-resolution)
5. [API Reference](#-api-reference)
6. [Project Structure](#-project-structure)
7. [Local Development Setup](#-local-development-setup)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
8. [Environment Variables](#-environment-variables)
9. [Database Schema](#-database-schema)
10. [Design & Scaling Considerations](#-design--scaling-considerations)

---

## 🚀 What is SchemaSync?

SchemaSync is a **bounded internal onboarding service** designed to solve a universal B2B SaaS problem: when new clients onboard, they hand over legacy data in messy, inconsistently formatted CSV files that don't match your system's target database schema.

Instead of hand-writing brittle mapping scripts, SchemaSync automates the mapping using **Google Gemini (via LangChain4j)**. However, its core design philosophy is strict safety: **the AI's output is never allowed near the production database without passing through a deterministic Java validation sandbox first.** Built with **Apache Kafka**, it isolates the heavy LLM processing asynchronously and leverages a robust **Dead Letter Queue (DLQ)** to catch, categorize, and recover failed records idempotently.

### What makes this different from simple scripts?

| Capability | SchemaSync |
|---|---|
| AI-driven data normalization (Gemini) | ✅ |
| Event-driven architecture (Apache Kafka) | ✅ |
| Deterministic Jackson + Bean Validation Guardrails | ✅ |
| Categorized Dead Letter Queue (DLQ) routing | ✅ |
| Idempotent upserts for safe Kafka redelivery | ✅ |
| Modern, glassmorphic React 19 Developer UI | ✅ |
| Granular failure tracking (`PARSE_ERROR`, `SCHEMA_MISMATCH`, etc.) | ✅ |
| Inline manual correction bypassing the LLM | ✅ |

---

## 🏗 Architecture Overview

```text
┌───────────────────────────────────────────────────────────────┐
│                      CLIENT / USER UI                         │
│       (React 19 SPA — Drag & Drop CSV Upload)                 │
└──────────────────────────┬────────────────────────────────────┘
                           │  MultipartFile (CSV)
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                     SCHEMASYNC BACKEND                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   UploadService.java                    │  │
│  │   ① Parse CSV; apply file-level sanitization            │  │
│  │   ② Drop PARSE_ERROR malformed rows to DLQ instantly    │  │
│  │   ③ Publish valid raw rows to Kafka Topic               │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                   │
│                 [RAW_INGESTION_TOPIC]                         │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │                RawIngestionConsumer                     │  │
│  │   ① Group messages by Job ID into Batches               │  │
│  │   ② Call SchemaMappingAssistant (Gemini LLM)            │  │
│  │   ③ Route to Validation Sandbox (Bean Validation)       │  │
│  │   ④ Save valid records to DB via idempotent upsert      │  │
│  │   ⑤ Route INVALID & LLM_RATE_LIMITED to typed DLQ       │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────┬────────────┘
                           │                       │
                           ▼                       ▼
┌───────────────────────────────────┐    ┌──────────────────┐
│      POSTGRESQL DATABASE          │    │   DLQ SYSTEM     │
│ (Customer Records, Jobs, DLQs)    │    │ (Kafka & REST)   │
└───────────────────────────────────┘    └──────────────────┘
```

### Request Lifecycle (Happy Path)

```text
CSV Upload arrives  →  [UploadService checks encoding/format]
  →  [Parse CSV into lines]
  →  [Drop PARSE_ERROR lines directly into DB DLQ]
  →  [Publish valid lines to RAW_INGESTION_TOPIC Kafka Topic]
  →  [Return 202 Accepted with jobId to Client]
  →  [RawIngestionConsumer pulls from topic in background]
  →  [LLM Gemini Maps schema]
  →  [Validation Sandbox evaluates Gemini output]
  →  [Upsert successful records to Postgres]
  →  [Update Redis HINCRBY progress metrics (Frontend Polls API)]
```

---

## 🛠 Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 17 |
| Framework | Spring Boot | 4.1.0 |
| Event Streaming | Apache Kafka (KRaft mode) | — |
| Web | Spring MVC (Servlet API) | — |
| AI Integration | LangChain4j | 1.15.1 |
| LLM | Google Gemini (Flash) | — |
| Validation | Jackson + Bean Validation | — |
| Cache/Progress | Redis | — |
| ORM | Spring Data JPA + Hibernate | — |
| Database | PostgreSQL | — |
| Build | Maven | 3.9 |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Language | JavaScript (ES2022+) | — |
| Framework | React | 19 |
| Build Tool | Vite | 5+ |
| Routing | React Router DOM | 7 |
| HTTP Client | Axios | — |
| CSS | Tailwind CSS v4 | 4.0 |

---

## ✨ Feature Breakdown

### 1. Asynchronous Ingestion Pipeline
When a user uploads a CSV, `UploadService` applies file-level checks (encoding, structure) and parses it using `Commons CSV`. Rows that fail to parse structurally are routed directly to the DLQ (`PARSE_ERROR`), skipping the Kafka processing queue completely. Valid rows are published as `RawRowMessage` events to the `RAW_INGESTION_TOPIC` Kafka topic. The API returns immediately (`202 Accepted`) with a `jobId`.

### 2. AI-Powered Schema Mapping
The `@KafkaListener` worker consumes batches and passes them to LangChain4j. The prompt enforces a strict rule: **null over invented value**. Gemini Maps the unpredictable columns into a strictly typed `CustomerRecord` schema (`fullName`, `email`, `phone`, `role`, `company`, `joinDate`). Crucially, the AI output is passed through a rigid Jackson and Bean Validation sandbox before proceeding. 

### 3. Resilient Dead Letter Queue (DLQ)
SchemaSync uses a typed failure taxonomy to route bad rows logically, ensuring partial success is a first-class outcome:
- **`PARSE_ERROR`**: Malformed structurally (handled pre-Kafka).
- **`MISSING_REQUIRED_FIELD`**: The LLM could not find a value for a mandatory field.
- **`SCHEMA_MISMATCH` / `TYPE_INVALID`**: Validation sandbox rejected the LLM's structure.
- **`LLM_RATE_LIMITED` / `TRANSIENT_ERROR`**: API throttling or timeouts (eligible for blind retry).

### 4. Real-Time Progress Tracking
When a job is created, Redis tracks the `{total, processed, failed}` counts via atomic `HINCRBY` operations. The React frontend actively polls the Job Status API to query these counts, displaying an animated progress bar that automatically stops when the job concludes.

### 5. Interactive Failure Resolution
The **Failures Page** turns the DLQ from a pile of errors into actionable tickets sorted by root cause. It offers two distinct recovery paths:
- **Retry (POST):** For transient failures (`LLM_RATE_LIMITED`).
- **Edit & Correct (PATCH):** For deterministic failures (e.g. `MISSING_REQUIRED_FIELD`). A human supplies the correct value in an inline form. This payload explicitly **skips the LLM entirely**, goes straight to the validation sandbox, and persists.

---

## 📡 API Reference

### Upload & Jobs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/jobs/upload` | Multipart upload (pre-filtered) → `{ jobId }` |
| GET | `/api/jobs/{jobId}` | Get real-time job status snapshot |
| GET | `/api/jobs/{jobId}/records` | Paginated successful records |
| GET | `/api/jobs/{jobId}/failures`| Paginated DLQ records with `failure_reason` |

### DLQ & Recovery
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/jobs/{jobId}/retry/{recordId}` | Re-run pipeline for transient failures |
| PATCH | `/api/jobs/{jobId}/failures/{recordId}`| Human supplies missing values (skips LLM) |

---

## 📁 Project Structure

```text
SchemaSync/
├── src/main/java/com/schemasync/schemasync/
│   ├── SchemaSyncApplication.java        # Spring Boot entry point
│   ├── client/           # API Consumers & Keys
│   ├── config/           # Kafka, Security, Cors Configs
│   ├── customerrecord/   # Core Normalized Domain Entity
│   ├── dlq/              # Typed DLQ Enum & Persistence
│   ├── ingestionjob/     # Job Tracking & Status Enum
│   ├── kafka/            # Producers, KRaft Consumers, Event Models
│   ├── mapping/          # LangChain4j Assistant & Gemini Integration
│   ├── targetschema/     # Expected Schema Definitions
│   ├── upload/           # CSV parsing & pre-Kafka sanitization
│   └── validation/       # Deterministic Bean Validation sandbox
│
├── pom.xml
│
└── Frontend/my-app/
    ├── src/
    │   ├── api/          # Axios HTTP clients
    │   ├── components/   # Lean UI Components (ProgressBar, TopBar)
    │   ├── context/      # React Context (Auth)
    │   └── pages/        # Views (Upload, Progress, Failures)
    ├── tailwind.config.js# Custom themes and colors
    └── vite.config.js
```

---

## 🖥 Local Development Setup

### Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Java JDK | 17 | Spring Boot backend |
| Maven | 3.9 | Build backend |
| Node.js | 20 | Vite frontend |
| npm | 9+ | Frontend package manager |
| PostgreSQL | 14+ | Database |
| Kafka | KRaft / 3.x | Event streaming |
| Redis | Any | Counters & Progress Metrics |

---

### Backend Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-username/SchemaSync.git
cd SchemaSync
```

**2. Configure the database and properties**

Ensure your PostgreSQL and Redis instances are running. In your `application.properties` (or environment variables), set:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/schemasync
spring.datasource.username=your_db_user
spring.datasource.password=your_db_password

gemini.api.key=YOUR_GEMINI_API_KEY
```

**3. Start Kafka**

Ensure Kafka is running and listening on `localhost:9092`. The application will automatically create required topics (`raw-ingestion`).

**4. Run the backend**

```bash
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`.

---

### Frontend Setup

**1. Install dependencies**

```bash
cd Frontend/my-app
npm install
```

**2. Start the dev server**

```bash
npm run dev
```

The app starts on `http://localhost:5173`.

---

## 🔧 Environment Variables

### Backend (`application.properties` or system environment)

| Variable | Required | Default | Description |
|---|---|---|---|
| `spring.datasource.url` | ✅ | `jdbc:postgresql://localhost:5432/schemasync` | PostgreSQL connection string |
| `spring.datasource.username` | ✅ | — | DB username |
| `spring.datasource.password` | ✅ | — | DB password |
| `gemini.api.key` | ✅ | — | Google Gemini API Key |
| `spring.kafka.bootstrap-servers`| ❌ | `localhost:9092` | Kafka broker URL |
| `spring.data.redis.host` | ❌ | `localhost` | Redis server hostname |
| `spring.data.redis.port` | ❌ | `6379` | Redis server port |

---

## 🗄 Database Schema

The core tables used by SchemaSync for persistence:

```sql
-- Ingestion Jobs (Tracks file uploads & status)
CREATE TABLE ingestion_jobs (
    id                  BIGSERIAL PRIMARY KEY,
    total_records       INTEGER NOT NULL DEFAULT 0,
    processed_records   INTEGER NOT NULL DEFAULT 0,
    failed_records      INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(50) NOT NULL,
    created_at          TIMESTAMP NOT NULL
);

-- Customer Records (Normalized Output)
CREATE TABLE customer_records (
    id                  BIGSERIAL PRIMARY KEY,
    job_id              BIGINT REFERENCES ingestion_jobs(id),
    full_name           VARCHAR(255),
    email               VARCHAR(255),
    phone               VARCHAR(50),
    role                VARCHAR(100),
    company             VARCHAR(100),
    join_date           TIMESTAMP
);

-- Dead Letter Queue (Failed Records)
CREATE TABLE dlq_records (
    id                  BIGSERIAL PRIMARY KEY,
    job_id              BIGINT REFERENCES ingestion_jobs(id),
    row_index           INTEGER NOT NULL,
    raw_payload         TEXT NOT NULL,
    failure_reason      VARCHAR(100) NOT NULL, -- e.g., SCHEMA_MISMATCH
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING_RETRY',
    created_at          TIMESTAMP NOT NULL,
    UNIQUE(job_id, row_index)
);
```

---

## 📐 Design & Scaling Considerations

| Layer | Mechanism |
|---|---|
| **Idempotency by Design** | Each message carries a record key hashed from `jobId + rowIndex`. Postgres writes are upserts, preventing record duplication under Kafka's at-least-once redelivery guarantees. |
| **Strict Scope Boundaries** | SchemaSync intentionally avoids directly writing to a client's core production system (last-mile sync). It is designed to format, clean, and validate legacy data into an intermediary normalized structure. |
| **LLM Throughput Limit** | The structural pipeline can scale infinitely via Kafka partitions, but real-world throughput is bounded by synchronous LLM calls against the Gemini API limit. The platform gracefully degrades with `LLM_RATE_LIMITED` DLQ routing when throttled. |
| **Concurrency & Redis** | Redis `HINCRBY` atomic operations ensure UI tracking numbers don't face race conditions when multiple Kafka listeners process lines simultaneously. |

---

<div align="center">

Built natively as resilient, production-ready middleware.
<br />
Made with ☕ by **Viraj Padaval**

</div>
