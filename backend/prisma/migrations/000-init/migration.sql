-- create extension
CREATE EXTENSION IF NOT EXISTS vector;

-- create tables (minimum)
CREATE TABLE "User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE "Note" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  "ownerId" uuid REFERENCES "User"(id),
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

CREATE TABLE "Document" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text,
  text text,
  "ownerId" uuid REFERENCES "User"(id),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE "DocumentChunk" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "documentId" uuid REFERENCES "Document"(id),
  content text,
  embedding vector(1536),
  "createdAt" timestamptz DEFAULT now()
);
