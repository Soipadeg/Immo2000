import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'listings',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'location', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'bedrooms', type: 'number' },
        { name: 'bathrooms', type: 'number' },
        { name: 'area', type: 'number' },
        { name: 'synced_at', type: 'number' },
        { name: 'is_local', type: 'boolean', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'conversation_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'sender_id', type: 'string' },
        { name: 'is_pending', type: 'boolean', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'pending_requests',
      columns: [
        { name: 'method', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'data', type: 'string' }, // JSON stringified
        { name: 'retry_count', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cached_data',
      columns: [
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' }, // JSON stringified
        { name: 'expires_at', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
