CREATE TABLE `osFieldAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`osId` int NOT NULL,
	`tenantId` int NOT NULL,
	`campo` varchar(100) NOT NULL,
	`valorAnterior` text,
	`valorNovo` text,
	`userId` int,
	`userName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osFieldAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `osPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`osId` int NOT NULL,
	`tenantId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`tipo` enum('entrada','saida','laudo') NOT NULL DEFAULT 'entrada',
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clientes` ADD `origemCliente` enum('indicacao','google','redes_sociais','passante','outro');--> statement-breakpoint
ALTER TABLE `clientes` ADD `preferenciaContato` enum('whatsapp','email','ligacao');--> statement-breakpoint
ALTER TABLE `clientes` ADD `horarioPreferidoContato` varchar(50);--> statement-breakpoint
ALTER TABLE `clientes` ADD `classificacao` enum('padrao','vip','recorrente','inadimplente') DEFAULT 'padrao' NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `observacoesInternas` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `aceitouTermos` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `aceitouTermosAt` timestamp;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `laudoTecnico` text;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `numeroLacre` varchar(50);--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `semSolucaoPossivel` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `justificativaSemSolucao` text;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `assinaturaClienteUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `statusOrcamento` enum('pendente','aprovado','reprovado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `motivoReprovacao` text;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `descontoValor` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `prazoEstimadoConclusao` timestamp;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `validadeOrcamento` timestamp;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `clientToken` varchar(36);--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `clientTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `ordensServico` ADD `clientObservacoes` text;--> statement-breakpoint
ALTER TABLE `osItens` ADD `descricaoTecnica` text;--> statement-breakpoint
ALTER TABLE `osItens` ADD `valorCusto` decimal(10,2);