---
name: rag-implementation
description: Use when building or debugging RAG systems, semantic search, vector databases, chunking strategies, embeddings, retrieval quality, hybrid search, reranking, or citation-aware answer generation.
---

# RAG Implementation

## Overview

Reference patterns for implementing Retrieval-Augmented Generation (RAG) in Cursor sessions.

Use this skill when the work involves ingestion pipelines, chunking, embeddings, vector search, retrieval tuning, or grounded answer generation. Treat the examples as proven defaults, then adapt them to the repo's actual stack and constraints.

## When To Use

Use this skill when the request involves:

- RAG or semantic search
- vector databases
- chunking or document segmentation
- embeddings or embedding model choice
- retrieval quality issues
- hybrid search or reranking
- source citations
- document ingestion and indexing

Do not use this skill for:

- plain keyword search with no semantic retrieval
- prompt-only tasks with no document retrieval
- model training / fine-tuning tasks unrelated to retrieval

## Recommended Defaults

For a production-ready default, start here:

- Vector DB: `Qdrant` for self-hosted production, `Pinecone` for managed setup, `Chroma` for local prototypes
- Chunking: semantic chunking with `10-20%` overlap
- Embeddings: `text-embedding-3-small` for strong default quality/cost balance
- Retrieval: `top_k=5-10`, score threshold, and metadata filters
- Generation: answer only from retrieved context and require citations
- Observability: log retrieval latency, hit counts, and source usage

Add complexity only after measuring a failure mode:

- Low recall -> query expansion or hybrid search
- Low precision -> reranking or better filters
- Missing context -> larger chunks or parent-child retrieval
- High latency/cost -> caching, batching, smaller embeddings, or fewer candidates

## Decision Guide

### Vector DB

| Option | Use When | Trade-off |
|--------|----------|-----------|
| `Qdrant` | You want strong self-hosted production defaults | More infrastructure ownership |
| `Pinecone` | You want a managed service and fast setup | Ongoing vendor cost |
| `Chroma` | You are prototyping locally or embedding a simple store | Weaker production story |
| `Weaviate` | You need richer schemas or GraphQL-style querying | More platform complexity |
| `Milvus` | You need large-scale distributed deployments | Higher operational overhead |

### Chunking

| Strategy | Use When | Trade-off |
|----------|----------|-----------|
| Fixed-size | Logs, transcripts, MVPs | Can break semantic boundaries |
| Semantic | Articles, docs, reports | More processing cost |
| Hierarchical | Structured manuals, books, legal docs | More complex ingest logic |
| Sliding window | Accuracy matters more than storage | Duplicate content overhead |

### Embeddings

| Model | Use When | Trade-off |
|-------|----------|-----------|
| `text-embedding-3-small` | Strong default for production | API cost |
| `text-embedding-3-large` | Quality matters more than cost | Higher cost and vector size |
| `all-mpnet-base-v2` | Self-hosted quality/cost compromise | Operational burden |
| `all-MiniLM-L6-v2` | Very fast local prototyping | Lower retrieval quality |

## Minimal Architecture

A good first implementation has four stages:

1. Ingest documents and normalize metadata.
2. Chunk content with stable overlap.
3. Generate embeddings and store vectors plus payload.
4. Retrieve, optionally rerank, then generate an answer using only retrieved context.

Keep document metadata rich from day one:

```python
payload = {
    "text": chunk,
    "source": "manual.pdf",
    "section": "installation",
    "page": 12,
    "category": "docs",
    "updated_at": "2026-04-17",
}
```

Rich metadata enables filtering, citations, debugging, and later ranking improvements.

## Qdrant Setup

Use this as the default self-hosted setup:

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

client = QdrantClient(url="http://localhost:6333")

client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(
        size=1536,
        distance=Distance.COSINE,
    ),
)

client.upsert(
    collection_name="documents",
    points=[
        PointStruct(
            id=1,
            vector=[0.1, 0.2, 0.3],
            payload={"text": "Document content", "source": "doc.pdf", "page": 1},
        )
    ],
)
```

Notes:

- Match vector size to the embedding model exactly.
- `COSINE` is the safest default for most embedding APIs.
- Store both raw text and metadata in payload for debugging and answer generation.

## Chunking Defaults

Start with semantic chunking for most natural language documents:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)

chunks = splitter.split_text(document_text)
```

Practical guidance:

- `800-1200` characters/tokens is a good first range for docs and articles.
- `10-20%` overlap is usually enough.
- If answers miss important nearby context, increase overlap before rewriting the whole system.
- If results are too broad or repetitive, shrink chunks or add reranking.

Use hierarchical chunking when structure matters:

- parent chunk: section title + summary
- child chunks: paragraphs or subsections
- retrieval flow: search children, then recover parent context for generation

## Embedding Selection

Use this order unless a project constraint says otherwise:

1. `text-embedding-3-small` for the default production path
2. `text-embedding-3-large` when retrieval quality is a bottleneck and budget allows it
3. `all-mpnet-base-v2` when you need local/self-hosted inference

Embedding rule:

- Use the same embedding model for indexing and querying.

Batching pattern:

```python
from openai import OpenAI

client = OpenAI()

def embed_texts(texts: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
    response = client.embeddings.create(model=model, input=texts)
    return [item.embedding for item in response.data]
```

## Retrieval Patterns

### Baseline Retrieval

Start simple:

- embed the query
- retrieve top `5-10`
- apply metadata filters where obvious
- pass the highest-signal chunks to generation

Add a score threshold if your vector store supports it.

### Hybrid Search

Use hybrid search when users type exact names, codes, or identifiers that dense search misses.

Typical mix:

- dense search for semantics
- sparse / keyword search for exact terms
- merge candidate sets
- rerank combined results

```python
def merge_scores(dense_results, sparse_results, dense_weight=0.7, sparse_weight=0.3):
    combined = {}
    for item in dense_results:
        combined[item["id"]] = {"result": item, "score": item["score"] * dense_weight}
    for item in sparse_results:
        if item["id"] in combined:
            combined[item["id"]]["score"] += item["score"] * sparse_weight
        else:
            combined[item["id"]] = {"result": item, "score": item["score"] * sparse_weight}
    return sorted(combined.values(), key=lambda x: x["score"], reverse=True)
```

### Reranking

Use reranking when initial recall is acceptable but final answer quality is poor.

- retrieve `20-50` candidates
- score `(query, chunk)` pairs with a cross-encoder or reranker
- keep the top `3-10` for generation

Reranking is usually the best next step when:

- retrieved chunks are relevant but not the most relevant ones
- responses include tangential facts
- top-k retrieval alone feels noisy

### Metadata Filtering

Filters are essential when the search space has obvious structure:

- tenant / workspace
- document type
- language
- date range
- author / team
- product / feature area

Use filters early to prevent semantically similar but contextually wrong matches.

## Query Optimization

If the query is short, vague, or misspelled:

- rewrite it into a cleaner search form
- expand synonyms only when recall is poor
- preserve exact entities, IDs, filenames, and product names

Do not over-expand every query. Query expansion increases recall but can reduce precision.

Good use cases:

- domain synonyms
- abbreviations
- shorthand questions
- vague user phrasing

Bad use cases:

- exact identifier lookups
- already-precise technical queries

## Context Construction

Generation quality often depends more on context packing than on the model.

Rules:

- sort retrieved chunks by final ranking score
- deduplicate near-identical passages
- fit context to a fixed token budget
- keep source labels attached
- instruct the model not to use knowledge outside provided context

Citation-oriented packing pattern:

```python
def build_context(sources: list[dict]) -> str:
    parts = []
    for i, source in enumerate(sources, start=1):
        parts.append(f"[{i}] {source['text']}")
    return "\n\n".join(parts)
```

Generation prompt guidance:

- answer only from provided sources
- cite source numbers inline, such as `[1]`
- say the answer is unknown if sources do not support it

## Production Practices

### Caching

Cache embeddings by stable text hash to avoid recomputation on re-ingest.

### Batching

Batch embeddings and upserts for throughput. Small one-document-at-a-time ingestion usually becomes the first scalability bottleneck.

### Idempotent Ingestion

Use stable IDs so re-indexing updates existing chunks instead of duplicating them.

### Observability

Track at least:

- retrieval latency
- generation latency
- number of retrieved chunks
- average similarity score
- reranker latency
- cache hit rate
- citation/source usage

### Evaluation

Keep a small benchmark set of real questions and expected supporting documents.

Measure:

- recall@k
- precision@k
- answer grounding / citation correctness
- latency

Do not tune chunking or ranking blindly.

## Common Mistakes

### Chunk size is wrong

Symptoms:

- Too small: answers miss context
- Too large: retrieval becomes vague and imprecise

Default fix:

- test `512`, `768`, `1024`, and `1536`
- keep everything else stable during evaluation

### Embedding model does not match the domain

Symptoms:

- code search with a generic language embedding
- poor retrieval for legal or medical text

Fix:

- use a better general model first
- then try domain-specific embeddings if the corpus truly demands it

### Metadata is too thin

Symptoms:

- results from the wrong document family
- no way to scope by time, tenant, or content type

Fix:

- store rich payload from the start

### No reranking

Symptoms:

- top results are related but not the best answers

Fix:

- add reranking before redesigning the whole pipeline

### No citation discipline

Symptoms:

- model answers confidently without clear evidence

Fix:

- require source labels in context and inline citations in answers

## Example: End-to-End Pipeline

```python
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from langchain.text_splitter import RecursiveCharacterTextSplitter


class RAGPipeline:
    def __init__(self):
        self.openai = OpenAI()
        self.qdrant = QdrantClient(url="http://localhost:6333")
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

    def ingest(self, text: str, metadata: dict) -> None:
        chunks = self.splitter.split_text(text)
        embeddings = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=chunks,
        ).data

        points = [
            PointStruct(
                id=i,
                vector=item.embedding,
                payload={"text": chunk, **metadata},
            )
            for i, (chunk, item) in enumerate(zip(chunks, embeddings))
        ]

        self.qdrant.upsert(collection_name="documents", points=points)

    def answer(self, question: str, top_k: int = 5) -> str:
        query_vector = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=[question],
        ).data[0].embedding

        results = self.qdrant.search(
            collection_name="documents",
            query_vector=query_vector,
            limit=top_k,
        )

        context = "\n\n".join(
            f"[{i}] {result.payload['text']}"
            for i, result in enumerate(results, start=1)
        )

        response = self.openai.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Answer only from the provided context. "
                        "Cite sources as [1], [2], etc. "
                        "If the answer is not supported by the context, say so."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question}",
                },
            ],
        )

        return response.choices[0].message.content
```

This is a good baseline, not the final architecture. Add filters, reranking, caching, and evaluation once you can point to a measured problem.

## Resources

- Qdrant docs: <https://qdrant.tech/documentation/>
- Pinecone docs: <https://docs.pinecone.io/>
- OpenAI embeddings guide: <https://platform.openai.com/docs/guides/embeddings>
- LangChain RAG docs: <https://python.langchain.com/docs/use_cases/question_answering/>
- Sentence Transformers: <https://www.sbert.net/>
