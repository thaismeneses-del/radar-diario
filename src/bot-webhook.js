// Bot com webhook para resolver problemas de long polling
import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { logger } from './logger.js';
import { parseMessage } from './parsing.js';
import GoogleSheetsService from './sheets.js';

class TelegramBotWebhook {
  constructor() {
    this.bot = new Telegraf(config.telegram.botToken);
    this.sheetsService = new GoogleSheetsService();
    
    // Middleware de debug
    this.bot.use((ctx, next) => {
      logger.info('Mensagem recebida pelo webhook:', {
        type: ctx.updateType,
        messageId: ctx.message?.message_id,
        text: ctx.message?.text,
        from: ctx.from?.username
      });
      return next();
    });
    
    this.setupCommands();
    this.setupMessageHandlers();
  }

  setupCommands() {
    // Comando /start
    this.bot.start(async (ctx) => {
      try {
        logger.info('Comando /start iniciado');
        
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

Vamos começar! 🚀`;

        logger.info('Enviando mensagem de boas-vindas');
        logger.info('Conteúdo da mensagem:', { messageLength: message.length });
        logger.info('Contexto:', { chatId: ctx.chat?.id, userId: ctx.from?.id });
        
        logger.info('Tentando enviar mensagem...');
        const result = await ctx.reply(message, { parse_mode: 'Markdown' });
        logger.info('Mensagem enviada com sucesso:', { messageId: result.message_id });
        logger.info('Comando /start executado com sucesso');
      } catch (error) {
        logger.error('Erro no comando /start:', error);
        logger.error('Stack trace:', error.stack);
        try {
          await ctx.reply('❌ Erro ao executar comando /start.');
        } catch (replyError) {
          logger.error('Erro ao enviar resposta de erro:', replyError);
        }
      }
    });

    // Comando /pendentes
    this.bot.command('pendentes', async (ctx) => {
      try {
        logger.info('Comando /pendentes executado');
        const demands = await this.sheetsService.getOpenDemands();
        const limitedDemands = demands.slice(0, 10);
        
        if (limitedDemands.length === 0) {
          await ctx.reply('✅ Nenhuma tarefa pendente encontrada!');
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

        await ctx.reply(message, { parse_mode: 'Markdown' });
        logger.info('Comando /pendentes executado com sucesso');
      } catch (error) {
        logger.error('Erro no comando pendentes:', error);
        try {
          await ctx.reply('❌ Erro ao buscar tarefas pendentes.');
        } catch (replyError) {
          logger.error('Erro ao enviar resposta de erro:', replyError);
        }
      }
    });

    // Comando /hoje
    this.bot.command('hoje', async (ctx) => {
      try {
        const today = new Date().toLocaleDateString('pt-BR');
        const demands = await this.sheetsService.getUpcomingDeadlines();
        const todayDemands = demands.filter(demand => {
          const deadline = new Date(demand['Prazo ISO']);
          const deadlineDate = deadline.toLocaleDateString('pt-BR');
          return deadlineDate === today;
        });

        if (todayDemands.length === 0) {
          ctx.reply(`✅ Nenhum vencimento para hoje (${today})!`);
          return;
        }

        let message = `📅 *Vencimentos de Hoje* (${today})\n\n`;
        
        todayDemands.forEach((demand, index) => {
          message += `${index + 1}. ${demand['Resumo']}\n`;
          message += `   🏷️ ${demand['Prioridade']} | 📊 ${demand['Status']}\n`;
          if (demand['Projeto/Cliente']) message += `   🏢 ${demand['Projeto/Cliente']}\n`;
          message += '\n';
        });

        ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Erro no comando hoje:', error);
        ctx.reply('❌ Erro ao buscar vencimentos de hoje.');
      }
    });

    // Comando /sem_prazo
    this.bot.command('sem_prazo', async (ctx) => {
      try {
        const demands = await this.sheetsService.getDemandsWithoutDeadline();
        const limitedDemands = demands.slice(0, 10);
        
        if (limitedDemands.length === 0) {
          ctx.reply('✅ Nenhum item sem prazo encontrado!');
          return;
        }

        let message = `📋 *Itens Sem Prazo* (${limitedDemands.length})\n\n`;
        
        limitedDemands.forEach((demand, index) => {
          message += `${index + 1}. ${demand['Resumo']}\n`;
          message += `   🏷️ ${demand['Prioridade']} | 📊 ${demand['Status']}\n`;
          if (demand['Projeto/Cliente']) message += `   🏢 ${demand['Projeto/Cliente']}\n`;
          message += '\n';
        });

        ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Erro no comando sem_prazo:', error);
        ctx.reply('❌ Erro ao buscar itens sem prazo.');
      }
    });

    // Comando /aguardando
    this.bot.command('aguardando', async (ctx) => {
      try {
        const demands = await this.sheetsService.getWaitingDemands();
        const limitedDemands = demands.slice(0, 10);
        
        if (limitedDemands.length === 0) {
          ctx.reply('✅ Nenhum item aguardando terceiros!');
          return;
        }

        let message = `⏳ *Aguardando Terceiros* (${limitedDemands.length})\n\n`;
        
        limitedDemands.forEach((demand, index) => {
          const prazo = demand['Prazo BR'] || '—';
          message += `${index + 1}. ${demand['Resumo']}\n`;
          message += `   📅 ${prazo} | 🏷️ ${demand['Prioridade']}\n`;
          if (demand['Projeto/Cliente']) message += `   🏢 ${demand['Projeto/Cliente']}\n`;
          message += '\n';
        });

        ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Erro no comando aguardando:', error);
        ctx.reply('❌ Erro ao buscar itens aguardando terceiros.');
      }
    });

    // Comando /resumo
    this.bot.command('resumo', async (ctx) => {
      try {
        const summary = await this.generateSummary();
        ctx.reply(summary, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.error('Erro no comando resumo:', error);
        ctx.reply('❌ Erro ao gerar resumo.');
      }
    });
  }

  setupMessageHandlers() {
    // Handler para mensagens de texto
    this.bot.on('text', async (ctx) => {
      try {
        logger.info('Mensagem recebida pelo webhook:', { 
          text: ctx.message.text, 
          from: ctx.from.username,
          messageId: ctx.message.message_id 
        });

        const messageId = ctx.message.message_id;
        const text = ctx.message.text;
        const from = ctx.from;

        // Verificar se a mensagem já foi registrada
        const exists = await this.sheetsService.checkMessageExists(messageId);
        if (exists) {
          logger.info('Mensagem duplicada detectada:', messageId);
          await ctx.reply('ℹ️ Esta mensagem já foi registrada anteriormente.');
          return;
        }

        // Parse da mensagem
        const parsed = parseMessage(text);
        logger.info('Mensagem parseada:', parsed);
        
        // Dados para a planilha
        const demandData = {
          messageId,
          remetente: `${from.first_name} ${from.last_name || ''}`.trim(),
          conteudoOriginal: text,
          ...parsed
        };

        // Registrar na planilha
        await this.sheetsService.registerDemand(demandData);
        logger.info('Demanda registrada com sucesso:', { messageId });

        // Resposta de confirmação
        const prazoText = parsed.prazoBR || '—';
        const response = `✅ *Radar Diário registrou sua demanda*

• *Resumo:* ${parsed.resumo}
• *Prazo:* ${prazoText}
• *Prioridade:* ${parsed.prioridade}
• *Status:* ${parsed.status}`;

        await ctx.reply(response, { parse_mode: 'Markdown' });
        logger.info('Resposta enviada com sucesso');

      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        try {
          await ctx.reply('❌ Erro ao processar sua demanda. Tente novamente.');
        } catch (replyError) {
          logger.error('Erro ao enviar resposta de erro:', replyError);
        }
      }
    });
  }

  async generateSummary() {
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const todayDemands = await this.sheetsService.getTodayDemands();
      const noDeadlineDemands = await this.sheetsService.getDemandsWithoutDeadline();
      const upcomingDemands = await this.sheetsService.getUpcomingDeadlines();
      const waitingDemands = await this.sheetsService.getWaitingDemands();

      let message = `📡 *Radar Diário — ${today}*\n\n`;
      message += `• *Novas demandas:* ${todayDemands.length}\n`;
      message += `• *Sem prazo:* ${noDeadlineDemands.length}\n`;
      
      if (upcomingDemands.length > 0) {
        message += `• *Próximos vencimentos (3 dias):*\n`;
        upcomingDemands.forEach(demand => {
          const prazo = demand['Prazo BR'];
          const projeto = demand['Projeto/Cliente'] || '';
          message += `  - ${prazo}: ${demand['Resumo']} ${projeto ? `[${projeto}]` : ''}\n`;
        });
      }
      
      message += `• *Aguardando terceiros:* ${waitingDemands.length}`;

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
    }
  }

  start() {
    try {
      // Usar long polling com configurações específicas
      this.bot.launch({
        dropPendingUpdates: true,
        allowedUpdates: ['message', 'callback_query']
      });
      
      logger.info('Bot do Telegram (webhook) iniciado com sucesso');
      logger.info('Bot aguardando mensagens...');
      
    } catch (error) {
      logger.error('Erro ao iniciar bot:', error);
      throw error;
    }
  }
}

export default TelegramBotWebhook;
