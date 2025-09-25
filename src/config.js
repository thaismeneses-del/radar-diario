import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Validação obrigatória de env vars
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'GOOGLE_PROJECT_ID', 
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEET_ID',
  'OWNER_CHAT_ID'
];

// Verificar se todas as variáveis obrigatórias estão presentes
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERRO: Variáveis de ambiente obrigatórias não encontradas:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n💡 Configure todas as variáveis no arquivo .env antes de iniciar o bot.');
  process.exit(1);
}

// Normalizar GOOGLE_PRIVATE_KEY (substituir \\n por \n)
const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return privateKey;
  return privateKey.replace(/\\n/g, '\n');
};

// Configurações do sistema
export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  google: {
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    sheetId: process.env.GOOGLE_SHEET_ID,
  },
  system: {
    timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
    summaryHour: parseInt(process.env.SUMMARY_HOUR) || 18,
    ownerChatId: process.env.OWNER_CHAT_ID,
  },
};

// Log de configuração carregada (sem dados sensíveis)
console.log('✅ Configuração carregada com sucesso');
console.log(`📅 Timezone: ${config.system.timezone}`);
console.log(`⏰ Resumo diário: ${config.system.summaryHour}:00`);
console.log(`📊 Sheet ID: ${config.google.sheetId ? 'Configurado' : 'Não configurado'}`);
console.log(`🤖 Bot Token: ${config.telegram.botToken ? 'Configurado' : 'Não configurado'}`);
console.log(`👤 Owner Chat ID: ${config.system.ownerChatId ? 'Configurado' : 'Não configurado'}`);