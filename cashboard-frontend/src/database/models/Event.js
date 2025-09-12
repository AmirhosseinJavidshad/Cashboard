import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Event extends Model {
  static table = 'events';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('title') title;
  @field('date') date; // timestamp
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('user') user;
  @field('synced') synced;
}
