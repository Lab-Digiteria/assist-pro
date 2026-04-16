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

- [ ] Corrigir todos os `<SelectItem value="">` nas telas OrdensServico.tsx e OrdemServicoDetalhe.tsx

## Segurança Crítica — Painel Admin exposto a tenants

- [ ] Remover link "Painel Admin" do menu de navegação de tenants (AppLayout/DashboardLayout)
- [ ] Verificar e reforçar AdminGuard para redirecionar tenants para /dashboard
- [ ] Verificar todos os endpoints tRPC de admin (adminProcedure) e confirmar proteção

## Bug Crítico — SelectItem value vazio em OS

- [ ] Corrigir Select com value="0" (clienteId/equipamentoId) em OrdensServico.tsx
- [ ] Corrigir Select com value="" (nextStatus) em OrdemServicoDetalhe.tsx

## Integração Resend — E-mail Transacional

- [ ] Configurar secret RESEND_API_KEY
- [ ] Instalar dependência `resend`
- [ ] Criar helper `server/email.ts` com função `sendEmail` e templates HTML
- [ ] Template: e-mail de boas-vindas ao cadastrar trial
- [ ] Template: alerta 3 dias antes do trial expirar
- [ ] Template: confirmação de pagamento após upgrade
- [ ] Disparar boas-vindas no endpoint `lead.register`
- [ ] Disparar alerta de trial no job cron diário
- [ ] Disparar confirmação de pagamento no webhook `checkout.session.completed`

## Segurança Crítica — Isolamento Total do Painel Admin

- [ ] Remover link "Painel Admin" do sidebar do tenant (AppLayout/DashboardLayout)
- [ ] Criar SuperAdminGuard: bloqueia acesso a /super-admin para qualquer usuário sem isPlatformAdmin
- [ ] Criar SuperAdminLayout: layout isolado com identidade visual distinta, sem conexão com o layout do tenant
- [ ] Migrar todas as rotas /admin/* para /super-admin/* no App.tsx
- [ ] Atualizar todos os links internos do Control Plane para /super-admin
- [ ] Garantir que tenant com role=admin não acessa /super-admin (apenas isPlatformAdmin=true)
- [ ] Verificar que nenhuma rota do tenant linka para /super-admin

## Área de Revendas

- [ ] Schema: tabela `revendedores` (id, nome, email, whatsapp, cidade, estado, atuacao, mensagem, status enum draft/ativo/inativo, createdAt)
- [ ] Migration gerada e aplicada
- [ ] Backend: publicProcedure `revendedores.register` (cadastro público sem auth)
- [ ] Backend: adminProcedure `revendedores.list` (listar todos com filtro de status)
- [ ] Backend: adminProcedure `revendedores.updateStatus` (ativar/inativar revendedor)
- [ ] Backend: notifyOwner ao receber novo cadastro de revendedor
- [ ] Backend: e-mail de confirmação ao revendedor após cadastro
- [ ] Landing page: seção "Seja um Revendedor" com proposta de valor (3 benefícios) e formulário
- [ ] Landing page: âncora `#revendedores` para navegação direta
- [ ] Super Admin: página `/super-admin/revendedores` com tabela de leads e ações de status
- [ ] Super Admin: link "Revendedores" no menu do CoreLayout

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
