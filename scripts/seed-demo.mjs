import mysql from 'mysql2/promise';

const TENANT_ID = 30001;
const USER_ID = 180056;

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('🚀 Iniciando seed do tenant demo (ID:', TENANT_ID, ')...\n');

  // ─── Limpar dados existentes do tenant ───────────────────────────────────
  console.log('🧹 Limpando dados anteriores...');
  await conn.execute('DELETE FROM caixaLancamentos WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM osLancamentos WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM osItens WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM osStatusHistory WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM osPhotos WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM osFieldAudit WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM comissoesTecnicos WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM ordensServico WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM estoqueMovimentacoes WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM pecas WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM listaCompras WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM equipamentos WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM clientes WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM supplierBankAccounts WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM supplierDocuments WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM suppliers WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM employees WHERE tenantId = ?', [TENANT_ID]);
  await conn.execute('DELETE FROM companySettings WHERE tenantId = ?', [TENANT_ID]);
  console.log('✅ Dados anteriores removidos.\n');

  // ─── 1. Configurações da empresa ─────────────────────────────────────────
  console.log('🏢 Criando configurações da empresa...');
  await conn.execute(`
    INSERT INTO companySettings (tenantId, companyName, cnpj, phonePrimary, emailPrimary, website,
      street, number, neighborhood, city, state, zipCode,
      primaryColor, secondaryColor, warrantyText, osTerms, documentFooterText, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [
    TENANT_ID,
    'TechFix Assistência Técnica',
    '12.345.678/0001-90',
    '(11) 3456-7890',
    'contato@techfix.com.br',
    'www.techfix.com.br',
    'Rua das Palmeiras',
    '1250',
    'Centro',
    'São Paulo',
    'SP',
    '01310-100',
    '#1B4F8A',
    '#C4733A',
    'Garantia de 90 dias para peças e serviços realizados. A garantia cobre defeitos relacionados ao serviço prestado e não cobre danos por mau uso, quedas ou líquidos.',
    'Ao entregar o equipamento, o cliente declara estar ciente dos serviços a serem realizados e autoriza a execução do orçamento aprovado.',
    'TechFix Assistência Técnica | CNPJ 12.345.678/0001-90 | (11) 3456-7890 | contato@techfix.com.br',
  ]);
  console.log('✅ Empresa configurada.\n');

  // ─── 2. Técnicos / Colaboradores ─────────────────────────────────────────
  console.log('👷 Criando técnicos...');
  const [resEmp1] = await conn.execute(`
    INSERT INTO employees (tenantId, fullName, cpf, phone, email, role, specialties,
      hireDate, isActive, commissionType, commissionPercentage, commissionBase, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [TENANT_ID, 'Carlos Eduardo Mendes', '345.678.901-23', '(11) 98765-4321',
      'carlos@techfix.com.br', 'technician',
      JSON.stringify(['iPhone', 'Samsung', 'Motorola', 'Placa-mãe']),
      '2022-03-15', 1, 'percentage', 15.00, 'services_only']);

  const [resEmp2] = await conn.execute(`
    INSERT INTO employees (tenantId, fullName, cpf, phone, email, role, specialties,
      hireDate, isActive, commissionType, commissionPercentage, commissionBase, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [TENANT_ID, 'Fernanda Lima Costa', '456.789.012-34', '(11) 97654-3210',
      'fernanda@techfix.com.br', 'technician',
      JSON.stringify(['iPad', 'MacBook', 'Notebook', 'Tela']),
      '2023-01-10', 1, 'percentage', 12.00, 'services_and_parts']);

  const [resEmp3] = await conn.execute(`
    INSERT INTO employees (tenantId, fullName, cpf, phone, email, role, specialties,
      hireDate, isActive, commissionType, commissionPercentage, commissionBase, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [TENANT_ID, 'Ricardo Alves Santos', '567.890.123-45', '(11) 96543-2109',
      'ricardo@techfix.com.br', 'attendant',
      JSON.stringify(['Atendimento', 'Orçamento', 'Entrega']),
      '2023-06-01', 1, 'fixed', 0, 'services_only']);

  const empId1 = resEmp1.insertId;
  const empId2 = resEmp2.insertId;
  const empId3 = resEmp3.insertId;
  console.log(`✅ 3 técnicos criados (IDs: ${empId1}, ${empId2}, ${empId3}).\n`);

  // ─── 3. Fornecedores ──────────────────────────────────────────────────────
  console.log('🏭 Criando fornecedores...');
  const suppliers = [
    {
      companyType: 'juridica', corporateName: 'Distribuidora TeleParts Ltda', tradeName: 'TeleParts',
      cnpj: '11.222.333/0001-44', emailPrimary: 'vendas@teleparts.com.br', phoneMobile: '(11) 3333-4444',
      contactName: 'Marcos Oliveira', contactRole: 'Gerente Comercial',
      city: 'São Paulo', state: 'SP', zipCode: '04001-001',
      supplierCategory: JSON.stringify(['Telas', 'Baterias', 'Conectores']),
      brandsSupplied: JSON.stringify(['Apple', 'Samsung', 'Motorola']),
      paymentTerms: '30/60 dias', paymentMethodPreferred: 'pix',
      averageDeliveryDays: 3, discountPercentage: 5.00, rating: 5,
      ratingNotes: 'Excelente qualidade e prazo de entrega', isPreferred: 1,
    },
    {
      companyType: 'juridica', corporateName: 'MegaCell Distribuidora S/A', tradeName: 'MegaCell',
      cnpj: '22.333.444/0001-55', emailPrimary: 'compras@megacell.com.br', phoneMobile: '(21) 4444-5555',
      contactName: 'Patrícia Souza', contactRole: 'Representante',
      city: 'Rio de Janeiro', state: 'RJ', zipCode: '20040-020',
      supplierCategory: JSON.stringify(['Ferramentas', 'Embalagens', 'Acessórios']),
      brandsSupplied: JSON.stringify(['Xiaomi', 'Motorola', 'LG']),
      paymentTerms: 'À vista com desconto', paymentMethodPreferred: 'boleto',
      averageDeliveryDays: 5, discountPercentage: 3.00, rating: 4,
      ratingNotes: 'Bom preço, entrega às vezes atrasa', isPreferred: 0,
    },
    {
      companyType: 'fisica', corporateName: 'José Carlos Pereira', tradeName: 'JC Peças',
      cpf: '789.012.345-67', emailPrimary: 'jc.pecas@gmail.com', phoneMobile: '(11) 95555-6666',
      contactName: 'José Carlos', contactRole: 'Proprietário',
      city: 'São Paulo', state: 'SP', zipCode: '03001-001',
      supplierCategory: JSON.stringify(['Peças iPhone', 'Peças Samsung']),
      brandsSupplied: JSON.stringify(['Apple', 'Samsung']),
      paymentTerms: 'À vista', paymentMethodPreferred: 'pix',
      averageDeliveryDays: 1, discountPercentage: 0, rating: 4,
      ratingNotes: 'Peças originais, preço justo', isPreferred: 0,
    },
  ];

  const supplierIds = [];
  for (const s of suppliers) {
    const [res] = await conn.execute(`
      INSERT INTO suppliers (tenantId, companyType, corporateName, tradeName, cnpj, cpf,
        emailPrimary, phoneMobile, contactName, contactRole, city, state, zipCode,
        supplierCategory, brandsSupplied, paymentTerms, paymentMethodPreferred,
        averageDeliveryDays, discountPercentage, rating, ratingNotes, isPreferred,
        isActive, country, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Brasil', NOW(), NOW())
    `, [TENANT_ID, s.companyType, s.corporateName, s.tradeName, s.cnpj || null, s.cpf || null,
        s.emailPrimary, s.phoneMobile, s.contactName, s.contactRole, s.city, s.state, s.zipCode,
        s.supplierCategory, s.brandsSupplied, s.paymentTerms, s.paymentMethodPreferred,
        s.averageDeliveryDays, s.discountPercentage, s.rating, s.ratingNotes, s.isPreferred]);
    supplierIds.push(res.insertId);
  }
  // Conta bancária para o primeiro fornecedor
  await conn.execute(`
    INSERT INTO supplierBankAccounts (tenantId, supplierId, bankName, bankCode, agency,
      accountNumber, accountType, pixKey, pixKeyType, accountHolder, isDefault, createdAt)
    VALUES (?, ?, 'Itaú', '341', '1234-5', '56789-0', 'corrente', '11.222.333/0001-44', 'cnpj', 'TeleParts', 1, NOW())
  `, [TENANT_ID, supplierIds[0]]);
  console.log(`✅ 3 fornecedores criados (IDs: ${supplierIds.join(', ')}).\n`);

  // ─── 4. Clientes ──────────────────────────────────────────────────────────
  console.log('👥 Criando clientes...');
  const clientes = [
    { tipo: 'pf', nome: 'Ana Paula Rodrigues', cpfCnpj: '123.456.789-00', whatsapp: '(11) 99001-1001', email: 'ana.paula@gmail.com', cidade: 'São Paulo', estado: 'SP', classificacao: 'vip', origemCliente: 'indicacao' },
    { tipo: 'pf', nome: 'Bruno Henrique Martins', cpfCnpj: '234.567.890-11', whatsapp: '(11) 99002-2002', email: 'bruno.martins@hotmail.com', cidade: 'São Paulo', estado: 'SP', classificacao: 'recorrente', origemCliente: 'redes_sociais' },
    { tipo: 'pf', nome: 'Camila Ferreira Dias', cpfCnpj: '345.678.901-22', whatsapp: '(11) 99003-3003', email: 'camila.dias@gmail.com', cidade: 'Guarulhos', estado: 'SP', classificacao: 'padrao', origemCliente: 'google' },
    { tipo: 'pf', nome: 'Daniel Costa Nunes', cpfCnpj: '456.789.012-33', whatsapp: '(11) 99004-4004', email: 'daniel.nunes@yahoo.com.br', cidade: 'São Paulo', estado: 'SP', classificacao: 'padrao', origemCliente: 'passante' },
    { tipo: 'pf', nome: 'Elaine Cristina Souza', cpfCnpj: '567.890.123-44', whatsapp: '(11) 99005-5005', email: 'elaine.souza@gmail.com', cidade: 'Osasco', estado: 'SP', classificacao: 'padrao', origemCliente: 'indicacao' },
    { tipo: 'pj', nome: 'Tech Solutions Ltda', cpfCnpj: '98.765.432/0001-10', whatsapp: '(11) 3456-7890', email: 'ti@techsolutions.com.br', cidade: 'São Paulo', estado: 'SP', classificacao: 'vip', origemCliente: 'outro' },
    { tipo: 'pf', nome: 'Fábio Augusto Lima', cpfCnpj: '678.901.234-55', whatsapp: '(11) 99006-6006', email: 'fabio.lima@gmail.com', cidade: 'São Paulo', estado: 'SP', classificacao: 'padrao', origemCliente: 'google' },
    { tipo: 'pf', nome: 'Gabriela Mendes Alves', cpfCnpj: '789.012.345-66', whatsapp: '(11) 99007-7007', email: 'gabi.alves@gmail.com', cidade: 'São Bernardo', estado: 'SP', classificacao: 'recorrente', origemCliente: 'redes_sociais' },
    { tipo: 'pf', nome: 'Hugo Carvalho Pinto', cpfCnpj: '890.123.456-77', whatsapp: '(11) 99008-8008', email: 'hugo.pinto@outlook.com', cidade: 'São Paulo', estado: 'SP', classificacao: 'padrao', origemCliente: 'passante' },
    { tipo: 'pf', nome: 'Isabela Torres Freitas', cpfCnpj: '901.234.567-88', whatsapp: '(11) 99009-9009', email: 'isa.freitas@gmail.com', cidade: 'São Paulo', estado: 'SP', classificacao: 'padrao', origemCliente: 'indicacao' },
  ];

  const clienteIds = [];
  for (const c of clientes) {
    const [res] = await conn.execute(`
      INSERT INTO clientes (tenantId, tipo, nome, cpfCnpj, whatsapp, email, cidade, estado,
        classificacao, origemCliente, aceitouTermos, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [TENANT_ID, c.tipo, c.nome, c.cpfCnpj, c.whatsapp, c.email, c.cidade, c.estado,
        c.classificacao, c.origemCliente]);
    clienteIds.push(res.insertId);
  }
  console.log(`✅ ${clienteIds.length} clientes criados.\n`);

  // ─── 5. Equipamentos ──────────────────────────────────────────────────────
  console.log('📱 Criando equipamentos...');
  const equipamentos = [
    { clienteIdx: 0, categoria: 'smartphone', marca: 'Apple', modelo: 'iPhone 14 Pro', numeroSerie: 'SN-IP14P-001', imei: '356789012345678', capacidade: '256GB', cor: 'Preto Espacial' },
    { clienteIdx: 1, categoria: 'smartphone', marca: 'Samsung', modelo: 'Galaxy S23 Ultra', numeroSerie: 'SN-SGS23-002', imei: '357890123456789', capacidade: '512GB', cor: 'Creme' },
    { clienteIdx: 2, categoria: 'smartphone', marca: 'Motorola', modelo: 'Moto G84', numeroSerie: 'SN-MTG84-003', imei: '358901234567890', capacidade: '256GB', cor: 'Azul Vegan' },
    { clienteIdx: 3, categoria: 'tablet', marca: 'Apple', modelo: 'iPad Pro 12.9"', numeroSerie: 'SN-IPADP-004', imei: '359012345678901', capacidade: '128GB', cor: 'Prateado' },
    { clienteIdx: 4, categoria: 'notebook', marca: 'Dell', modelo: 'Inspiron 15 3000', numeroSerie: 'SN-DELL15-005', imei: null, capacidade: '8GB RAM / 512GB SSD', cor: 'Preto' },
    { clienteIdx: 5, categoria: 'smartphone', marca: 'Apple', modelo: 'iPhone 13', numeroSerie: 'SN-IP13-006', imei: '360123456789012', capacidade: '128GB', cor: 'Azul' },
    { clienteIdx: 5, categoria: 'notebook', marca: 'Lenovo', modelo: 'ThinkPad E14', numeroSerie: 'SN-LNVE14-007', imei: null, capacidade: '16GB RAM / 512GB SSD', cor: 'Preto' },
    { clienteIdx: 6, categoria: 'smartphone', marca: 'Xiaomi', modelo: 'Redmi Note 12', numeroSerie: 'SN-XMRN12-008', imei: '361234567890123', capacidade: '128GB', cor: 'Branco' },
    { clienteIdx: 7, categoria: 'smartphone', marca: 'Samsung', modelo: 'Galaxy A54', numeroSerie: 'SN-SGA54-009', imei: '362345678901234', capacidade: '256GB', cor: 'Violeta' },
    { clienteIdx: 8, categoria: 'smartphone', marca: 'Apple', modelo: 'iPhone 12', numeroSerie: 'SN-IP12-010', imei: '363456789012345', capacidade: '64GB', cor: 'Vermelho' },
    { clienteIdx: 9, categoria: 'tablet', marca: 'Samsung', modelo: 'Galaxy Tab S8', numeroSerie: 'SN-SGTS8-011', imei: '364567890123456', capacidade: '256GB', cor: 'Grafite' },
    { clienteIdx: 0, categoria: 'smartwatch', marca: 'Apple', modelo: 'Apple Watch Series 8', numeroSerie: 'SN-AWS8-012', imei: null, capacidade: '45mm', cor: 'Midnight' },
  ];

  const equipamentoIds = [];
  for (const e of equipamentos) {
    const [res] = await conn.execute(`
      INSERT INTO equipamentos (tenantId, clienteId, categoria, marca, modelo, numeroSerie, imei, capacidade, cor, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [TENANT_ID, clienteIds[e.clienteIdx], e.categoria, e.marca, e.modelo, e.numeroSerie, e.imei, e.capacidade, e.cor]);
    equipamentoIds.push(res.insertId);
  }
  console.log(`✅ ${equipamentoIds.length} equipamentos criados.\n`);

  // ─── 6. Peças em estoque ──────────────────────────────────────────────────
  console.log('🔧 Criando peças em estoque...');
  const pecas = [
    { codigo: 'PÇ-000001', nome: 'Tela iPhone 14 Pro OLED Original', categoria: 'tela', precoCusto: 380.00, precoVenda: 580.00, quantidadeAtual: 5, quantidadeMinima: 2, partNumber: 'IP14P-SCR-001', manufacturer: 'Apple' },
    { codigo: 'PÇ-000002', nome: 'Bateria iPhone 14 Pro 3200mAh', categoria: 'bateria', precoCusto: 85.00, precoVenda: 149.00, quantidadeAtual: 8, quantidadeMinima: 3, partNumber: 'IP14P-BAT-001', manufacturer: 'Apple' },
    { codigo: 'PÇ-000003', nome: 'Tela Samsung Galaxy S23 Ultra AMOLED', categoria: 'tela', precoCusto: 420.00, precoVenda: 650.00, quantidadeAtual: 3, quantidadeMinima: 2, partNumber: 'SGS23U-SCR-001', manufacturer: 'Samsung' },
    { codigo: 'PÇ-000004', nome: 'Bateria Samsung Galaxy A54 5000mAh', categoria: 'bateria', precoCusto: 55.00, precoVenda: 99.00, quantidadeAtual: 10, quantidadeMinima: 4, partNumber: 'SGA54-BAT-001', manufacturer: 'Samsung' },
    { codigo: 'PÇ-000005', nome: 'Conector de Carga iPhone 14 Lightning', categoria: 'conector', precoCusto: 45.00, precoVenda: 89.00, quantidadeAtual: 12, quantidadeMinima: 5, partNumber: 'IP14-CHG-001', manufacturer: 'Apple' },
    { codigo: 'PÇ-000006', nome: 'Tela Motorola Moto G84 IPS LCD', categoria: 'tela', precoCusto: 120.00, precoVenda: 220.00, quantidadeAtual: 4, quantidadeMinima: 2, partNumber: 'MTG84-SCR-001', manufacturer: 'Motorola' },
    { codigo: 'PÇ-000007', nome: 'Bateria iPad Pro 12.9" 10758mAh', categoria: 'bateria', precoCusto: 180.00, precoVenda: 320.00, quantidadeAtual: 2, quantidadeMinima: 1, partNumber: 'IPADP-BAT-001', manufacturer: 'Apple' },
    { codigo: 'PÇ-000008', nome: 'Cabo Flat LCD Samsung S23', categoria: 'cabo', precoCusto: 35.00, precoVenda: 65.00, quantidadeAtual: 6, quantidadeMinima: 3, partNumber: 'SGS23-FLX-001', manufacturer: 'Samsung' },
    { codigo: 'PÇ-000009', nome: 'Película de Vidro Temperado 9H Universal', categoria: 'acessorio', precoCusto: 8.00, precoVenda: 25.00, quantidadeAtual: 30, quantidadeMinima: 10, partNumber: 'UNI-FILM-001', manufacturer: 'Genérico' },
    { codigo: 'PÇ-000010', nome: 'Pasta Térmica Profissional 5g', categoria: 'outro', precoCusto: 12.00, precoVenda: 28.00, quantidadeAtual: 15, quantidadeMinima: 5, partNumber: 'THRM-PST-001', manufacturer: 'Artic' },
    { codigo: 'PÇ-000011', nome: 'Tela iPhone 13 OLED Original', categoria: 'tela', precoCusto: 310.00, precoVenda: 480.00, quantidadeAtual: 1, quantidadeMinima: 2, partNumber: 'IP13-SCR-001', manufacturer: 'Apple' },
    { codigo: 'PÇ-000012', nome: 'Bateria Xiaomi Redmi Note 12 5000mAh', categoria: 'bateria', precoCusto: 48.00, precoVenda: 89.00, quantidadeAtual: 7, quantidadeMinima: 3, partNumber: 'XMRN12-BAT-001', manufacturer: 'Xiaomi' },
  ];

  const pecaIds = [];
  for (const p of pecas) {
    const [res] = await conn.execute(`
      INSERT INTO pecas (tenantId, codigo, nome, categoria, precoCusto, precoVenda,
        quantidadeAtual, quantidadeMinima, partNumber, manufacturer, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [TENANT_ID, p.codigo, p.nome, p.categoria, p.precoCusto, p.precoVenda,
        p.quantidadeAtual, p.quantidadeMinima, p.partNumber, p.manufacturer]);
    pecaIds.push(res.insertId);

    // Movimentação de entrada inicial
    await conn.execute(`
      INSERT INTO estoqueMovimentacoes (tenantId, pecaId, tipo, quantidade, quantidadeAnterior, quantidadeNova, observacao, userId, createdAt)
      VALUES (?, ?, 'entrada', ?, 0, ?, 'Estoque inicial', ?, NOW())
    `, [TENANT_ID, res.insertId, p.quantidadeAtual, p.quantidadeAtual, USER_ID]);
  }
  console.log(`✅ ${pecaIds.length} peças criadas com movimentações de entrada.\n`);

  // ─── 7. Ordens de Serviço ─────────────────────────────────────────────────
  console.log('📋 Criando ordens de serviço...');

  const osData = [
    // OS encerradas (históricas)
    { num: 'OS-2026-0001', clienteIdx: 0, equipIdx: 0, tecnico: empId1, status: 'encerrado', problema: 'Tela quebrada após queda. Cliente relata que o display parou de funcionar completamente.', laudo: 'Tela com dano físico severo. Substituição necessária.', valorTotal: 580.00, valorPago: 580.00, diasAtras: 45, itens: [{ tipo: 'peca', desc: 'Tela iPhone 14 Pro OLED Original', pecaIdx: 0, qtd: 1, valor: 580.00 }, { tipo: 'servico', desc: 'Mão de obra troca de tela', qtd: 1, valor: 80.00 }] },
    { num: 'OS-2026-0002', clienteIdx: 1, equipIdx: 1, tecnico: empId2, status: 'encerrado', problema: 'Bateria não carrega mais. Celular desliga com 30% de carga.', laudo: 'Bateria com desgaste acima do normal. Capacidade em 62%.', valorTotal: 249.00, valorPago: 249.00, diasAtras: 38, itens: [{ tipo: 'peca', desc: 'Bateria Samsung Galaxy S23 Ultra', pecaIdx: 3, qtd: 1, valor: 160.00 }, { tipo: 'servico', desc: 'Mão de obra troca de bateria', qtd: 1, valor: 89.00 }] },
    { num: 'OS-2026-0003', clienteIdx: 5, equipIdx: 6, tecnico: empId1, status: 'encerrado', problema: 'Notebook lento e superaquecendo. Ventilador fazendo barulho.', laudo: 'Pasta térmica ressecada e cooler com acúmulo de poeira. Limpeza e troca de pasta realizadas.', valorTotal: 180.00, valorPago: 180.00, diasAtras: 30, itens: [{ tipo: 'servico', desc: 'Limpeza interna + troca pasta térmica', qtd: 1, valor: 150.00 }, { tipo: 'peca', desc: 'Pasta Térmica Profissional', pecaIdx: 9, qtd: 1, valor: 28.00 }] },
    { num: 'OS-2026-0004', clienteIdx: 2, equipIdx: 2, tecnico: empId2, status: 'encerrado', problema: 'Tela com manchas e linhas horizontais após queda.', laudo: 'Display com dano interno. Substituição realizada com peça compatível.', valorTotal: 220.00, valorPago: 220.00, diasAtras: 25, itens: [{ tipo: 'peca', desc: 'Tela Motorola Moto G84 IPS LCD', pecaIdx: 5, qtd: 1, valor: 220.00 }] },
    { num: 'OS-2026-0005', clienteIdx: 7, equipIdx: 7, tecnico: empId1, status: 'encerrado', problema: 'Celular molhado, não liga mais.', laudo: 'Dano por líquido na placa principal. Limpeza com ultrassom realizada. Equipamento recuperado.', valorTotal: 350.00, valorPago: 350.00, diasAtras: 20, itens: [{ tipo: 'servico', desc: 'Limpeza ultrassônica + diagnóstico', qtd: 1, valor: 250.00 }, { tipo: 'servico', desc: 'Troca conector de carga', qtd: 1, valor: 100.00 }] },
    // OS em andamento
    { num: 'OS-2026-0006', clienteIdx: 3, equipIdx: 3, tecnico: empId2, status: 'em_reparo', problema: 'iPad com tela não respondendo ao toque. Queda de pequena altura.', laudo: 'Digitalizador danificado. Aguardando peça.', valorTotal: 450.00, valorPago: 150.00, diasAtras: 5, itens: [{ tipo: 'peca', desc: 'Tela iPad Pro 12.9" com digitalizador', qtd: 1, valor: 380.00 }, { tipo: 'servico', desc: 'Mão de obra', qtd: 1, valor: 70.00 }] },
    { num: 'OS-2026-0007', clienteIdx: 4, equipIdx: 4, tecnico: empId1, status: 'em_diagnostico', problema: 'Notebook não liga. Botão de power sem resposta.', laudo: null, valorTotal: 0, valorPago: 0, diasAtras: 3, itens: [] },
    { num: 'OS-2026-0008', clienteIdx: 8, equipIdx: 9, tecnico: empId2, status: 'aguardando_aprovacao', problema: 'iPhone com tela quebrada e bateria viciada.', laudo: 'Tela com trinca total. Bateria com 71% de capacidade. Orçamento enviado para aprovação.', valorTotal: 629.00, valorPago: 0, diasAtras: 2, itens: [{ tipo: 'peca', desc: 'Tela iPhone 12 OLED', qtd: 1, valor: 450.00 }, { tipo: 'peca', desc: 'Bateria iPhone 12', qtd: 1, valor: 129.00 }, { tipo: 'servico', desc: 'Mão de obra', qtd: 1, valor: 50.00 }] },
    { num: 'OS-2026-0009', clienteIdx: 9, equipIdx: 10, tecnico: empId1, status: 'pronto_aguardando_retirada', problema: 'Tablet com bateria inchada. Tela levantando.', laudo: 'Bateria com inchaço severo. Substituída com sucesso. Equipamento pronto.', valorTotal: 320.00, valorPago: 320.00, diasAtras: 1, itens: [{ tipo: 'peca', desc: 'Bateria Galaxy Tab S8', qtd: 1, valor: 220.00 }, { tipo: 'servico', desc: 'Mão de obra troca bateria tablet', qtd: 1, valor: 100.00 }] },
    { num: 'OS-2026-0010', clienteIdx: 6, equipIdx: 7, tecnico: empId2, status: 'recebido', problema: 'Celular com câmera traseira sem foco e flash não funciona.', laudo: null, valorTotal: 0, valorPago: 0, diasAtras: 0, itens: [] },
    // OS com prazo vencido (alerta)
    { num: 'OS-2026-0011', clienteIdx: 5, equipIdx: 5, tecnico: empId1, status: 'em_diagnostico', problema: 'iPhone com problema de sinal. Não conecta ao 4G.', laudo: null, valorTotal: 0, valorPago: 0, diasAtras: 8, itens: [], prazoVencido: true },
  ];

  const osIds = [];
  for (const os of osData) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - os.diasAtras);
    const prazoOrcamento = os.prazoVencido
      ? new Date(createdAt.getTime() - 2 * 24 * 60 * 60 * 1000) // vencido há 2 dias
      : new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias a partir da criação

    const [res] = await conn.execute(`
      INSERT INTO ordensServico (tenantId, numero, clienteId, equipamentoId, tecnicoId, attendantId,
        status, prazoOrcamento, descricaoProblema, laudoTecnico, valorTotal, valorPago,
        temGarantia, garantiaDias, statusOrcamento, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 90, 'pendente', ?, ?)
    `, [TENANT_ID, os.num, clienteIds[os.clienteIdx], equipamentoIds[os.equipIdx],
        os.tecnico, empId3, os.status, prazoOrcamento,
        os.problema, os.laudo, os.valorTotal, os.valorPago,
        createdAt, createdAt]);
    const osId = res.insertId;
    osIds.push(osId);

    // Itens da OS
    for (const item of os.itens) {
      const pecaId = item.pecaIdx !== undefined ? pecaIds[item.pecaIdx] : null;
      const valorTotal = item.qtd * item.valor;
      await conn.execute(`
        INSERT INTO osItens (osId, tenantId, tipo, descricao, pecaId, quantidade, valorUnitario, valorTotal, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [osId, TENANT_ID, item.tipo, item.desc, pecaId, item.qtd, item.valor, valorTotal, createdAt]);
    }

    // Lançamentos financeiros para OS pagas
    if (os.valorPago > 0) {
      await conn.execute(`
        INSERT INTO osLancamentos (osId, tenantId, tipo, formaPagamento, valor, observacao, userId, createdAt)
        VALUES (?, ?, 'pagamento_final', 'pix', ?, 'Pagamento via PIX', ?, ?)
      `, [osId, TENANT_ID, os.valorPago, USER_ID, createdAt]);

      await conn.execute(`
        INSERT INTO caixaLancamentos (tenantId, tipo, descricao, valor, formaPagamento, osId, userId, manual, createdAt)
        VALUES (?, 'entrada', ?, ?, 'pix', ?, ?, 0, ?)
      `, [TENANT_ID, `Recebimento OS ${os.num}`, os.valorPago, osId, USER_ID, createdAt]);
    }

    // Histórico de status
    await conn.execute(`
      INSERT INTO osStatusHistory (tenantId, osId, statusAnterior, statusNovo, userId, createdAt)
      VALUES (?, ?, NULL, 'recebido', ?, ?)
    `, [TENANT_ID, osId, USER_ID, createdAt]);
  }
  console.log(`✅ ${osIds.length} ordens de serviço criadas com itens e lançamentos.\n`);

  // ─── 8. Lista de Compras ──────────────────────────────────────────────────
  console.log('🛒 Criando lista de compras...');
  const listaItems = [
    { pecaIdx: 10, desc: 'Tela iPhone 13 OLED Original', qty: 2, reason: 'stock_replenishment', priority: 'high', suppIdx: 0 },
    { pecaIdx: null, desc: 'Tela iPhone 15 Pro Max OLED', qty: 1, reason: 'os_demand', priority: 'high', suppIdx: 0 },
    { pecaIdx: 2, desc: 'Tela Samsung Galaxy S23 Ultra', qty: 2, reason: 'stock_replenishment', priority: 'medium', suppIdx: 0 },
    { pecaIdx: null, desc: 'Kit ferramentas iSclack abertura celular', qty: 1, reason: 'other', priority: 'low', suppIdx: 1 },
    { pecaIdx: 8, desc: 'Película de Vidro Temperado 9H (caixa 50un)', qty: 50, reason: 'stock_replenishment', priority: 'medium', suppIdx: 1 },
    { pecaIdx: null, desc: 'Bateria iPhone 15 3877mAh', qty: 3, reason: 'stock_replenishment', priority: 'high', suppIdx: 2 },
    { pecaIdx: null, desc: 'Conector USB-C Samsung S23', qty: 5, reason: 'stock_replenishment', priority: 'medium', suppIdx: 0 },
  ];

  for (const item of listaItems) {
    await conn.execute(`
      INSERT INTO listaCompras (tenantId, pecaId, itemDescription, quantityNeeded, reason,
        priority, status, supplierId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
    `, [TENANT_ID,
        item.pecaIdx !== null ? pecaIds[item.pecaIdx] : null,
        item.desc, item.qty, item.reason, item.priority,
        supplierIds[item.suppIdx]]);
  }
  console.log(`✅ ${listaItems.length} itens na lista de compras.\n`);

  // ─── 9. Lançamentos manuais no caixa ─────────────────────────────────────
  console.log('💰 Criando lançamentos manuais no caixa...');
  const lancamentos = [
    { tipo: 'saida', desc: 'Compra de peças - TeleParts (NF 1234)', valor: 850.00, forma: 'pix', diasAtras: 20 },
    { tipo: 'saida', desc: 'Aluguel do espaço - Março/2026', valor: 1200.00, forma: 'faturamento_direto', diasAtras: 15 },
    { tipo: 'entrada', desc: 'Venda de acessórios - películas e capinhas', valor: 180.00, forma: 'dinheiro', diasAtras: 10 },
    { tipo: 'saida', desc: 'Material de limpeza e consumíveis', valor: 95.00, forma: 'pix', diasAtras: 7 },
    { tipo: 'entrada', desc: 'Serviço de formatação e backup - avulso', valor: 120.00, forma: 'pix', diasAtras: 4 },
  ];

  for (const l of lancamentos) {
    const dt = new Date();
    dt.setDate(dt.getDate() - l.diasAtras);
    await conn.execute(`
      INSERT INTO caixaLancamentos (tenantId, tipo, descricao, valor, formaPagamento, userId, manual, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `, [TENANT_ID, l.tipo, l.desc, l.valor, l.forma, USER_ID, dt]);
  }
  console.log(`✅ ${lancamentos.length} lançamentos manuais no caixa.\n`);

  await conn.end();

  // ─── Resumo final ─────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Tenant: TechFix Assistência Técnica (ID: ${TENANT_ID})`);
  console.log(`✅ 1 configuração de empresa`);
  console.log(`✅ 3 técnicos/colaboradores`);
  console.log(`✅ 3 fornecedores (1 com conta bancária)`);
  console.log(`✅ 10 clientes (PF e PJ)`);
  console.log(`✅ 12 equipamentos (smartphones, tablets, notebooks, smartwatch)`);
  console.log(`✅ 12 peças em estoque com movimentações de entrada`);
  console.log(`✅ 11 ordens de serviço (5 encerradas, 6 em andamento, 1 com prazo vencido)`);
  console.log(`✅ 7 itens na lista de compras`);
  console.log(`✅ 5 lançamentos manuais no caixa`);
  console.log('═══════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Erro no seed:', err.message);
  process.exit(1);
});
