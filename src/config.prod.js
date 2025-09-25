// Configuração para produção (Railway)
export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  google: {
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    sheetId: process.env.GOOGLE_SHEET_ID,
  },
  system: {
    timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
    summaryHour: parseInt(process.env.SUMMARY_HOUR) || 18,
    ownerChatId: process.env.OWNER_CHAT_ID,
  },
};

// Validação das variáveis obrigatórias
const requiredVars = [
  'TELEGRAM_BOT_TOKEN',
  'GOOGLE_PROJECT_ID',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEET_ID',
  'OWNER_CHAT_ID',
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n📝 Configure as variáveis no Railway Dashboard.');
  process.exit(1);
}
