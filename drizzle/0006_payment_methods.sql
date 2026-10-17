CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`business_id` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`number` text NOT NULL,
	`account` text DEFAULT '' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);--> statement-breakpoint
CREATE INDEX `payment_methods_owner` ON `payment_methods` (`kind`,`business_id`);--> statement-breakpoint
ALTER TABLE `bookings` ADD `payment_method` text DEFAULT '' NOT NULL;--> statement-breakpoint
INSERT INTO payment_methods (id,kind,business_id,type,name,number,account,position,created_at) SELECT lower(hex(randomblob(16))),'business',id,payout_type,payout_name,payout_number,payout_account,0,created_at FROM businesses WHERE payout_type<>'';--> statement-breakpoint
INSERT INTO payment_methods (id,kind,business_id,type,name,number,account,position,created_at) SELECT lower(hex(randomblob(16))),'platform','',(SELECT value FROM platform_settings WHERE key='pay_type'),COALESCE((SELECT value FROM platform_settings WHERE key='pay_name'),''),COALESCE((SELECT value FROM platform_settings WHERE key='pay_number'),''),COALESCE((SELECT value FROM platform_settings WHERE key='pay_account'),''),0,strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE EXISTS (SELECT 1 FROM platform_settings WHERE key='pay_type' AND value<>'');
