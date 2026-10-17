ALTER TABLE `businesses` ADD `payout_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `payout_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `payout_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `payout_account` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `total_price` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `deposit_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `commission_rate` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `commission_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `salon_deposit_share` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `balance_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `payment_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `payment_ref` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `deposit_paid_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `payout_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `payout_ref` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `refund_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `refund_ref` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
