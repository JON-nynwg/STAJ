ALTER TABLE `businesses` ADD `open_time` text DEFAULT '09:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `close_time` text DEFAULT '18:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `working_days` text DEFAULT '1,2,3,4,5,6' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `active` integer DEFAULT 1 NOT NULL;