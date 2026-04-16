CREATE TABLE `pecaModeloCompativel` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pecaId` int NOT NULL,
	`equipmentModelId` int NOT NULL,
	CONSTRAINT `pecaModeloCompativel_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pecas` ADD `partNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `pecas` ADD `manufacturer` varchar(150);--> statement-breakpoint
ALTER TABLE `pecas` ADD `application` text;