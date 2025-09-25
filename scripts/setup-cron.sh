#!/bin/bash

# Script para configurar cron jobs automáticos
# Executa atualizações, monitoramento e backup automaticamente

echo "⏰ Configurando cron jobs automáticos..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Tornar scripts executáveis
chmod +x scripts/*.sh

# Criar diretório de logs se não existir
mkdir -p logs

# Configurar cron jobs
echo "📅 Configurando cron jobs..."

# Atualização diária às 2:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /Users/thais/Documents/radar-diario/scripts/update.sh >> /Users/thais/Documents/radar-diario/logs/cron.log 2>&1") | crontab -

# Monitoramento a cada 15 minutos
(crontab -l 2>/dev/null; echo "*/15 * * * * /Users/thais/Documents/radar-diario/scripts/monitor.sh >> /Users/thais/Documents/radar-diario/logs/cron.log 2>&1") | crontab -

# Backup diário às 3:00 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /Users/thais/Documents/radar-diario/scripts/backup.sh >> /Users/thais/Documents/radar-diario/logs/cron.log 2>&1") | crontab -

# Verificar cron jobs configurados
echo "✅ Cron jobs configurados:"
crontab -l | grep radar-diario

echo "📋 Cronograma configurado:"
echo "🔄 Atualização: Diariamente às 2:00 AM"
echo "🔍 Monitoramento: A cada 15 minutos"
echo "💾 Backup: Diariamente às 3:00 AM"
echo "📁 Logs: /Users/thais/Documents/radar-diario/logs/cron.log"
