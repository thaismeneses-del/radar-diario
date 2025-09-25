import * as chrono from 'chrono-node';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { CLIENTS, findClientByName } from './clients.js';

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Configurar timezone padrão
const TIMEZONE = config.system.timezone;

/**
 * Extrai prioridade do texto
 */
export function extractPriority(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('#urgente') || lowerText.includes('#alta')) {
    return 'Alta';
  }

  if (lowerText.includes('#baixa')) {
    return 'Baixa';
  }

  return 'Média';
}

/**
 * Extrai status do texto
 */
export function extractStatus(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('aguardando') ||
      lowerText.includes('depende') ||
      lowerText.includes('retorno do cliente') ||
      lowerText.includes('aprovação')) {
    return 'Aguardando terceiros';
  }

  if (lowerText.includes('em andamento') ||
      lowerText.includes('executando') ||
      lowerText.includes('fazendo')) {
    return 'Em andamento';
  }

  return 'Backlog';
}

/**
 * Extrai projeto/cliente do texto
 */
export function extractProject(text) {
  // Regex para capturar tags [.*?]
  const projectMatch = text.match(/\[([^\]]+)\]/);
  if (projectMatch) {
    const tagName = projectMatch[1];
    
    // Verificar se é um cliente conhecido
    const client = findClientByName(tagName);
    if (client) {
      logger.info('Cliente identificado', { 
        tag: tagName, 
        client: client.name,
        category: client.category 
      });
      return client.name;
    }
    
    // Se não for cliente conhecido, retornar o nome da tag
    logger.info('Cliente não cadastrado', { tag: tagName });
    return tagName;
  }

  return '';
}

/**
 * Extrai prazo do texto usando parser robusto
 */
export function extractDeadline(text) {
  try {
    const lowerText = text.toLowerCase();
    const now = dayjs().tz(TIMEZONE);

    // 1. Parsing manual para casos específicos
    if (lowerText.includes('amanhã') || lowerText.includes('amanha')) {
      const tomorrow = now.add(1, 'day');
      return {
        prazoISO: tomorrow.format('YYYY-MM-DD'),
        prazoBR: tomorrow.format('DD-MM-YYYY')
      };
    }

    if (lowerText.includes('hoje')) {
      return {
        prazoISO: now.format('YYYY-MM-DD'),
        prazoBR: now.format('DD-MM-YYYY')
      };
    }

    // 2. Parsing manual para "primeira quinzena"
    const primeiraQuinzenaMatch = text.match(/primeira quinzena de (\w+)/i);
    if (primeiraQuinzenaMatch) {
      const monthName = primeiraQuinzenaMatch[1].toLowerCase();
      const monthMap = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
        'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
        'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };

      if (monthMap[monthName] !== undefined) {
        const year = now.year();
        const month = monthMap[monthName];
        const day = 10; // Primeira quinzena = dia 10

        const parsedDate = dayjs.tz(`${year}-${month + 1}-${day}`, 'YYYY-M-D', TIMEZONE);
        return {
          prazoISO: parsedDate.format('YYYY-MM-DD'),
          prazoBR: parsedDate.format('DD-MM-YYYY')
        };
      }
    }

    // 3. Parsing manual para "segunda quinzena"
    const segundaQuinzenaMatch = text.match(/segunda quinzena de (\w+)/i);
    if (segundaQuinzenaMatch) {
      const monthName = segundaQuinzenaMatch[1].toLowerCase();
      const monthMap = {
        'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
        'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
        'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
      };

      if (monthMap[monthName] !== undefined) {
        const year = now.year();
        const month = monthMap[monthName];
        const day = 25; // Segunda quinzena = dia 25

        const parsedDate = dayjs.tz(`${year}-${month + 1}-${day}`, 'YYYY-M-D', TIMEZONE);
        return {
          prazoISO: parsedDate.format('YYYY-MM-DD'),
          prazoBR: parsedDate.format('DD-MM-YYYY')
        };
      }
    }

    // 4. Parsing manual para datas DD/MM e DD/MM/YYYY
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-based
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.year();
      
      // Ajustar ano se for 2 dígitos
      const fullYear = year < 100 ? 2000 + year : year;
      
      const parsedDate = dayjs.tz(`${fullYear}-${month + 1}-${day}`, 'YYYY-M-D', TIMEZONE);
      
      // Verificar se a data é válida
      if (parsedDate.isValid()) {
        return {
          prazoISO: parsedDate.format('YYYY-MM-DD'),
          prazoBR: parsedDate.format('DD-MM-YYYY')
        };
      }
    }

    // 5. Fallback para chrono-node
    const parsed = chrono.parseDate(text, now.toDate(), {
      timezone: TIMEZONE
    });

    if (parsed) {
      const parsedDate = dayjs(parsed).tz(TIMEZONE);
      return {
        prazoISO: parsedDate.format('YYYY-MM-DD'),
        prazoBR: parsedDate.format('DD-MM-YYYY')
      };
    }

    return { prazoISO: '', prazoBR: '' };
  } catch (error) {
    logger.error('Erro ao extrair prazo:', { error: error.message, text });
    return { prazoISO: '', prazoBR: '' };
  }
}

/**
 * Gera resumo da demanda
 */
export function generateSummary(text, prazoBR, projeto) {
  // Remove tags de prioridade e projeto do texto
  let cleanText = text
    .replace(/#(urgente|alta|baixa|media)/gi, '')
    .replace(/\[([^\]]+)\]/g, '')
    .trim();

  // Remove palavras de status
  cleanText = cleanText
    .replace(/(aguardando|depende|retorno do cliente|aprovação|em andamento|executando|fazendo)/gi, '')
    .trim();

  // Remove palavras de prazo
  cleanText = cleanText
    .replace(/(até|para|amanhã|hoje|primeira quinzena|segunda quinzena)/gi, '')
    .trim();

  // Limpa espaços extras
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  // Monta o resumo
  let resumo = cleanText;
  if (prazoBR) {
    resumo += ` (${prazoBR})`;
  }
  if (projeto) {
    resumo += ` [${projeto}]`;
  }

  return resumo;
}

/**
 * Parse completo de uma mensagem
 */
export function parseMessage(text) {
  const prioridade = extractPriority(text);
  const status = extractStatus(text);
  const projeto = extractProject(text);
  const { prazoISO, prazoBR } = extractDeadline(text);
  const resumo = generateSummary(text, prazoBR, projeto);

  logger.info('Mensagem parseada', {
    prioridade,
    status,
    projeto,
    prazoISO,
    prazoBR,
    resumo
  });

  return {
    prioridade,
    status,
    projeto,
    prazoISO,
    prazoBR,
    resumo,
    conteudoOriginal: text
  };
}