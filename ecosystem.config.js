/**
 * Configuração PM2 para produção
 * 
 * Uso: pm2 start ecosystem.config.js
 */

export default {
  apps: [{
    name: 'radar-diario',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      // As variáveis de ambiente serão carregadas do .env
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
