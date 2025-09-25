#!/bin/bash

# Script de monitoramento do Radar Diário
# Verifica se o bot está funcionando e reinicia se necessário

echo "🔍 Verificando status do Radar Diário..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Verificar se o bot está rodando
if pm2 list | grep -q "radar-diario"; then
    echo "✅ Bot está rodando"
    
    # Verificar se está respondendo
    echo "🧪 Testando resposta do bot..."
    
    # Verificar logs recentes (últimos 5 minutos)
    if pm2 logs radar-diario --lines 10 | grep -q "$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M')"; then
        echo "✅ Bot está ativo e respondendo"
    else
        echo "⚠️ Bot pode estar com problema - reiniciando..."
        pm2 restart radar-diario
    fi
else
    echo "❌ Bot não está rodando - iniciando..."
    pm2 start src/index.js --name "radar-diario"
fi

# Verificar uso de memória
echo "💾 Verificando uso de memória..."
pm2 monit

# Verificar logs de erro
echo "🔍 Verificando logs de erro..."
if pm2 logs radar-diario --lines 50 | grep -q "ERROR"; then
    echo "⚠️ Erros encontrados nos logs"
    echo "📋 Últimos erros:"
    pm2 logs radar-diario --lines 10 | grep "ERROR"
else
    echo "✅ Nenhum erro encontrado"
fi

# Log do monitoramento
echo "$(date): Monitoramento executado" >> logs/monitor.log
