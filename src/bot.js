import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { logger, botLogger } from './logger.js';
import { parseMessage } from './parsing.js';
import GoogleSheetsService from './sheets.js';
import { CLIENTS, getClientsByCategory, getCategories } from './clients.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

class TelegramBot {
  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.sheetsService = new GoogleSheetsService();
    this.lastError = null; // Para debug

    // Middleware de debug e tratamento de erros
    this.bot.use((ctx, next) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'message_received', {
        type: ctx.updateType,
        text: ctx.message?.text,
        from: ctx.from?.username
      });
      
      log.info('Mensagem recebida');
      return next();
    });

    this.setupCommands();
    this.setupMessageHandlers();
  }

  /**
   * Função auxiliar para enviar mensagens com retry
   */
  async sendMessage(ctx, message, options = {}) {
    const messageId = ctx.message?.message_id;
    const log = botLogger(messageId, 'send_message');
    
    try {
      await ctx.reply(message, options);
      log.info('Mensagem enviada com sucesso');
    } catch (error) {
      log.error('Erro ao enviar mensagem', { error: error.message });
      this.lastError = error;
      
      // Tentar enviar mensagem simples sem formatação
      try {
        const simpleMessage = message.replace(/[*_`]/g, ''); // Remove formatação
        await ctx.reply(simpleMessage);
        log.info('Mensagem simples enviada como fallback');
      } catch (fallbackError) {
        log.error('Erro no fallback', { error: fallbackError.message });
        throw fallbackError;
      }
    }
  }

  setupCommands() {
    // Comando /start
    this.bot.start(async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'start_command');
      
      try {
        const message = `🤖 *Radar Diário*

Olá! Eu sou o bot que registra suas demandas automaticamente na planilha.

*Como usar:*
• Envie qualquer mensagem com suas demandas
• Use tags como #urgente, #alta, #baixa para prioridade
• Use [UGF], [UGOC], [UAC], [Sebrae SP], [Sebrae Nacional] para projetos
• Mencione prazos: "até 05/10", "amanhã", "primeira quinzena de outubro"

*Comandos disponíveis:*
/pendentes - Lista tarefas abertas
/hoje - Vencimentos do dia
/sem_prazo - Itens sem deadline
/aguardando - Aguardando terceiros
/resumo - Resumo imediato
/clientes - Lista clientes cadastrados
/health - Status do sistema
/debug_last - Último erro

Vamos começar! 🚀`;

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /start executado com sucesso');
      } catch (error) {
        log.error('Erro no comando /start', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '🤖 Radar Diário iniciado! Envie suas demandas.');
      }
    });

    // Comando /pendentes
    this.bot.command('pendentes', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'pendentes_command');
      
      try {
        log.info('Executando comando /pendentes');
        const demands = await this.sheetsService.getOpenDemands();
        const limitedDemands = demands.slice(0, 10);

        if (limitedDemands.length === 0) {
          await this.sendMessage(ctx, '✅ Nenhuma tarefa pendente encontrada!');
          return;
        }

        let message = `📋 *Tarefas Pendentes* (${limitedDemands.length})\n\n`;

        limitedDemands.forEach((demand, index) => {
          const prazo = demand['Prazo BR'] || '—';
          const projeto = demand['Projeto/Cliente'] || '';
          message += `${index + 1}. ${demand['Resumo']}\n`;
          message += `   📅 ${prazo} | 🏷️ ${demand['Prioridade']} | 📊 ${demand['Status']}\n`;
          if (projeto) message += `   🏢 ${projeto}\n`;
          message += '\n';
        });

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /pendentes executado com sucesso');
      } catch (error) {
        log.error('Erro no comando pendentes', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao buscar tarefas pendentes.');
      }
    });

    // Comando /hoje
    this.bot.command('hoje', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'hoje_command');
      
      try {
        const today = new Date().toLocaleDateString('pt-BR');
        log.info('Executando comando /hoje');
        const demands = await this.sheetsService.getTodayDeadlines();
        const limitedDemands = demands.slice(0, 10);

        if (limitedDemands.length === 0) {
          await this.sendMessage(ctx, `✅ Nenhuma tarefa vencendo hoje (${today})!`);
          return;
        }

        let message = `🗓️ *Vencimentos de Hoje* (${today})\n\n`;
        limitedDemands.forEach((demand, index) => {
          const projeto = demand['Projeto/Cliente'] || '';
          message += `${index + 1}. ${demand['Resumo']} ${projeto ? `[${projeto}]` : ''}\n`;
        });

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /hoje executado com sucesso');
      } catch (error) {
        log.error('Erro no comando hoje', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao buscar vencimentos de hoje.');
      }
    });

    // Comando /sem_prazo
    this.bot.command('sem_prazo', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'sem_prazo_command');
      
      try {
        log.info('Executando comando /sem_prazo');
        const demands = await this.sheetsService.getDemandsWithoutDeadline();
        const limitedDemands = demands.slice(0, 10);

        if (limitedDemands.length === 0) {
          await this.sendMessage(ctx, '✅ Nenhuma tarefa sem prazo encontrada!');
          return;
        }

        let message = `⏳ *Tarefas Sem Prazo* (${limitedDemands.length})\n\n`;
        limitedDemands.forEach((demand, index) => {
          const projeto = demand['Projeto/Cliente'] || '';
          message += `${index + 1}. ${demand['Resumo']} ${projeto ? `[${projeto}]` : ''}\n`;
        });

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /sem_prazo executado com sucesso');
      } catch (error) {
        log.error('Erro no comando sem_prazo', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao buscar tarefas sem prazo.');
      }
    });

    // Comando /aguardando
    this.bot.command('aguardando', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'aguardando_command');
      
      try {
        log.info('Executando comando /aguardando');
        const demands = await this.sheetsService.getWaitingDemands();
        const limitedDemands = demands.slice(0, 10);

        if (limitedDemands.length === 0) {
          await this.sendMessage(ctx, '✅ Nenhuma tarefa aguardando terceiros encontrada!');
          return;
        }

        let message = `⏳ *Tarefas Aguardando Terceiros* (${limitedDemands.length})\n\n`;
        limitedDemands.forEach((demand, index) => {
          const projeto = demand['Projeto/Cliente'] || '';
          message += `${index + 1}. ${demand['Resumo']} ${projeto ? `[${projeto}]` : ''}\n`;
        });

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /aguardando executado com sucesso');
      } catch (error) {
        log.error('Erro no comando aguardando', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao buscar tarefas aguardando terceiros.');
      }
    });

    // Comando /resumo
    this.bot.command('resumo', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'resumo_command');
      
      try {
        log.info('Executando comando /resumo');
        const summary = await this.generateSummary();
        await this.sendMessage(ctx, summary, { parse_mode: 'Markdown' });
        log.info('Comando /resumo executado com sucesso');
      } catch (error) {
        log.error('Erro no comando resumo', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao gerar resumo.');
      }
    });

    // Comando /health
    this.bot.command('health', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'health_command');
      
      try {
        const now = new Date().toLocaleString('pt-BR', { timeZone: config.system.timezone });
        const sheetHealth = await this.sheetsService.healthCheck();
        
        const message = `🏥 *Status do Sistema*

⏰ Hora local: ${now}
📊 Sheet: ${sheetHealth.status === 'connected' ? '✅ Conectada' : '❌ Erro'}
🔧 Env vars: ${Object.keys(config).length} configuradas
🌍 Timezone: ${config.system.timezone}

${sheetHealth.status === 'connected' ? '✅ Sistema funcionando normalmente' : `❌ ${sheetHealth.message}`}`;

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /health executado com sucesso');
      } catch (error) {
        log.error('Erro no comando health', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao verificar status do sistema.');
      }
    });

    // Comando /debug_last
    this.bot.command('debug_last', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'debug_last_command');
      
      try {
        if (!this.lastError) {
          await this.sendMessage(ctx, '✅ Nenhum erro registrado recentemente.');
          return;
        }

        const error = this.lastError;
        let suggestion = '';

        if (error.message?.includes('private key')) {
          suggestion = '💡 Verifique se GOOGLE_PRIVATE_KEY está com quebras de linha corretas (\\n)';
        } else if (error.message?.includes('permission')) {
          suggestion = '💡 Verifique se o Service Account tem permissão na planilha';
        } else if (error.message?.includes('chat_id')) {
          suggestion = '💡 Verifique se OWNER_CHAT_ID está correto';
        }

        const message = `🐛 *Último Erro*

📝 Erro: ${error.message}
⏰ Timestamp: ${new Date().toLocaleString('pt-BR')}
${suggestion ? `\n${suggestion}` : ''}`;

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /debug_last executado com sucesso');
      } catch (error) {
        log.error('Erro no comando debug_last', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao obter informações de debug.');
      }
    });

    // Comando /clientes
    this.bot.command('clientes', async (ctx) => {
      const messageId = ctx.message?.message_id;
      const log = botLogger(messageId, 'clientes_command');
      
      try {
        log.info('Executando comando /clientes');
        
        const categories = getCategories();
        let message = `🏢 *Clientes e Projetos Cadastrados*\n\n`;

        categories.forEach(category => {
          const clients = getClientsByCategory(category);
          message += `📂 *${category}*\n`;
          
          clients.forEach(client => {
            message += `• [${client.name}] - ${client.fullName}\n`;
            if (client.description) {
              message += `  _${client.description}_\n`;
            }
          });
          message += '\n';
        });

        message += `💡 *Como usar:*\n`;
        message += `Envie: "Tarefa importante [Nome do Cliente] #urgente"\n`;
        message += `Exemplo: "Relatório mensal [UGF] #alta"`;

        await this.sendMessage(ctx, message, { parse_mode: 'Markdown' });
        log.info('Comando /clientes executado com sucesso');
      } catch (error) {
        log.error('Erro no comando clientes', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao listar clientes.');
      }
    });
  }

  setupMessageHandlers() {
    // Handler para mensagens de texto
    this.bot.on('text', async (ctx) => {
      const messageId = ctx.message.message_id;
      const log = botLogger(messageId, 'text_message');
      
      try {
        log.info('Processando mensagem de texto', {
          text: ctx.message.text,
          from: ctx.from.username
        });

        const text = ctx.message.text;
        const from = ctx.from;

        // Verificar se a mensagem já foi registrada
        const exists = await this.sheetsService.checkMessageExists(messageId);
        if (exists) {
          log.info('Mensagem duplicada detectada');
          await this.sendMessage(ctx, 'ℹ️ Esta mensagem já foi registrada anteriormente.');
          return;
        }

        // Parse da mensagem
        const parsed = parseMessage(text);
        log.info('Mensagem parseada', parsed);

        // Dados para a planilha
        const demandData = {
          messageId,
          remetente: `${from.first_name} ${from.last_name || ''}`.trim(),
          conteudoOriginal: text,
          ...parsed
        };

        // Registrar na planilha
        await this.sheetsService.registerDemand(demandData);
        log.info('Demanda registrada com sucesso');

        // Resposta de confirmação padronizada
        const prazoText = parsed.prazoBR || '—';
        const response = `✅ *Radar Diário registrou sua demanda*

• *Resumo:* ${parsed.resumo}
• *Prazo:* ${prazoText}
• *Prioridade:* ${parsed.prioridade}
• *Status:* ${parsed.status}`;

        await this.sendMessage(ctx, response, { parse_mode: 'Markdown' });
        log.info('Resposta enviada com sucesso');

      } catch (error) {
        log.error('Erro ao processar mensagem', { error: error.message });
        this.lastError = error;
        await this.sendMessage(ctx, '❌ Erro ao processar sua demanda. Tente novamente.');
      }
    });
  }

  /**
   * Formata data para formato DD-MM
   */
  formatDateToDDMM(dateString) {
    if (!dateString || dateString === '—') return '—';
    
    try {
      // Se já está no formato DD-MM-YYYY, extrair DD-MM
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');
        return `${parts[0]}-${parts[1]}`;
      }
      
      // Se está no formato DD/MM/YYYY, converter para DD-MM
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        const parts = dateString.split('/');
        return `${parts[0]}-${parts[1]}`;
      }
      
      // Tentar parsear com dayjs
      const parsed = dayjs(dateString, 'DD-MM-YYYY', true);
      if (parsed.isValid()) {
        return parsed.format('DD-MM');
      }
      
      return dateString; // Retornar original se não conseguir converter
    } catch (error) {
      logger.warn('Erro ao formatar data:', { dateString, error: error.message });
      return dateString;
    }
  }

  async generateSummary() {
    try {
      // Obter dados das demandas
      const todayDemands = await this.sheetsService.getTodayDemands();
      const noDeadlineDemands = await this.sheetsService.getDemandsWithoutDeadline();
      const upcomingDemands = await this.sheetsService.getUpcomingDeadlines();
      const waitingDemands = await this.sheetsService.getWaitingDemands();

      // Formatar data atual no formato DD-MM
      const today = dayjs().tz(config.system.timezone);
      const dayMonth = today.format('DD-MM');

      // Construir mensagem com nova formatação
      let message = `📡 *Radar Diário — ${dayMonth}*\n\n`;
      
      // Bloco inicial de métricas
      message += `🆕 *Novas demandas:* ${todayDemands.length}\n`;
      message += `⏳ *Sem prazo:* ${noDeadlineDemands.length}\n`;
      message += `📌 *Aguardando terceiros:* ${waitingDemands.length}\n\n`;

      // Bloco de vencimentos
      if (upcomingDemands.length > 0) {
        message += `📅 *Próximos vencimentos (até 3 dias):*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        upcomingDemands.forEach(demand => {
          const prazoBR = demand['Prazo BR'] || '—';
          const resumo = demand['Resumo'] || 'Sem resumo';
          const projeto = demand['Projeto/Cliente'] || '';
          const status = demand['Status'] || 'Sem status';
          
          // Formatar prazo para DD-MM
          const prazoFormatado = this.formatDateToDDMM(prazoBR);
          
          message += `🔸 ${prazoFormatado} | ${resumo} ${projeto ? `[${projeto}]` : ''} | ${status}\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━━━`;
      } else {
        message += `✔️ *Nenhum vencimento nos próximos 3 dias.*`;
      }

      return message;
    } catch (error) {
      logger.error('Erro ao gerar resumo:', error);
      return '❌ Erro ao gerar resumo.';
    }
  }

  async sendSummaryToOwner() {
    try {
      const summary = await this.generateSummary();
      await this.bot.telegram.sendMessage(config.system.ownerChatId, summary, {
        parse_mode: 'Markdown'
      });
      logger.info('Resumo diário enviado com sucesso');
    } catch (error) {
      logger.error('Erro ao enviar resumo diário:', error);
      this.lastError = error;
    }
  }

  start() {
    try {
      // Configurar o bot com opções específicas
      this.bot.launch({
        dropPendingUpdates: true, // Ignorar mensagens antigas
        allowedUpdates: ['message', 'callback_query'] // Só processar mensagens e callbacks
      });

      logger.info('Bot do Telegram iniciado com sucesso');

      // Graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

      // Log de status
      logger.info('Bot aguardando mensagens...');

    } catch (error) {
      logger.error('Erro ao iniciar bot:', error);
      this.lastError = error;
      throw error;
    }
  }
}

export default TelegramBot;