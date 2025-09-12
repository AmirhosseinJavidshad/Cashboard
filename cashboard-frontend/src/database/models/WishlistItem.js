import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class WishlistItem extends Model {
  static table = 'wishlist_items';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('url') url;
  @field('title') title;
  @field('price') price; // string, as backend uses CharField
  @field('image_url') image_url;
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('user') user;
  @field('synced') synced;
}
