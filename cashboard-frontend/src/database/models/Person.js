import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Person extends Model {
  static table = 'persons';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('name') name;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('user') user;
  @field('synced') synced;
}
