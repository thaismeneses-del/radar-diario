#!/bin/bash

# Script de atualização automática do Radar Diário
# Executa diariamente para manter o sistema atualizado

echo "🔄 Iniciando atualização do Radar Diário..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Verificar se há atualizações disponíveis
echo "📦 Verificando atualizações de dependências..."
npm outdated

# Atualizar dependências
echo "⬆️ Atualizando dependências..."
npm update

# Verificar vulnerabilidades
echo "🔒 Verificando vulnerabilidades..."
npm audit

# Corrigir vulnerabilidades automaticamente
echo "🛠️ Corrigindo vulnerabilidades..."
npm audit fix

# Reiniciar o bot se estiver rodando
echo "🔄 Reiniciando bot..."
pm2 restart radar-diario || echo "Bot não está rodando com PM2"

# Verificar status
echo "✅ Atualização concluída!"
echo "📊 Status do bot:"
pm2 status

# Log da atualização
echo "$(date): Atualização automática executada" >> logs/update.log
