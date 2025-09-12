import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'backend_id', type: 'number', isOptional: true },
        { name: 'client_uuid', type: 'string', isOptional: true },
        { name: 'transaction_type', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'bank_account', type: 'string', isOptional: true },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'is_recurring', type: 'boolean', defaultValue: false },
        { name: 'recurrence_period', type: 'string', isOptional: true },
        { name: 'recurrence_end_date', type: 'number', isOptional: true }, // timestamp
        { name: 'date', type: 'number' }, // timestamp
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'updated_at', type: 'number', isOptional: true },
        { name: 'user', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean', defaultValue: false },
      ],
    }),
    tableSchema({
      name: 'persons',
      columns: [
        { name: 'backend_id', type: 'number', isOptional: true },
        { name: 'client_uuid', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'updated_at', type: 'number', isOptional: true },
        { name: 'user', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean', defaultValue: false },
      ],
    }),
    tableSchema({
      name: 'events',
      columns: [
        { name: 'backend_id', type: 'number', isOptional: true },
        { name: 'client_uuid', type: 'string', isOptional: true },
        { name: 'title', type: 'string' },
        { name: 'date', type: 'number', isOptional: true }, // timestamp
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'updated_at', type: 'number', isOptional: true },
        { name: 'user', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean', defaultValue: false },
      ],
    }),
    tableSchema({
      name: 'wishlist_items',
      columns: [
        { name: 'backend_id', type: 'number', isOptional: true },
        { name: 'client_uuid', type: 'string', isOptional: true },
        { name: 'url', type: 'string' },
        { name: 'title', type: 'string', isOptional: true },
        { name: 'price', type: 'string', isOptional: true }, // backend uses CharField
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'updated_at', type: 'number', isOptional: true },
        { name: 'user', type: 'number', isOptional: true },
        { name: 'synced', type: 'boolean', defaultValue: false },
      ],
    }),
  ],
});