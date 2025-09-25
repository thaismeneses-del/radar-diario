import cron from 'node-cron';
import { config } from './config.js';
import { logger, cronLogger } from './logger.js';

class SummaryScheduler {
  constructor() {
    this.bot = null;
    this.cronJob = null;
    this.isRunning = false;
  }

  setBot(bot) {
    this.bot = bot;
  }

  start() {
    try {
      // Validar hora do resumo
      const summaryHour = config.system.summaryHour;
      if (summaryHour < 0 || summaryHour > 23) {
        throw new Error(`Hora do resumo inválida: ${summaryHour}. Deve estar entre 0 e 23.`);
      }

      // Configurar timezone
      process.env.TZ = config.system.timezone;

      // Cron expression: 0 ${SUMMARY_HOUR} * * * (todos os dias na hora especificada)
      const cronExpression = `0 ${summaryHour} * * *`;
      
      const log = cronLogger('summary_scheduler', { 
        cronExpression, 
        timezone: config.system.timezone,
        summaryHour 
      });

      log.info('Configurando agendador de resumo diário');

      // Validar expressão cron
      if (!cron.validate(cronExpression)) {
        throw new Error(`Expressão cron inválida: ${cronExpression}`);
      }

      this.cronJob = cron.schedule(cronExpression, async () => {
        if (this.isRunning) {
          log.warn('Resumo já está sendo executado, pulando execução');
          return;
        }

        this.isRunning = true;
        const executionLog = cronLogger('summary_execution', { 
          timestamp: new Date().toISOString() 
        });

        try {
          executionLog.info('Iniciando resumo diário');
          
          if (!this.bot) {
            throw new Error('Bot não configurado');
          }

          await this.bot.sendSummaryToOwner();
          executionLog.info('Resumo diário executado com sucesso');
        } catch (error) {
          executionLog.error('Erro ao executar resumo diário', { 
            error: error.message 
          });
        } finally {
          this.isRunning = false;
        }
      }, {
        scheduled: true,
        timezone: config.system.timezone
      });

      log.info(`Resumo diário agendado para ${summaryHour}:00 (${config.system.timezone})`);
      logger.info(`📅 Resumo diário agendado para ${summaryHour}:00 (${config.system.timezone})`);

    } catch (error) {
      const log = cronLogger('summary_scheduler_error', { error: error.message });
      log.error('Erro ao configurar agendador de resumo');
      throw error;
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Agendador de resumo parado');
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob !== null,
      summaryHour: config.system.summaryHour,
      timezone: config.system.timezone
    };
  }
}

export default SummaryScheduler;