ALTER TABLE `osItens` ADD `estoqueReservado` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pecas` ADD `quantidadeReservada` int DEFAULT 0 NOT NULL;