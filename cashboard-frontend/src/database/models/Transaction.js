import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Transaction extends Model {
  static table = 'transactions';

  @field('backend_id') backend_id;
  @field('client_uuid') client_uuid;
  @field('transaction_type') transaction_type;
  @field('category') category;
  @field('amount') amount;
  @field('bank_account') bank_account;
  @field('note') note;
  @field('is_recurring') is_recurring;
  @field('recurrence_period') recurrence_period;
  @field('recurrence_end_date') recurrence_end_date;
  @field('date') date; // timestamp
  @field('deleted_at') deleted_at;
  @field('updated_at') updated_at;
  @field('user') user;
  @field('synced') synced;
}
