CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rate_limits_reset` ON `rate_limits` (`reset_at`);--> statement-breakpoint
ALTER TABLE `owners` ADD `password_iterations` integer DEFAULT 210000 NOT NULL;--> statement-breakpoint
CREATE INDEX `bookings_business_phone` ON `bookings` (`business_id`,`client_phone`);