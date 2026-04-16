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
