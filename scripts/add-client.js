#!/usr/bin/env node

/**
 * Script para adicionar novos clientes ao Radar Diário
 * 
 * Uso: node scripts/add-client.js "Nome do Cliente" "Nome Completo" "Categoria" "Descrição"
 * 
 * Exemplo: node scripts/add-client.js "FIESP" "Federação das Indústrias do Estado de São Paulo" "Externo" "Federação das Indústrias do Estado de São Paulo"
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('❌ Uso: node scripts/add-client.js "Nome" "Nome Completo" "Categoria" "Descrição"');
  console.log('📝 Exemplo: node scripts/add-client.js "FIESP" "Federação das Indústrias do Estado de São Paulo" "Externo" "Federação das Indústrias do Estado de São Paulo"');
  process.exit(1);
}

const [name, fullName, category, description] = args;

// Ler arquivo de clientes
const clientsPath = path.join(process.cwd(), 'src', 'clients.js');
let content = fs.readFileSync(clientsPath, 'utf8');

// Gerar chave única baseada no nome
const key = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

// Novo cliente
const newClient = `  ${key}: {
    name: '${name}',
    fullName: '${fullName}',
    category: '${category}',
    description: '${description}'
  },`;

// Encontrar posição para inserir (antes do último cliente)
const lastClientIndex = content.lastIndexOf('  }');
const insertPosition = content.lastIndexOf('  }', lastClientIndex - 1);

if (insertPosition === -1) {
  console.log('❌ Erro: Não foi possível encontrar posição para inserir cliente');
  process.exit(1);
}

// Inserir novo cliente
const beforeInsert = content.substring(0, insertPosition);
const afterInsert = content.substring(insertPosition);

const newContent = beforeInsert + newClient + '\n' + afterInsert;

// Salvar arquivo
fs.writeFileSync(clientsPath, newContent);

console.log('✅ Cliente adicionado com sucesso!');
console.log(`📝 Nome: ${name}`);
console.log(`📝 Nome Completo: ${fullName}`);
console.log(`📝 Categoria: ${category}`);
console.log(`📝 Descrição: ${description}`);
console.log(`🔑 Chave: ${key}`);
console.log('');
console.log('💡 Para usar o novo cliente, envie uma mensagem como:');
console.log(`   "Tarefa importante [${name}] #urgente"`);
console.log('');
console.log('🔄 Reinicie o bot para aplicar as mudanças.');
