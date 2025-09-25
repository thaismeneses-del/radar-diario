#!/bin/bash

# Script para instalar e configurar PM2
# Mantém o bot rodando 24h por dia com auto-restart

echo "🚀 Instalando e configurando PM2..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# Parar o bot se estiver rodando
echo "🛑 Parando bot atual..."
pm2 stop radar-diario 2>/dev/null || echo "Bot não estava rodando"

# Iniciar o bot com PM2
echo "▶️ Iniciando bot com PM2..."
pm2 start src/index.js --name "radar-diario"

# Configurar PM2 para iniciar automaticamente
echo "⚙️ Configurando auto-start..."
pm2 startup

# Salvar configuração atual
echo "💾 Salvando configuração..."
pm2 save

# Configurar logs
echo "📋 Configurando logs..."
pm2 install pm2-logrotate

# Verificar status
echo "✅ Status do bot:"
pm2 status

echo "📊 Comandos úteis:"
echo "  pm2 status          - Ver status"
echo "  pm2 logs radar-diario - Ver logs"
echo "  pm2 restart radar-diario - Reiniciar"
echo "  pm2 stop radar-diario - Parar"
echo "  pm2 monit - Monitoramento em tempo real"
