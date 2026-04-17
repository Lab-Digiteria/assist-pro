# Assist-Pró — TODO

## Estrutura SaaS Base
- [x] Schema do banco de dados completo (tenants, users, equipamentos, OS, estoque, financeiro)
- [x] Multi-tenancy: tabela tenants com isolamento por tenant_id
- [x] Onboarding de novos tenants (cadastro com CPF/CNPJ e WhatsApp obrigatórios)
- [x] Painel admin de tenants (listar, ativar, suspender, ver plano)
- [x] Leads e campanhas de e-mail (captação, status, envio)
- [x] Roles: admin (dono do SaaS), manager (gestor do tenant), technician (técnico), viewer

## Billing com Stripe
- [x] Integração Stripe (checkout, portal, webhooks)
- [x] Plano Mensal: R$ 99/mês com trial 14 dias
- [x] Plano Anual: R$ 799/ano com trial 14 dias
- [x] Plano Vitalício: R$ 1.499 cobrança única
- [x] Estados de assinatura: trial, active, past_due, suspended, canceled, expired
- [x] Job de reconciliação Stripe (stripe-reconcile.ts)
- [x] Webhook handler com validação de assinatura e idempotência

## Módulo de Clientes
- [x] Cadastro PF e PJ (nome/razão social, CPF/CNPJ, endereço, WhatsApp, e-mail)
- [x] Validação real de CPF e CNPJ (shared/utils.ts)
- [x] Busca e listagem de clientes por tenant

## Módulo de Equipamentos
- [x] Entidade Equipment com campos: categoria, numeroSerie, IMEI, capacidade, cor, marca, modelo, cliente vinculado
- [x] IMEI obrigatório para smartphone e tablet (validação 15 dígitos)
- [x] Busca e listagem de equipamentos por tenant

## Módulo de Ordens de Serviço
- [x] Numeração automática OS-YYYY-NNNN isolada por tenant
- [x] Fluxo de status: recebido → em_diagnostico → aguardando_aprovacao → em_reparo → concluido → pronto_aguardando_retirada → encerrado
- [x] Status especiais: cancelado, devolvido_sem_reparo
- [x] Campos: prazoOrcamento, senhaDesbloqueio, descricaoProblema, valorTotal, valorPago
- [x] Alerta visual quando prazoOrcamento vencido
- [x] Itens de serviço e peças com recálculo de valor total
- [x] Lançamentos financeiros (sinal, antecipação, pagamento final, estorno)
- [x] Histórico de mudanças de status
- [x] dataNotificacaoCliente preenchida automaticamente ao ir para pronto_aguardando_retirada
- [x] senhaDesbloqueio apagada automaticamente ao encerrar OS
- [x] dataFimGarantia calculada automaticamente (padrão 90 dias) ao encerrar

## Checklist de Entrada na OS
- [x] Bloco Estado Físico (11 itens)
- [x] Bloco Sintomas (9 itens)
- [x] Campos extras: senhaDesbloqueio, acessoriosEntregues
- [x] Checklist salvo como JSON na OS

## Módulo Financeiro
- [x] Lançamentos financeiros na OS (sinal, antecipação, pagamento final, estorno)
- [x] Formas de pagamento: dinheiro, pix, cartao_debito, cartao_credito, faturamento_direto

## Módulo Caixa
- [x] Espelho automático de todos os lançamentos da OS
- [x] Lançamentos manuais
- [x] Resumo de entradas, saídas e saldo

## Comissões de Técnicos
- [x] Percentual configurável por técnico e por categoria de equipamento
- [x] Cálculo automático ao transitar OS para status concluido
- [x] Configuração via tela de Configurações

## Módulo de Estoque
- [x] Movimentações: entrada, saída, ajuste, devolução
- [x] Alerta de estoque mínimo
- [x] Categorias: tela, bateria, conector, cabo, placa, chip, acessório, outro
- [x] Código auto-gerado PÇ-NNNNNN
- [x] Preço de custo visível apenas para admin/manager
- [x] Saída automática ao concluir OS (via updateOrdemServicoStatus)

## Dashboard
- [x] Bloco alertas críticos: OS com prazo vencido, OS aguardando retirada, peças abaixo do mínimo
- [x] Bloco OS por status (contagem)
- [x] Bloco financeiro: faturamento hoje, faturamento do mês, breakdown por forma de pagamento
- [x] Bloco performance: total OS abertas

## Relatórios
- [x] OS por status (gráfico de barras + exportação CSV)
- [x] Faturamento por forma de pagamento (gráfico de pizza + exportação CSV)
- [x] Listagem completa de OS com exportação CSV

## Landing Page
- [x] Header fixo com logo, navegação e botões Entrar / Começar grátis
- [x] Seção Hero com headline, subheadline e CTA
- [x] Seção Problema (3 cards)
- [x] Seção Funcionalidades (6 cards)
- [x] Seção Preços (3 cards com badge "Mais popular" no Anual)
- [x] Seção FAQ (5 perguntas com accordion)
- [x] Seção CTA final com formulário de lead
- [x] Footer com logo, Termos, Privacidade e copyright
- [x] Paleta: azul #1B4F8A, canela #C4733A, cinza #6B7280, amarelo #E8C547, branco #FFFFFF

## SaaS_Core — Migração do OficinaPro

- [x] Schema: tabela plans com priceMonthly, trialDays, stripePriceId
- [x] Schema: tabela subscriptions com status (trialing/active/past_due/suspended/canceled/expired), trialEndsAt, stripeSubscriptionId
- [x] Schema: tabela leads com campos corretos (phone, companyName, document, source, userId, tenantId, status)
- [x] Schema: tabela billingEvents para event sourcing
- [x] Schema: tabela userPasswords para auth própria
- [x] Schema: tabela stripeEvents para idempotência
- [x] Backend: router lead.register (publicProcedure) — cria user+tenant+subscription(trialing)+lead em transação atômica
- [x] Backend: JWT próprio para tenants (não depende de Manus OAuth)
- [x] Backend: router lead.login — autenticação por email+senha
- [x] Backend: router subscriptions.mySubscription — retorna status + trialDaysLeft
- [x] Backend: router subscriptions.listPlans — lista planos disponíveis
- [x] Backend: Stripe Checkout com price_data inline (sem Price IDs fixos)
- [x] Backend: Webhook Stripe — ativa subscription ao receber checkout.session.completed
- [x] Backend: Idempotência real no webhook (tabela stripeEvents)
- [x] Backend: Admin extendTrial, adminSuspend, adminReactivate
- [x] Frontend: Formulário de cadastro de trial na landing page (nome, empresa, CPF/CNPJ, WhatsApp, email, senha)
- [x] Frontend: Tela de Login (/login) com email e senha
- [x] Frontend: TrialBanner — exibe dias restantes do trial no topo do sistema
- [x] Frontend: SubscriptionGuard — tela de bloqueio para status inválidos
- [x] Frontend: Admin — gestão completa de tenants com extendTrial, suspend, reactivate e leads
- [x] Seed dos 3 planos no banco (Mensal R$99, Anual R$799, Vitalício R$1.499)

## Control Plane (/admin) — Separado da área do tenant

- [x] Layout AdminControlPlane com sidebar própria e identidade visual distinta (tema escuro, logo "Control Plane")
- [x] Dashboard: Tenants Ativos, Endpoints S2S, Eventos de Auditoria, Webhooks, Estados de Assinatura, Atividade Recente
- [x] Módulo Assinantes: listagem com status, plano, trial restante, ações (extend, suspend, reactivate, delete)
- [x] Módulo Planos: CRUD de planos com preços e trial days
- [x] Módulo Assinaturas: listagem de todas as subscriptions com filtros por status
- [x] Módulo Billing: eventos de cobrança, reconciliação Stripe
- [x] Módulo Audit Logs: trilha de auditoria de todas as ações críticas
- [x] Módulo Webhooks: listagem de eventos Stripe processados
- [x] Módulo Leads: funil de leads com status e conversão
- [x] Módulo Comunicação: envio de mensagens customizadas para tenants
- [x] Módulo Monitoramento Trials: trials próximos de expirar, alertas
- [x] Módulo Campanhas Email: criação e envio de campanhas de reengajamento
- [x] Módulo Roteiro do Sistema: documentação interna do produto
- [x] Isolamento total: /admin não aparece na navegação do tenant
- [x] Guard de admin: apenas usuário com role=admin acessa /admin

## Impersonation (Control Plane)

- [x] Backend: endpoint adminImpersonate gera JWT temporário (1h) com flag isImpersonating=true e tenantId do alvo
- [x] Backend: logAudit registra admin.impersonate com adminId e tenantId alvo
- [x] Backend: endpoint exitImpersonation para limpar token de impersonation
- [x] Frontend: botão "Acessar como Tenant" no AdminTenants
- [x] Frontend: banner laranja "Modo Impersonation" fixo no topo com botão "Sair"
- [x] Frontend: ao sair da impersonation, retornar para /admin

## Redesign Landing Page — Tema Escuro Premium (ref: OficinaPro)

- [x] Fundo escuro #0a0a0a em toda a página (não branco)
- [x] Headline com peso 800-900, tamanho mínimo 4rem no desktop
- [x] Cards de funcionalidades escuros (bg #141414, border white/10)
- [x] Seção "Veja como funciona" com mockups/screenshots do app
- [x] Seção "Como funciona em 3 passos" (cadastro → acesso → uso)
- [x] Seção depoimentos com 3 clientes fictícios realistas
- [x] Manter conteúdo (textos, planos, FAQ) — mudar apenas visual

## Funcionalidade 1 — Cadastro de Clientes Inteligente

- [x] Schema: adicionar origemCliente (enum), preferenciaContato (enum), horarioPreferidoContato (varchar), classificacao (enum), observacoesInternas (text), aceitouTermos (boolean), aceitouTermosAt (timestamp) à tabela clientes
- [x] Backend: atualizar clientes.create e clientes.update para aceitar novos campos
- [x] Backend: lógica automática de classificação inadimplente (cliente com OS encerrada com saldo devedor)
- [x] Frontend: formulário de cliente com novos campos (origem, preferência contato, horário, classificação, observações internas, aceite de termos)
- [x] Frontend: badge de classificação (VIP, Recorrente, Inadimplente) na listagem e detalhe do cliente
- [x] Frontend: histórico de equipamentos atendidos na tela de detalhe do cliente

## Funcionalidade 2 — OS com Camada de Segurança

- [x] Schema: adicionar laudoTecnico (text), numeroLacre (varchar), semSolucaoPossivel (boolean), justificativaSemSolucao (text), assinaturaClienteUrl (varchar), statusOrcamento (enum), motivoReprovacao (text), descontoValor (decimal), prazoEstimadoConclusao (timestamp), validadeOrcamento (timestamp) à tabela ordensServico
- [x] Schema: criar tabela osPhotos (id, osId, tenantId, url, tipo enum entrada/saida, uploadedBy, createdAt)
- [x] Schema: criar tabela osFieldAudit (id, osId, tenantId, campo, valorAnterior, valorNovo, userId, createdAt)
- [x] Backend: endpoint upload de fotos da OS (storagePut + insert em osPhotos)
- [x] Backend: auditoria automática de campos ao atualizar OS (registrar em osFieldAudit)
- [x] Backend: endpoint para buscar fotos da OS
- [x] Frontend: bloco de upload de fotos na tela de OS (câmera/arquivo, preview, delete)
- [x] Frontend: campo de laudo técnico separado do descricaoProblema na OS
- [x] Frontend: campo de número de lacre na OS
- [x] Frontend: flag "Sem solução possível" com campo de justificativa obrigatória
- [x] Frontend: componente de assinatura digital (canvas) na OS com botão "Limpar" e "Salvar"
- [x] Frontend: timeline de auditoria de campos na OS (quem alterou o quê e quando)

## Funcionalidade 5 — Área do Cliente por Link com Token

- [x] Schema: adicionar clientToken (varchar 36), clientTokenExpiresAt (timestamp), clientObservacoes (text) à tabela ordensServico
- [x] Backend: gerar clientToken UUID v4 ao criar OS (auto)
- [x] Backend: publicProcedure os.getByClientToken — retorna dados seguros da OS (sem observacoesInternas, valorCusto, senhaDesbloqueio)
- [x] Backend: publicProcedure os.clientApproveQuote — aprova orçamento via token
- [x] Backend: publicProcedure os.clientRejectQuote — reprova orçamento via token (motivo obrigatório)
- [x] Backend: publicProcedure os.clientAddObservation — cliente insere informação adicional via token
- [x] Backend: notifyOwner ao receber aprovação ou reprovação do cliente
- [x] Frontend: rota pública /cliente/os/:token sem autenticação
- [x] Frontend: página área do cliente com linha do tempo visual de status
- [x] Frontend: exibir fotos de entrada na área do cliente
- [x] Frontend: exibir laudo técnico na área do cliente
- [x] Frontend: exibir orçamento detalhado (sem valor de custo) com botões Aprovar/Reprovar
- [x] Frontend: campo de observações adicionais do cliente (ex: "a senha é 1234")
- [x] Frontend: botão "Copiar link do cliente" na tela da OS (para o gestor enviar manualmente)
- [x] Frontend: exibir clientToken como QR code na tela da OS (opcional, para impressão)

## Bug Crítico — SelectItem value vazio

- [x] Corrigir todos os `<SelectItem value="">` nas telas OrdensServico.tsx e OrdemServicoDetalhe.tsx

## Segurança Crítica — Painel Admin exposto a tenants

- [x] Remover link "Painel Admin" do menu de navegação de tenants (AppLayout/DashboardLayout)
- [x] Verificar e reforçar AdminGuard para redirecionar tenants para /dashboard
- [x] Verificar todos os endpoints tRPC de admin (adminProcedure) e confirmar proteção

## Bug Crítico — SelectItem value vazio em OS

- [x] Corrigir Select com value="0" (clienteId/equipamentoId) em OrdensServico.tsx
- [x] Corrigir Select com value="" (nextStatus) em OrdemServicoDetalhe.tsx

## Integração Resend — E-mail Transacional

- [x] Configurar secret RESEND_API_KEY
- [x] Instalar dependência `resend`
- [x] Criar helper `server/email.ts` com função `sendEmail` e templates HTML
- [x] Template: e-mail de boas-vindas ao cadastrar trial
- [x] Template: alerta 3 dias antes do trial expirar
- [x] Template: confirmação de pagamento após upgrade
- [x] Disparar boas-vindas no endpoint `lead.register`
- [x] Disparar alerta de trial no job cron diário
- [x] Disparar confirmação de pagamento no webhook `checkout.session.completed`

## Segurança Crítica — Isolamento Total do Painel Admin

- [x] Remover link "Painel Admin" do sidebar do tenant (AppLayout/DashboardLayout)
- [x] Criar SuperAdminGuard: bloqueia acesso a /super-admin para qualquer usuário sem isPlatformAdmin
- [x] Criar SuperAdminLayout: layout isolado com identidade visual distinta, sem conexão com o layout do tenant
- [x] Migrar todas as rotas /admin/* para /super-admin/* no App.tsx
- [x] Atualizar todos os links internos do Control Plane para /super-admin
- [x] Garantir que tenant com role=admin não acessa /super-admin (apenas isPlatformAdmin=true)
- [x] Verificar que nenhuma rota do tenant linka para /super-admin

## Área de Revendas

- [x] Schema: tabela `revendedores` (id, nome, email, whatsapp, cidade, estado, atuacao, mensagem, status enum draft/ativo/inativo, createdAt)
- [x] Migration gerada e aplicada
- [x] Backend: publicProcedure `revendedores.register` (cadastro público sem auth)
- [x] Backend: adminProcedure `revendedores.list` (listar todos com filtro de status)
- [x] Backend: adminProcedure `revendedores.updateStatus` (ativar/inativar revendedor)
- [x] Backend: notifyOwner ao receber novo cadastro de revendedor
- [x] Backend: e-mail de confirmação ao revendedor após cadastro
- [x] Landing page: seção "Seja um Revendedor" com proposta de valor (3 benefícios) e formulário
- [x] Landing page: âncora `#revendedores` para navegação direta
- [x] Super Admin: página `/super-admin/revendedores` com tabela de leads e ações de status
- [x] Super Admin: link "Revendedores" no menu do CoreLayout

## Dashboard do Revendedor

- [x] Schema: adicionar campo `referralCode` (varchar 12, único) e `referralPassword` (varchar, hash) na tabela `revendedores`
- [x] Schema: criar tabela `referralConversions` (id, revendedorId, tenantId, status, planName, planValue, commissionRate, commissionValue, createdAt)
- [x] Schema: criar tabela `revendedorCommissions` (id, revendedorId, periodoMes, periodoAno, totalConversions, totalValue, status, paidAt, observacoes)
- [x] Migration gerada e aplicada
- [x] Backend: gerar referralCode único ao ativar revendedor
- [x] Backend: endpoint público revendedor.login (email + senha)
- [x] Backend: endpoint revendedor.me (dados do revendedor autenticado)
- [x] Backend: endpoint revendedor.dashboard (KPIs: cliques, conversões, comissão pendente, comissão total)
- [x] Backend: endpoint revendedor.conversions (lista de conversões com status)
- [x] Backend: endpoint revendedor.commissions (lista de comissões por mês)
- [x] Backend: endpoint admin.setRevendedorPassword (Super Admin define senha inicial)
- [x] Backend: endpoint admin.approveCommission (Super Admin marca comissão como paga)
- [x] Backend: capturar parâmetro `?ref=` no registro de trial e salvar referralCode no tenant
- [x] Backend: ao confirmar pagamento Stripe, criar referralConversion e revendedorCommission
- [x] Frontend: rota pública /revendedor/login
- [x] Frontend: rota protegida /revendedor/dashboard com RevendedorGuard
- [x] Frontend: dashboard com KPIs (cliques, conversões, comissão pendente, comissão total)
- [x] Frontend: card com link de indicação único + botão copiar + QR code
- [x] Frontend: tabela de conversões com status (Pendente/Confirmado/Cancelado)
- [x] Frontend: tabela de comissões por mês com status (Pendente/Pago)
- [x] Frontend: landing page captura `?ref=` e salva em localStorage
- [x] Super Admin: coluna referralCode na página AdminRevendedores
- [x] Super Admin: botão "Definir senha" para ativar acesso do revendedor
- [x] Super Admin: página de comissões com aprovação de pagamento

## Melhorias Pendentes — Alta Prioridade

- [x] Segurança: hash da senha de desbloqueio da OS (atualmente em texto plano no banco)
- [x] Rate limiting no login (proteção brute force — máx. 5 tentativas/min por IP)
- [x] Relatórios avançados: gráfico de faturamento por mês (últimos 12 meses)
- [x] Relatórios avançados: ranking de técnicos por OS concluídas e faturamento
- [x] Notificação ao cliente por e-mail quando OS muda para "Pronto para retirada"
- [x] Import OFX/CSV: upload, parse, tela de revisão com categorização e detecção de duplicatas

## Módulo de Estoque — Evolução Estrutural

### 1. Modelos de Equipamentos
- [x] Schema: tabela `equipmentModels` (id, tenantId, brand, modelName, category, createdAt)
- [x] Migration gerada e aplicada
- [x] Backend: CRUD completo em `server/routers/equipmentModels.ts` (list, create, update, delete)
- [x] Registrar router `equipmentModels` em `server/routers.ts`
- [x] Frontend: página `Configuracoes/ModelosEquipamentos.tsx` com listagem, criação, edição e exclusão
- [x] Rota `/configuracoes/modelos-equipamentos` em `App.tsx`
- [x] Link em Configurações no sidebar do `AppLayout.tsx`
- [x] Testes em `server/equipmentModels.test.ts`

### 2. Part Number, Fabricante e Compatibilidade
- [x] Schema: adicionar campos `partNumber`, `manufacturer`, `application` na tabela `pecas`
- [x] Schema: tabela de junção `pecaModeloCompativel` (id, pecaId, equipmentModelId)
- [x] Migration gerada e aplicada
- [x] Backend: atualizar `estoque.create` e `estoque.update` para aceitar novos campos e `compatibleModelIds`
- [x] Backend: endpoint `estoque.listModels` para buscar modelos do tenant (usado no multi-select)
- [x] Backend: ao salvar peça, sincronizar tabela `pecaModeloCompativel`
- [x] Frontend: adicionar campos Part Number, Fabricante, Aplicação no formulário de peças
- [x] Frontend: multi-select de Modelos Compatíveis no formulário de peças
- [x] Frontend: exibir `partNumber` na listagem de estoque
- [x] Frontend: filtro por Modelo Compatível na listagem de estoque

### 3. Lista de Compras
- [x] Schema: tabela `listaCompras` (id, tenantId, pecaId?, itemDescription, quantityNeeded, reason, osId?, priority, status, notes, createdAt, updatedAt)
- [x] Migration gerada e aplicada
- [x] Backend: CRUD em `server/routers/listaCompras.ts` (list, create, update, markOrdered, markReceived)
- [x] Backend: `markReceived` com opção de entrada automática no estoque (movimentarEstoque)
- [x] Registrar router `listaCompras` em `server/routers.ts`
- [x] Frontend: página `Estoque/ListaCompras.tsx` com listagem filtrada por status/prioridade
- [x] Frontend: formulário de adição rápida com busca de peça existente ou descrição livre
- [x] Frontend: ações "Pedido Realizado" e "Recebido" com modal de entrada no estoque
- [x] Rota `/estoque/lista-compras` em `App.tsx`
- [x] Link "Lista de Compras" no submenu de Estoque no `AppLayout.tsx`
- [x] Testes em `server/listaCompras.test.ts` (5 testes passando)

## Bug — Perda de foco no formulário de Novo Cliente

- [x] Corrigir perda de foco (cursor some a cada letra) no modal de cadastro de clientes — causa: componente de formulário/tab definido dentro do render do pai, causando remontagem a cada keystroke

## Módulo Financeiro Completo

### Schema e Banco
- [x] Tabela `chartOfAccounts` (plano de contas: id, tenantId, code, name, type receita/custo/despesa, parentId, isActive)
- [x] Tabela `bankAccounts` (contas bancárias: id, tenantId, name, type, bankName, agency, accountNumber, initialBalance, currentBalance, isActive)
- [x] Tabela `receivables` (contas a receber: id, tenantId, description, amount, dueDate, receivedDate, status, paymentMethod, bankAccountId, chartOfAccountId, serviceOrderId, customerId, installments, notes)
- [x] Tabela `payables` (contas a pagar: id, tenantId, description, amount, dueDate, paidDate, status, paymentMethod, bankAccountId, chartOfAccountId, supplierName, documentNumber, isRecurring, recurrenceConfig, notes)
- [x] Migration gerada e aplicada

### Backend
- [x] Seed automático do plano de contas ao criar novo tenant (função seedChartOfAccounts)
- [x] Router `financeiroV2.chartOfAccounts` (list, create, update, toggle ativo)
- [x] Router `financeiroV2.bankAccounts` (list, create, update, transfer entre contas)
- [x] Router `financeiroV2.receivables` (list com filtros, create, update, baixar pagamento)
- [x] Router `financeiroV2.payables` (list com filtros, create, update, marcar pago, gerar próxima recorrência)
- [x] Router `financeiroV2.cashFlow` (fluxo de caixa por período com saldo acumulado)
- [x] Router `financeiroV2.dre` (DRE por período com comparativo)
- [x] Router `financeiroV2.dashboardFinanceiro` (KPIs: saldo total, a receber 30d, a pagar 30d, resultado mês, gráfico 6 meses)
- [x] Recorrência: ao pagar payable com isRecurring=true, gerar próximo lançamento

### Frontend
- [x] Rota `/financeiro` → Dashboard Financeiro (visão geral com KPIs e gráfico)
- [x] Rota `/financeiro/contas-bancarias` → Gestão de contas com saldo e transferências
- [x] Rota `/financeiro/contas-receber` → Listagem com filtros e baixa de pagamento
- [x] Rota `/financeiro/contas-pagar` → Listagem com filtros, marcar pago, criar recorrência
- [x] Rota `/financeiro/fluxo-caixa` → Tabela com saldo acumulado, filtros, gráfico de área
- [x] Rota `/financeiro/dre` → DRE com comparativo e exportar CSV
- [x] Rota `/financeiro/plano-contas` → CRUD do plano de contas com seed automático
- [x] Link "Financeiro" no menu lateral (AppLayout) com submenu colapsável
- [x] Import OFX/CSV: upload, parse, tela de revisão com categorização e detecção de duplicatas

### Testes
- [x] 42 testes passando (6 arquivos)

## Melhorias de Alta Prioridade — Concluídas

- [x] Segurança: hash bcrypt da senha de desbloqueio da OS (antes em texto plano)
- [x] Rate limiting no login: máx. 5 tentativas/min por IP com bloqueio de 15 min (server/_core/rateLimiter.ts)
- [x] Relatórios avançados: gráfico de faturamento por mês (últimos 12 meses) em Relatórios
- [x] Relatórios avançados: ranking de técnicos por OS concluídas e faturamento gerado
- [x] Notificação ao cliente por e-mail quando OS muda para "Pronto para retirada" (template buildOsProntaEmail)
- [x] Import OFX/CSV: rota /financeiro/importar-extrato com parser client-side, revisão e categorização

## Aprovação/Rejeição de Orçamento por E-mail

- [x] Backend: rotas GET públicas `/api/orcamento/aprovar?token=` e `/api/orcamento/rejeitar?token=` no Express
- [x] Backend: rota GET pública `/api/orcamento/info?token=` para buscar dados da OS
- [x] Backend: e-mail HTML de orçamento com botões "Aprovar" e "Rejeitar" (template buildOrcamentoEmail)
- [x] Backend: disparo automático do e-mail ao mudar status para aguardando_aprovacao
- [x] Backend: notifyOwner ao receber aprovação ou rejeição via e-mail
- [x] Backend: endpoint tRPC `os.reenviarEmailOrcamento` para reenvio manual
- [x] Frontend: página pública `/orcamento/confirmacao` com estados aprovado/rejeitado/erro
- [x] Frontend: botão "Enviar orçamento por e-mail" na tela da OS (visível quando status = pendente)
- [x] Testes: 42 testes passando (6 arquivos)

## Integração Nexar API — Busca por Part Number

- [x] Secrets NEXAR_CLIENT_ID e NEXAR_CLIENT_SECRET configurados
- [x] Backend: helper `server/nexar.ts` com autenticação OAuth2 (client_credentials) e cache de token
- [x] Backend: endpoint tRPC `stock.lookupPartNumber` que consulta GraphQL do Nexar e retorna description, manufacturer, specs
- [x] Frontend: campo Part Number com ícone de lupa no formulário de peças (estoque)
- [x] Frontend: ao clicar na lupa ou pressionar Enter, dispara consulta ao Nexar
- [x] Frontend: preenchimento automático de Descrição, Fabricante e Aplicação com toast de sucesso
- [x] Frontend: fallback com toast "não encontrado" quando PN não existe na base
- [x] Frontend: spinner no ícone da lupa durante a busca
- [x] Frontend: campo Part Number com lupa na Lista de Compras também (preenche descrição automaticamente)
- [x] Testes: 4 testes de integração do helper nexar.ts (46 testes passando no total)

## Preço de Referência Nexar no Estoque

- [x] Backend: incluir preço mínimo de distribuidor no retorno do `lookupPartNumber` (campo `referencePrice`)
- [x] Frontend: ao buscar PN, exibe sugestão de preço de custo com badge "via Nexar" e botões Usar/Ignorar
- [x] Testes: 2 novos testes cobrindo referencePrice (com e sem preços disponíveis) — 47 testes passando

## Pesquisa de Part Number no Dashboard

- [x] Backend: query GraphQL expandida com imagens, datasheets, categorias, sellers/offers/prices, inventoryLevel, MOQ, links
- [x] Backend: lookupPartNumber atualizado retorna todos os campos (reutilizado pelo endpoint existente)
- [x] Frontend: página BuscaPeca.tsx com campo de busca e exemplos clicáveis
- [x] Frontend: exibe specs em tabela expansível, preços por distribuidor com estoque/MOQ, imagem, badge datasheet
- [x] Frontend: botão "Adicionar ao Estoque" pré-preenche formulário via sessionStorage
- [x] Frontend: rota /busca-peca registrada no App.tsx
- [x] Frontend: link "Busca Nexar" no sidebar (abaixo de Lista de Compras)
- [x] Testes: 47 testes passando, TypeScript 0 erros

## Correção de Bug — React Error #310 no Dashboard

- [x] Corrigido: `useState(financeiroOpen)` estava sendo chamado após returns condicionais no AppLayout, violando a regra dos hooks do React
- [x] Todos os hooks movidos para antes de qualquer `return` condicional
- [x] Redirects de autenticação e onboarding convertidos para `useEffect` (evita chamadas durante render)
- [x] `financeiroOpen` inicializado como `false` e sincronizado via `useEffect` com a rota ativa

## CORREÇÃO CRÍTICA — Fluxo de OS (4 Problemas)

### Problema 1 — Fluxo de Criação de OS sem troca de tela
- [x] Campo Cliente: busca por nome/CPF/telefone com botão "+ Novo cliente" que abre modal inline (nome, telefone, e-mail)
- [x] Ao salvar modal de novo cliente, cliente já fica selecionado automaticamente na OS
- [x] Campo Equipamento: carrega equipamentos do cliente selecionado; botão "+ Novo equipamento" abre modal inline (tipo, marca, modelo, série, cor)
- [x] Ao salvar modal de novo equipamento, equipamento já fica vinculado à OS

### Problema 2 — Reorganização completa da tela de OS
- [x] Cabeçalho: número OS, data abertura, status com badge, prazo de entrega, botões Imprimir/Avançar Status
- [x] Bloco 1: cards lado a lado — dados do cliente (nome, tel, email, link ficha) e equipamento (tipo, marca, modelo, série, cor, lacre)
- [x] Bloco 2: diagnóstico — problema relatado, laudo técnico, checklist estado físico, senha desbloqueio (mascarada), acessórios
- [x] Bloco 3: tabela de itens (serviço/peça, qtd, valor unitário, subtotal, remover) + totais separados (serviços/peças/geral)
- [x] Bloco 4: pagamentos — histórico, botão "+ Registrar" (modal: tipo, forma, valor, obs), saldo em aberto em vermelho
- [x] Pagamentos parciais e antecipados desde a abertura da OS (sem aprovação prévia)
- [x] Bloco 5: área do cliente — link portal com botões Copiar/Visualizar/Regenerar, enviar orçamento por e-mail
- [x] Bloco 6: abas — assinatura digital (canvas touchscreen) + fotos + histórico de status + auditoria

### Problema 3 — Impressão da OS
- [x] Modal de impressão com duas opções: A4 (laser) e Térmica 58mm (32 colunas)
- [x] Layout A4: dados completos, tabela de serviços/peças, valores, pagamentos, assinatura — window.print com @media print
- [x] Layout Térmica: texto simples monospace, máx 32 chars/linha, dados essenciais, sem imagens
- [x] Ambas as opções acessíveis pelo botão "Imprimir" no cabeçalho da OS

### Problema 4 — Sincronização automática de peças com estoque
- [x] Schema: campo quantidadeReservada adicionado na tabela pecas
- [x] Ao adicionar peça na OS: reservar estoque (bloqueia quantidade sem debitar)
- [x] Ao avançar status para "em_reparo": converter reserva em saída efetiva (débito real)
- [x] Ao cancelar OS ou remover peça: liberar reserva devolvendo quantidade ao estoque disponível
- [x] Modal de adicionar item busca peças do estoque com autocomplete; alerta amarelo se peça não cadastrada
- [x] Todo movimento por OS aparece no histórico do item com referência ao número da OS

## Repaginação Completa da Landing Page

- [x] [1] Header fixo: logo, menu central, botões Entrar/Testar grátis, blur ao scroll
- [x] [2] Hero: headline grande, subtítulo, 2 botões, badge flutuante, formulário de cadastro à direita
- [x] [3] Barra de credibilidade: texto + ícones de categorias de equipamentos
- [x] [4] Funcionalidades: grid 3×2 com cards dark, hover azul, ícones e descrições
- [x] [5] Seção Nexar: 2 colunas — texto com benefícios + demo animada CSS (digitar PN → spinner → card resultado → toast)
- [x] [6] Seção Financeiro: 2 colunas — mockup DRE + texto com grid 2×2 de recursos
- [x] [7] Preços: 3 cards, card central destacado "Mais escolhido", nota de trial
- [x] [8] Depoimentos: 3 cards com estrelas e dados fictícios realistas
- [x] [9] CTA Final: gradiente azul→canela, título grande, botão central
- [x] [10] Footer: logo, links, contato, copyright
- [x] Animações de entrada ao scroll (Intersection Observer)
- [x] Meta tags SEO: title, description, Open Graph, lang pt-BR, canonical
- [x] 100% responsivo mobile-first
- [x] Header com blur ao rolar
- [x] Scroll suave entre seções (âncoras)

## Screenshot Real no Hero da Landing Page

- [x] Screenshot real do dashboard capturada com dados de demonstração (Puppeteer)
- [x] Upload para CDN realizado
- [x] Screenshot exibida no Hero abaixo dos botões CTA com borda e sombra (visível apenas em desktop)

## Correção — Nexar GraphQL campo inválido

- [x] Removido campo `parentCategory` da query GraphQL (não existe no tipo SupCategory)
- [x] Mantidos apenas `id` e `name` dentro do bloco `category`
- [x] Teste do PN `15-11765-01` passando — confirma query sem `parentCategory` e retorno correto de mpn, manufacturer, category e referencePrice

## Indicador de Carregamento — Busca Nexar

- [x] Estoque: spinner na lupa + campo desabilitado (opacity-60) + texto "Consultando Nexar..." com pulse durante a busca
- [x] Lista de Compras: spinner na lupa + campo desabilitado (opacity-60) + texto "Consultando Nexar..." com pulse durante a busca
- [x] Busca de Componentes (/busca-peca): skeleton loader completo (card principal, specs, distribuidores) + spinner no botão + mensagem com PN durante a busca

## Campo SKU no Módulo de Estoque

- [x] Schema: campo `sku` (varchar 50) adicionado na tabela `pecas`
- [x] Migration 0014 gerada e aplicada
- [x] Backend: endpoint `estoque.generateSku` gera código SKU-XXXXXX único por tenant (até 10 tentativas)
- [x] Backend: validação de unicidade do SKU por tenant no `create` e `update` (erro CONFLICT se duplicado)
- [x] Backend: endpoint `estoque.list` aceita `search` filtrando por nome, PN, SKU e código (match exato no topo)
- [x] Frontend: campo SKU com botão Gerar (RefreshCw) no formulário de cadastro/edição
- [x] Frontend: SKU exibido na listagem com ícone Barcode e destaque verde para match exato
- [x] Frontend: campo de busca único aceita SKU, nome, PN; Enter dispara busca imediata (suporte a leitor)
- [x] Frontend: hint de compatibilidade com leitor de código de barras
- [x] 48 testes passando (TypeScript 0 erros)
## Bug — Migration SKU não aplicada no banco de produção

- [x] Causa raiz identificada: índice UNIQUE global em `pecas.codigo` causava conflito entre tenants diferentes
- [x] Schema corrigido: índice composto `(tenantId, codigo)` substitui o UNIQUE global
- [x] Migration 0015 gerada e aplicada no banco
- [x] Validado: tenant 30001 consegue criar peça com código PÇ-000001 sem conflito com tenant 1
- [x] TypeScript 0 erros após a correção

## Módulo de Fornecedores — Cadastro Completo

- [x] Schema: tabela `suppliers` com todos os campos de identificação, contato, endereço e dados comerciais
- [x] Schema: tabela `supplierBankAccounts` para múltiplas contas bancárias por fornecedor
- [x] Schema: tabela `supplierDocuments` para upload de arquivos vinculados
- [x] Migration gerada e aplicada
- [x] Backend: CRUD completo de fornecedores (list, getById, create, update, delete, toggleActive)
- [x] Backend: CRUD de contas bancárias (add, update, remove)
- [x] Backend: upload de documentos para S3 (presigned URL + save metadata)
- [x] Backend: busca CEP via ViaCEP integrada no frontend
- [x] Frontend: listagem com busca, filtros (ativo/inativo, preferencial, categoria), badge preferencial
- [x] Frontend: formulário wizard multi-seção (Identificação, Contato, Endereço, Comercial, Produtos, Avaliação)
- [x] Frontend: busca automática de CEP via ViaCEP ao preencher zip_code
- [x] Frontend: validação CNPJ e CPF com máscara
- [x] Frontend: multi-select de categorias e marcas
- [x] Frontend: avaliação por estrelas (1-5) com campo de justificativa
- [x] Frontend: upload de documentos com nome, tipo e data
- [x] Frontend: página de detalhe com abas (Dados, Bancário, Documentos)
- [x] Rota /fornecedores e /fornecedores/:id registradas no App.tsx
- [x] Link "Fornecedores" no sidebar
- [x] 48 testes passando (7 arquivos)

## Vínculo de Fornecedor nas OS e Lista de Compras

- [x] Schema: campo `supplierId` (FK → suppliers) na tabela `osItens`
- [x] Schema: campo `supplierId` (FK → suppliers) na tabela `listaCompras`
- [x] Migration gerada e aplicada
- [x] Router OS: aceitar supplierId no addItem, retornar supplierName via left join
- [x] Router Lista de Compras: aceitar supplierId no create/update, retornar supplierName via left join
- [x] Frontend OS: selector de fornecedor no modal de adicionar peça/serviço
- [x] Frontend Lista de Compras: selector de fornecedor no formulário de novo item
- [x] Exibir nome do fornecedor na listagem de itens da OS e na Lista de Compras

## Cadastro da Empresa, Técnicos e Impressão Profissional de OS

- [x] Schema: tabela `companySettings` com identidade, contato, endereço e identidade visual
- [x] Schema: tabela `employees` com dados pessoais, profissionais e comissão
- [x] Schema: campo `attendantId` na tabela `ordensServico`
- [x] Migration gerada e aplicada
- [x] Backend: router `companySettings` (get, update, uploadLogo)
- [x] Backend: router `employees` (list, getById, create, update, delete, toggleActive, uploadPhoto)
- [x] Backend: OS atualizada para aceitar `attendantId`
- [x] Frontend: tela Configurações → Minha Empresa com todos os campos + upload de logo + color picker
- [x] Frontend: tela Técnicos/Colaboradores com CRUD completo e multi-select de especialidades
- [x] Frontend: campo Técnico Responsável e Atendente na criação de OS (etapa 3)
- [x] Frontend: card "Equipe Responsável" na página de detalhe da OS
- [x] Frontend: links de acesso em Configurações para Minha Empresa e Técnicos
- [x] Impressão OS: novo template HTML A4 com cabeçalho colorido (primaryColor), logo, dados reais da empresa
- [x] Impressão OS: blocos completos (cliente, equipamento, diagnóstico, itens, pagamentos, técnico, assinatura)
- [x] Impressão OS: termos e garantia configuráveis + rodapé personalizado
- [x] 48 testes passando, 0 erros TypeScript

## Redesign Completo UX/UI — Design System Maduro

- [ ] Tokens CSS globais: paleta, tipografia, espaçamento, bordas e sombras (index.css)
- [ ] Tema escuro GitHub-inspired aplicado em todo o sistema
- [ ] Sidebar redesenhada: 220px, grupos com labels, item ativo com borda esquerda, avatar no rodapé
- [ ] Topbar 48px com breadcrumb e título da página
- [ ] Dashboard reformulado: 4 cards de métricas, gráfico barras 6 meses, tabela OS recentes, alertas
- [ ] Tabelas compactas: linhas 40-48px, header --bg-surface-2, hover sutil, ações visíveis no hover
- [ ] Badges de status padronizados com variantes por cor e borda
- [ ] Botões padronizados com 5 variantes (primário, destaque, secundário, perigo, ghost)
- [ ] Formulários com agrupamento visual e grid responsivo
- [ ] Modais com overlay blur, animação fade+scale, separadores
- [ ] Empty states em todas as listagens com ícone, título e CTA
- [ ] Skeleton loading substituindo spinners de tela cheia

## Redesign Completo UX/UI — Design System Maduro

- [x] Tokens CSS globais: paleta escura GitHub-inspired, variáveis --surface-1/2/3, --text-primary/secondary/muted, --brand-primary
- [x] Tipografia Inter via Google Fonts, font-size base 14px, antialiasing
- [x] AppLayout redesenhado: sidebar 220px com grupos de menu, item ativo com borda esquerda azul, avatar no rodapé
- [x] Dashboard reformulado: 4 cards de métricas, gráfico de barras 6 meses, tabela OS recentes, alertas laterais
- [x] Listagem OS: tabela compacta com status-badge colorido, skeleton loading, empty state
- [x] Listagem Clientes: tabela compacta com avatar, badge de classificação, skeleton loading, empty state
- [x] Listagem Estoque: tabela compacta com indicador de estoque baixo, ações inline, skeleton loading, empty state
- [x] Classes CSS globais: .data-table, .data-table-container, .status-badge (todos os status de OS), .skeleton, .empty-state
- [x] 48 testes passando, 0 erros TypeScript
