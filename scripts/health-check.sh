#!/bin/bash

# Script de verificação de saúde do Radar Diário
# Verifica se todos os componentes estão funcionando

echo "🏥 Verificação de saúde do Radar Diário..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Verificar se o bot está rodando
echo "🤖 Verificando bot do Telegram..."
if pm2 list | grep -q "radar-diario.*online"; then
    echo "✅ Bot está online"
else
    echo "❌ Bot está offline"
    exit 1
fi

# Verificar conectividade com Telegram
echo "📡 Testando conectividade com Telegram..."
if curl -s "https://api.telegram.org/bot$(grep TELEGRAM_BOT_TOKEN .env | cut -d'=' -f2)/getMe" | grep -q '"ok":true'; then
    echo "✅ Conexão com Telegram OK"
else
    echo "❌ Problema de conexão com Telegram"
fi

# Verificar conectividade com Google Sheets
echo "📊 Testando conectividade com Google Sheets..."
if curl -s "https://sheets.googleapis.com/v4/spreadsheets/$(grep GOOGLE_SHEET_ID .env | cut -d'=' -f2)" | grep -q "spreadsheetId"; then
    echo "✅ Conexão com Google Sheets OK"
else
    echo "❌ Problema de conexão com Google Sheets"
fi

# Verificar uso de memória
echo "💾 Verificando uso de memória..."
MEMORY_USAGE=$(pm2 jlist | jq -r '.[] | select(.name=="radar-diario") | .monit.memory')
echo "📊 Uso de memória: $MEMORY_USAGE bytes"

# Verificar logs de erro recentes
echo "🔍 Verificando logs de erro..."
ERROR_COUNT=$(pm2 logs radar-diario --lines 100 | grep -c "ERROR" || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ Nenhum erro encontrado"
else
    echo "⚠️ $ERROR_COUNT erros encontrados nos logs"
fi

# Verificar espaço em disco
echo "💽 Verificando espaço em disco..."
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✅ Espaço em disco OK ($DISK_USAGE% usado)"
else
    echo "⚠️ Pouco espaço em disco ($DISK_USAGE% usado)"
fi

# Verificar dependências
echo "📦 Verificando dependências..."
if npm audit --audit-level=high | grep -q "found 0 vulnerabilities"; then
    echo "✅ Dependências seguras"
else
    echo "⚠️ Vulnerabilidades encontradas"
fi

echo "🏥 Verificação de saúde concluída!"
echo "📊 Resumo:"
echo "  Bot: $(pm2 list | grep radar-diario | awk '{print $10}')"
echo "  Memória: $MEMORY_USAGE bytes"
echo "  Erros: $ERROR_COUNT"
echo "  Disco: $DISK_USAGE%"
