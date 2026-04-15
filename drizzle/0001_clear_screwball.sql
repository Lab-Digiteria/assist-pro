CREATE TABLE `caixaLancamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`tipo` enum('entrada','saida') NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`formaPagamento` enum('dinheiro','pix','cartao_debito','cartao_credito','faturamento_direto'),
	`osId` int,
	`osLancamentoId` int,
	`userId` int,
	`manual` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caixaLancamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`tipo` enum('pf','pj') NOT NULL DEFAULT 'pf',
	`nome` varchar(255) NOT NULL,
	`cpfCnpj` varchar(18),
	`inscricaoEstadual` varchar(30),
	`whatsapp` varchar(20),
	`email` varchar(320),
	`cep` varchar(10),
	`logradouro` varchar(255),
	`numero` varchar(20),
	`complemento` varchar(100),
	`bairro` varchar(100),
	`cidade` varchar(100),
	`estado` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comissoesTecnicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`tecnicoId` int NOT NULL,
	`categoria` enum('smartphone','tablet','notebook','desktop','smartwatch','console','tv','outro') NOT NULL,
	`percentual` decimal(5,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comissoesTecnicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`status` enum('draft','scheduled','sent') NOT NULL DEFAULT 'draft',
	`targetSegment` enum('all','trial','churned','converted') DEFAULT 'all',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`clienteId` int NOT NULL,
	`categoria` enum('smartphone','tablet','notebook','desktop','smartwatch','console','tv','outro') NOT NULL,
	`marca` varchar(100) NOT NULL,
	`modelo` varchar(100) NOT NULL,
	`numeroSerie` varchar(100),
	`imei` varchar(15),
	`capacidade` varchar(50),
	`cor` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estoqueMovimentacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`pecaId` int NOT NULL,
	`tipo` enum('entrada','saida','ajuste','devolucao') NOT NULL,
	`quantidade` int NOT NULL,
	`quantidadeAnterior` int NOT NULL,
	`quantidadeNova` int NOT NULL,
	`osId` int,
	`observacao` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estoqueMovimentacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`whatsapp` varchar(20),
	`cpfCnpj` varchar(18),
	`source` varchar(100),
	`status` enum('new','contacted','trial','converted','churned','lost') NOT NULL DEFAULT 'new',
	`tenantId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ordensServico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`numero` varchar(20) NOT NULL,
	`clienteId` int NOT NULL,
	`equipamentoId` int NOT NULL,
	`tecnicoId` int,
	`status` enum('recebido','em_diagnostico','aguardando_aprovacao','em_reparo','concluido','pronto_aguardando_retirada','encerrado','cancelado','devolvido_sem_reparo') NOT NULL DEFAULT 'recebido',
	`prazoOrcamento` timestamp,
	`dataNotificacaoCliente` timestamp,
	`tipoEncerramento` enum('com_pagamento_total','com_saldo_devedor','sem_reparo','devolucao'),
	`temGarantia` boolean DEFAULT false,
	`garantiaDias` int DEFAULT 90,
	`dataEncerramento` timestamp,
	`dataFimGarantia` timestamp,
	`comissaoCalculada` decimal(10,2),
	`valorTotal` decimal(10,2) DEFAULT '0',
	`valorPago` decimal(10,2) DEFAULT '0',
	`checklistEstadoFisico` json,
	`checklistSintomas` json,
	`senhaDesbloqueio` varchar(100),
	`acessoriosEntregues` json,
	`descricaoProblema` text,
	`observacoesInternas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordensServico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `osItens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`osId` int NOT NULL,
	`tenantId` int NOT NULL,
	`tipo` enum('servico','peca') NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`pecaId` int,
	`quantidade` int NOT NULL DEFAULT 1,
	`valorUnitario` decimal(10,2) NOT NULL,
	`valorTotal` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osItens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `osLancamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`osId` int NOT NULL,
	`tenantId` int NOT NULL,
	`tipo` enum('sinal','antecipacao','pagamento_final','estorno') NOT NULL,
	`formaPagamento` enum('dinheiro','pix','cartao_debito','cartao_credito','faturamento_direto') NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`observacao` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osLancamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `osStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`osId` int NOT NULL,
	`tenantId` int NOT NULL,
	`statusAnterior` varchar(50),
	`statusNovo` varchar(50) NOT NULL,
	`userId` int,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pecas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`codigo` varchar(20) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` enum('tela','bateria','conector','cabo','placa','chip','acessorio','outro') NOT NULL,
	`precoCusto` decimal(10,2),
	`precoVenda` decimal(10,2) NOT NULL,
	`quantidadeAtual` int NOT NULL DEFAULT 0,
	`quantidadeMinima` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pecas_id` PRIMARY KEY(`id`),
	CONSTRAINT `pecas_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `tenantMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('manager','technician','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenantMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`ownerUserId` int NOT NULL,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`stripePriceId` varchar(100),
	`planType` enum('monthly','annual','lifetime') DEFAULT 'monthly',
	`subscriptionStatus` enum('trial','active','past_due','suspended','canceled','expired') NOT NULL DEFAULT 'trial',
	`trialEndsAt` timestamp,
	`subscriptionEndsAt` timestamp,
	`cpfCnpj` varchar(18),
	`whatsapp` varchar(20),
	`email` varchar(320),
	`osCounter` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_unique` UNIQUE(`slug`)
);
