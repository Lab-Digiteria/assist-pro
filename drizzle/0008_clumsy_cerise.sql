CREATE TABLE `equipmentModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`brand` varchar(100) NOT NULL,
	`modelName` varchar(200) NOT NULL,
	`category` enum('smartphone','notebook','tablet','videogame','desktop','impressora','tv','outro') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `equipmentModels_id` PRIMARY KEY(`id`)
);
