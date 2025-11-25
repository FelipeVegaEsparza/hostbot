# Knowledge Module

This module implements the knowledge base functionality for the chatbot system, allowing customers to create and manage knowledge bases that chatbots can use to provide contextual responses.

## Features

- **Knowledge Base Management**: Create, read, update, and delete knowledge bases
- **Knowledge Item Management**: Add, edit, and remove items within knowledge bases
- **Full-Text Search**: Search knowledge items using MySQL full-text search
- **Chatbot Integration**: Associate knowledge bases with chatbots for contextual AI responses
- **Customer Isolation**: All operations are scoped to the authenticated customer

## Architecture

### Components

- **KnowledgeModule**: NestJS module that registers the service and controller
- **KnowledgeService**: Business logic for knowledge base and item operations
- **KnowledgeController**: REST API endpoints for knowledge management
- **DTOs**: Data transfer objects for validation and documentation

### Database Models

- **KnowledgeBase**: Container for knowledge items
  - `id`: UUID
  - `customerId`: Foreign key to Customer
  - `name`: Name of the knowledge base
  - `description`: Optional description
  - `createdAt`, `updatedAt`: Timestamps

- **KnowledgeItem**: Individual knowledge entries
  - `id`: UUID
  - `knowledgeBaseId`: Foreign key to KnowledgeBase
  - `title`: Title of the item
  - `content`: Full content (supports full-text search)
  - `metadata`: JSON field for additional data
  - `createdAt`, `updatedAt`: Timestamps

## API Endpoints

### Knowledge Bases

- `POST /knowledge/bases` - Create a new knowledge base
- `GET /knowledge/bases` - List all knowledge bases for the customer
- `GET /knowledge/bases/:id` - Get a specific knowledge base with items
- `PATCH /knowledge/bases/:id` - Update a knowledge base
- `DELETE /knowledge/bases/:id` - Delete a knowledge base (only if not associated with chatbots)

### Knowledge Items

- `POST /knowledge/items` - Create a new knowledge item
- `GET /knowledge/bases/:knowledgeBaseId/items` - List all items in a knowledge base
- `GET /knowledge/items/:id` - Get a specific knowledge item
- `PATCH /knowledge/items/:id` - Update a knowledge item
- `DELETE /knowledge/items/:id` - Delete a knowledge item

### Search

- `GET /knowledge/bases/:knowledgeBaseId/search?query=...&limit=10` - Search items using full-text search

## Integration with AI Processing

The knowledge module integrates with the AI processing pipeline through the `AIProcessingProcessor`:

1. When a message is processed, the processor checks if the chatbot has an associated knowledge base
2. If present, it calls `KnowledgeService.getKnowledgeContext()` to retrieve relevant knowledge items
3. The knowledge context is added to the AI prompt, allowing the chatbot to provide informed responses

### Full-Text Search

The module uses MySQL's full-text search capabilities for efficient knowledge retrieval:

```sql
-- Full-text index on title and content columns
@@fulltext([title, content])
```

The search uses `MATCH...AGAINST` in natural language mode for relevance-based ranking. If full-text search is not available, it falls back to `LIKE` queries.

## Usage Example

### Creating a Knowledge Base

```typescript
POST /knowledge/bases
{
  "name": "Product Documentation",
  "description": "All product-related documentation"
}
```

### Adding Knowledge Items

```typescript
POST /knowledge/items
{
  "knowledgeBaseId": "uuid-here",
  "title": "How to reset password",
  "content": "To reset your password, go to the login page and click 'Forgot Password'...",
  "metadata": {
    "category": "authentication",
    "tags": ["password", "security"]
  }
}
```

### Searching Knowledge

```typescript
GET /knowledge/bases/:id/search?query=password%20reset&limit=5
```

### Associating with Chatbot

```typescript
PATCH /chatbots/:id
{
  "knowledgeBaseId": "uuid-here"
}
```

## Security

- All endpoints require JWT authentication via `JwtAuthGuard`
- Customer isolation is enforced at the service level
- Knowledge bases can only be deleted if not associated with any chatbots
- All queries verify ownership before performing operations

## Requirements Satisfied

This module satisfies the following requirements from the specification:

- **9.1**: Create multiple knowledge bases per customer
- **9.2**: Store knowledge items with title, content, and metadata
- **9.3**: Search information in knowledge base during query processing
- **9.4**: Support full-text search in knowledge items
- **9.5**: Associate knowledge bases with chatbots

## Future Enhancements

- Vector embeddings for semantic search
- Document upload and parsing (PDF, DOCX, etc.)
- Knowledge base versioning
- Import/export functionality
- Analytics on knowledge item usage
