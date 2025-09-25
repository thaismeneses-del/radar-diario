import { google } from 'googleapis';
import { config } from './config.js';
import { logger, sheetsLogger } from './logger.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = config.system.timezone;

// Cache in-memory para idempotência (5 minutos)
const messageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para retry exponencial
async function withRetry(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = error.code === 429 || 
                         error.code >= 500 || 
                         error.message?.includes('timeout');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      sheetsLogger('retry', { attempt, delay, error: error.message }).warn('Retryando operação');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

class GoogleSheetsService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.google.clientEmail,
        private_key: config.google.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Verifica se uma mensagem já foi registrada (idempotência com cache)
   */
  async checkMessageExists(messageId) {
    const cacheKey = `msg_${messageId}`;
    const cached = messageCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      sheetsLogger('cache_hit', { messageId }).info('Mensagem encontrada no cache');
      return cached.exists;
    }

    try {
      const response = await withRetry(() => 
        this.sheets.spreadsheets.values.get({
          spreadsheetId: config.google.sheetId,
          range: 'Demandas!M:M', // Coluna ID Mensagem
        })
      );

      const values = response.data.values || [];
      const exists = values.some(row => row[0] === messageId.toString());
      
      // Atualizar cache
      messageCache.set(cacheKey, { exists, timestamp: Date.now() });
      
      sheetsLogger('check_message', { messageId, exists }).info('Verificação de idempotência');
      return exists;
    } catch (error) {
      sheetsLogger('check_message_error', { messageId, error: error.message }).error('Erro ao verificar mensagem existente');
      return false;
    }
  }

  /**
   * Registra uma nova demanda na planilha
   */
  async registerDemand(demandData) {
    const log = sheetsLogger('register_demand', { messageId: demandData.messageId });
    
    try {
      const timestamp = dayjs().tz(TIMEZONE).format('DD/MM/YYYY HH:mm:ss');

      const values = [
        timestamp,
        'Telegram', // Origem
        demandData.remetente,
        demandData.conteudoOriginal,
        demandData.resumo,
        demandData.prioridade,
        demandData.prazoISO,
        demandData.prazoBR,
        demandData.status,
        demandData.projeto,
        '', // Fonte
        demandData.messageId,
        '' // Observações
      ];

      await withRetry(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: config.google.sheetId,
          range: 'Demandas!A:M',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [values],
          },
        })
      );

      // Atualizar cache
      const cacheKey = `msg_${demandData.messageId}`;
      messageCache.set(cacheKey, { exists: true, timestamp: Date.now() });

      log.info('Demanda registrada com sucesso');
    } catch (error) {
      log.error('Erro ao registrar demanda na planilha', { error: error.message });
      throw error;
    }
  }

  /**
   * Busca todas as demandas da planilha e as mapeia para objetos com cabeçalhos
   */
  async getDemandsByCriteria(criteria) {
    try {
      const response = await withRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: config.google.sheetId,
          range: 'Demandas!A:M', // Todas as colunas relevantes
        })
      );

      const values = response.data.values;
      if (!values || values.length === 0) {
        return [];
      }

      const headers = values[0];
      const dataRows = values.slice(1);

      return dataRows
        .map(row => {
          const demand = {};
          headers.forEach((header, index) => {
            demand[header] = row[index] || '';
          });
          return demand;
        })
        .filter(criteria);
    } catch (error) {
      sheetsLogger('get_demands_error', { error: error.message }).error('Erro ao buscar demandas');
      return [];
    }
  }

  /**
   * Busca demandas do dia atual
   */
  async getTodayDemands() {
    const today = dayjs().tz(TIMEZONE).format('DD/MM/YYYY');

    return this.getDemandsByCriteria(demand => {
      const demandDate = demand['Timestamp Recebido']?.split(' ')[0];
      return demandDate === today;
    });
  }

  /**
   * Busca demandas sem prazo
   */
  async getDemandsWithoutDeadline() {
    return this.getDemandsByCriteria(demand => {
      return !demand['Prazo ISO'] || demand['Prazo ISO'] === '';
    });
  }

  /**
   * Busca demandas com vencimento nos próximos 3 dias
   */
  async getUpcomingDeadlines() {
    const today = dayjs().tz(TIMEZONE).startOf('day');
    const threeDaysFromNow = dayjs().tz(TIMEZONE).add(3, 'day').endOf('day');

    return this.getDemandsByCriteria(demand => {
      if (!demand['Prazo ISO'] || demand['Prazo ISO'] === '') return false;

      const deadline = dayjs(demand['Prazo ISO']).tz(TIMEZONE);
      return deadline.isAfter(today) && deadline.isBefore(threeDaysFromNow);
    });
  }

  /**
   * Busca demandas vencendo hoje
   */
  async getTodayDeadlines() {
    const today = dayjs().tz(TIMEZONE).format('YYYY-MM-DD');

    sheetsLogger('get_today_deadlines', { today }).info('Buscando vencimentos para hoje');

    return this.getDemandsByCriteria(demand => {
      if (!demand['Prazo ISO'] || demand['Prazo ISO'] === '') return false;

      const isToday = demand['Prazo ISO'] === today;
      if (isToday) {
        sheetsLogger('today_deadline_found', { 
          resumo: demand['Resumo'], 
          prazoISO: demand['Prazo ISO'] 
        }).info('Demanda vencendo hoje encontrada');
      }

      return isToday;
    });
  }

  /**
   * Busca demandas aguardando terceiros
   */
  async getWaitingDemands() {
    return this.getDemandsByCriteria(demand => {
      return demand['Status'] === 'Aguardando terceiros';
    });
  }

  /**
   * Busca demandas abertas (não concluídas)
   */
  async getOpenDemands() {
    return this.getDemandsByCriteria(demand => {
      const status = demand['Status'];
      return status !== 'Concluído' && status !== 'Cancelado';
    });
  }

  /**
   * Busca demandas vencidas
   */
  async getOverdueDemands() {
    const today = dayjs().tz(TIMEZONE).startOf('day');

    return this.getDemandsByCriteria(demand => {
      if (!demand['Prazo ISO'] || demand['Prazo ISO'] === '') return false;

      const deadline = dayjs(demand['Prazo ISO']).tz(TIMEZONE).startOf('day');
      return deadline.isBefore(today) && demand['Status'] !== 'Concluído';
    });
  }

  /**
   * Teste de conectividade com a planilha
   */
  async healthCheck() {
    try {
      await withRetry(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId: config.google.sheetId,
        })
      );
      return { status: 'connected', message: 'Sheet conectada com sucesso' };
    } catch (error) {
      return { status: 'error', message: `Erro de conexão: ${error.message}` };
    }
  }
}

export default GoogleSheetsService;