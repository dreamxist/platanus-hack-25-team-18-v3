# BananaPie Database Documentation

## Overview

**Project Name:** BananaPie
**Database Version:** PostgreSQL 17.6.1.052
**Region:** us-east-2
**Status:** Active & Healthy

This database supports a political opinion matching application that helps users find candidates aligned with their views on various topics using vector embeddings for semantic similarity.

---

## Database Schema

### Tables

#### 1. **Candidates**
Stores information about political candidates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| name | varchar | Yes | - | Candidate's name |
| age | bigint | Yes | - | Candidate's age |
| political_party | varchar | Yes | - | Political party affiliation |
| image | varchar | Yes | - | URL to candidate's image |

**Primary Key:** `id`
**Current Rows:** 2
**RLS Enabled:** No

**Referenced By:**
- `Opinions.candidate_id`
- `Conversations.candidate_id`

---

#### 2. **Topics**
Stores political topics that candidates and users can express opinions on.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| name | varchar | No | - | Topic name (e.g., "Economía y Desarrollo") |
| emoji | varchar | Yes | - | Emoji representation of the topic (e.g., "💼") |

**Primary Key:** `id`
**Current Rows:** 15
**RLS Enabled:** No

**Referenced By:**
- `Opinions.topic_id`
- `UserTopics.topic_id`

---

#### 3. **Opinions**
Stores candidate opinions on various topics with vector embeddings for semantic matching.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| candidate_id | bigint | No | - | Foreign key to Candidates |
| topic_id | bigint | No | - | Foreign key to Topics |
| text | text | Yes | - | Opinion text content |
| embedding | vector | Yes | - | Vector embedding for semantic search |

**Primary Key:** `id`
**Current Rows:** 0
**RLS Enabled:** No

**Foreign Keys:**
- `candidate_id` → `Candidates.id`
- `topic_id` → `Topics.id`

**Referenced By:**
- `Answers.opinion_id`

---

#### 4. **UserTopics**
Junction table linking users to topics they're interested in.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| user_id | uuid | No | - | Foreign key to auth.users |
| topic_id | bigint | No | - | Foreign key to Topics |

**Primary Key:** `id`
**Current Rows:** 18
**RLS Enabled:** No

**Foreign Keys:**
- `user_id` → `auth.users.id`
- `topic_id` → `Topics.id`

---

#### 5. **Answers**
Stores user responses to candidate opinions (agreement/disagreement).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| opinion_id | bigint | No | - | Foreign key to Opinions |
| user_id | uuid | No | - | Foreign key to auth.users |
| choice | boolean | No | - | User's choice (true=agree, false=disagree) |

**Primary Key:** `id`
**Current Rows:** 0
**RLS Enabled:** No

**Foreign Keys:**
- `opinion_id` → `Opinions.id`
- `user_id` → `auth.users.id`

---

#### 6. **Conversations**
Stores conversation sessions between users and candidates.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| candidate_id | bigint | No | - | Foreign key to Candidates |
| status | varchar | No | - | Conversation status |

**Primary Key:** `id`
**Current Rows:** 0
**RLS Enabled:** No

**Foreign Keys:**
- `candidate_id` → `Candidates.id`

**Referenced By:**
- `Messages.conversation_id`

---

#### 7. **Messages**
Stores individual messages within conversations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | bigint | No | Auto-increment | Primary key |
| created_at | timestamptz | No | now() | Record creation timestamp |
| updated_at | timestamp | No | now() | Last update timestamp |
| conversation_id | bigint | No | - | Foreign key to Conversations |
| text | text | Yes | - | Message content |
| role | varchar | No | - | Message role (user/assistant) |

**Primary Key:** `id`
**Current Rows:** 0
**RLS Enabled:** No

**Foreign Keys:**
- `conversation_id` → `Conversations.id`

---

## Database Relationships

```
auth.users (Supabase Auth)
    ├─→ UserTopics (user_id)
    └─→ Answers (user_id)

Candidates
    ├─→ Opinions (candidate_id)
    └─→ Conversations (candidate_id)

Topics
    ├─→ Opinions (topic_id)
    └─→ UserTopics (topic_id)

Opinions
    └─→ Answers (opinion_id)

Conversations
    └─→ Messages (conversation_id)
```

---

## Installed Extensions

| Extension | Version | Schema | Description |
|-----------|---------|--------|-------------|
| plpgsql | 1.0 | pg_catalog | PL/pgSQL procedural language |
| vector | 0.8.0 | public | Vector data type and ivfflat/hnsw access methods for embeddings |
| supabase_vault | 0.3.1 | vault | Supabase Vault Extension for secrets management |
| uuid-ossp | 1.1 | extensions | Generate universally unique identifiers (UUIDs) |
| pgcrypto | 1.3 | extensions | Cryptographic functions |
| pg_stat_statements | 1.11 | extensions | Track execution statistics of all SQL statements |
| pg_graphql | 1.5.11 | graphql | GraphQL support for PostgreSQL |

---

## Key Features

### Vector Embeddings
The `Opinions` table uses the `vector` extension to store embeddings, enabling semantic similarity search for matching user preferences with candidate positions.

### Authentication Integration
The schema integrates with Supabase Auth (`auth.users`) for user management, linking users to their topic preferences and answers.

### Audit Trail
All tables include `created_at` and `updated_at` timestamps for tracking record lifecycle.

---

## Important Observations

### Security Concerns
- **Row Level Security (RLS) is disabled on all tables**. Consider enabling RLS to protect user data and ensure users can only access their own records.
- No visible policies are in place for data access control.

### Recommendations
1. **Enable RLS** on all tables containing user data (UserTopics, Answers, Conversations, Messages)
2. **Create RLS policies** to restrict access:
   - Users should only see their own answers, topics, and conversations
   - Candidate and opinion data might be publicly readable
3. **Add indexes** on foreign keys for better query performance:
   - `Opinions.candidate_id`, `Opinions.topic_id`
   - `Answers.user_id`, `Answers.opinion_id`
   - `UserTopics.user_id`, `UserTopics.topic_id`
   - `Messages.conversation_id`
4. **Add vector indexes** on `Opinions.embedding` for efficient similarity search (HNSW or IVFFlat)
5. **Consider adding unique constraints** where applicable (e.g., one answer per user per opinion)
6. **Add NOT NULL constraints** where appropriate to enforce data integrity

---

## Supabase Advisor Findings

### Security Issues (CRITICAL)

#### 1. RLS Disabled on All Public Tables - ERROR Level
All 7 tables in the public schema have Row Level Security disabled, exposing them to unauthorized access via PostgREST:

- `Answers` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `Candidates` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `Conversations` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `Messages` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `Opinions` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `Topics` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- `UserTopics` - [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

**Impact:** Any authenticated user can read, insert, update, or delete data in these tables through the Supabase API.

#### 2. Extension in Public Schema - WARN Level
The `vector` extension is installed in the public schema, which is not recommended for security.
- [Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)

#### 3. Leaked Password Protection Disabled - WARN Level
Auth leaked password protection (HaveIBeenPwned.org integration) is currently disabled.
- [Fix Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

### Performance Issues (INFO)

#### Unindexed Foreign Keys
The following foreign keys lack covering indexes, which can significantly impact query performance:

**Answers Table:**
- `opinion_id` (Answers_opinion_id_fkey)
- `user_id` (Answers_user_id_fkey)

**Conversations Table:**
- `candidate_id` (Conversations_candidate_id_fkey)

**Messages Table:**
- `conversation_id` (Messages_conversation_id_fkey)

**Opinions Table:**
- `candidate_id` (Opinions_candidate_id_fkey)
- `topic_id` (Opinions_topic_id_fkey)

**UserTopics Table:**
- `user_id` (UserTopics_user_id_fkey)
- `topic_id` (UserTopics_topic_id_fkey)

[Fix Guide](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

**Impact:** Queries joining these tables or filtering by foreign keys will perform full table scans instead of efficient index lookups.

---

## Migrations

No migrations have been tracked yet. Consider using Supabase migrations to track schema changes going forward.

---

## Current Data Status

| Table | Row Count |
|-------|-----------|
| Candidates | 2 |
| Topics | 15 |
| UserTopics | 18 |
| Opinions | 86 |
| Answers | 0 |
| Conversations | 0 |
| Messages | 0 |

### Candidates
1. **Jeannette Jara** (51 años)
   - Partido: Partido Comunista de Chile
   - Opiniones: 26
   - ⚠️ Issue: El nombre tiene un salto de línea al final (`\n`)

2. **José Antonio Kast** (59 años)
   - Partido: Partido Republicano
   - Opiniones: 60

### Topics (15 temas con emojis)

| Tema | Emoji | Opiniones |
|------|-------|-----------|
| Economía y Desarrollo | 💼 | 9 |
| Seguridad Social | 🔒 | 4 |
| Salud | 🏥 | 4 |
| Educación | 🎓 | 5 |
| Vivienda y Urbanismo | 🏘️ | 4 |
| Seguridad y Orden Público | 🔒 | 13 |
| Justicia, Derechos y Libertades | ⚖️ | 6 |
| Medio Ambiente y Energía | 🌱 | 4 |
| Agricultura y Desarrollo Rural | 🌾 | 2 |
| Transporte e Infraestructura | 🚗 | 4 |
| Políticas Sociales y Comunidad | 👥 | 8 |
| Gobernanza, Instituciones y Estado | 🏛️ | 8 |
| Política Exterior | 🌍 | 5 |
| Innovación, Tecnología y Digitalización | 💡 | 4 |
| Cultura, Ciencia y Sociedad | 🎨 | 6 |

### Opinions Status
- **Total**: 86 opiniones
- **Con embeddings**: 0 (ninguna tiene vectores generados aún)
- **Sin embeddings**: 86 (100%)

⚠️ **Acción requerida**: Las 86 opiniones necesitan que se generen sus embeddings vectoriales para habilitar la búsqueda por similitud semántica.

### Data Issues Found
1. **Candidate name formatting**: "Jeannette Jara" tiene un salto de línea (`\n`) al final del nombre que debería limpiarse
2. **Missing embeddings**: Ninguna opinión tiene embeddings generados, lo que impide el matching por similitud semántica
