CREATE TABLE `stripeEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(100) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripeEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripeEvents_eventId_unique` UNIQUE(`eventId`)
);
