#!/bin/bash

# Script de backup do Radar Diário
# Cria backup das configurações e dados importantes

echo "💾 Iniciando backup do Radar Diário..."

# Navegar para o diretório do projeto
cd /Users/thais/Documents/radar-diario

# Criar diretório de backup se não existir
mkdir -p backups

# Data do backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/backup_$BACKUP_DATE"

# Criar diretório do backup
mkdir -p "$BACKUP_DIR"

# Backup do arquivo .env (sem expor credenciais)
echo "🔐 Fazendo backup das configurações..."
cp .env "$BACKUP_DIR/.env.backup"

# Backup do package.json
echo "📦 Fazendo backup do package.json..."
cp package.json "$BACKUP_DIR/"

# Backup dos logs
echo "📋 Fazendo backup dos logs..."
mkdir -p "$BACKUP_DIR/logs"
cp -r logs/ "$BACKUP_DIR/" 2>/dev/null || echo "Nenhum log encontrado"

# Backup do código fonte
echo "💻 Fazendo backup do código..."
cp -r src/ "$BACKUP_DIR/"

# Backup das configurações do PM2
echo "⚙️ Fazendo backup das configurações do PM2..."
pm2 save
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/" 2>/dev/null || echo "PM2 não configurado"

# Comprimir backup
echo "🗜️ Comprimindo backup..."
cd backups
tar -czf "backup_$BACKUP_DATE.tar.gz" "backup_$BACKUP_DATE"
rm -rf "backup_$BACKUP_DATE"

# Manter apenas os últimos 7 backups
echo "🧹 Limpando backups antigos..."
ls -t backup_*.tar.gz | tail -n +8 | xargs rm -f

echo "✅ Backup concluído: backup_$BACKUP_DATE.tar.gz"
echo "📁 Localização: $(pwd)/backup_$BACKUP_DATE.tar.gz"

# Log do backup
echo "$(date): Backup executado - backup_$BACKUP_DATE.tar.gz" >> logs/backup.log
