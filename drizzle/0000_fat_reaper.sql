CREATE TABLE `practice_order_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('payment_simulated','accepted','preparing','packed','out_for_delivery','delivered','cancelled') NOT NULL,
	`note` text NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practice_order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practice_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`status` enum('payment_simulated','accepted','preparing','packed','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'payment_simulated',
	`subtotal` int NOT NULL,
	`deliveryFee` int NOT NULL,
	`total` int NOT NULL,
	`deliveryAddress` text NOT NULL,
	`lineItems` text NOT NULL,
	`paymentLabel` varchar(120) NOT NULL DEFAULT 'Practice payment — no charge',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `practice_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `practice_orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `practice_order_events` ADD CONSTRAINT `practice_order_events_orderId_practice_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `practice_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practice_orders` ADD CONSTRAINT `practice_orders_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;