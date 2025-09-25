import pino from 'pino';

// Configuração do logger estruturado
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  serializers: {
    // Remover dados sensíveis dos logs
    req: (req) => {
      if (!req) return req;
      return {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers?.['user-agent'],
          'content-type': req.headers?.['content-type']
        }
      };
    },
    res: (res) => {
      if (!res) return res;
      return {
        statusCode: res.statusCode
      };
    }
  }
});

// Função auxiliar para adicionar correlação ID
export const withCorrelationId = (correlationId) => {
  return logger.child({ correlationId });
};

// Função auxiliar para logs de bot
export const botLogger = (messageId, action, data = {}) => {
  return logger.child({ 
    messageId, 
    action,
    ...data 
  });
};

// Função auxiliar para logs de sheets
export const sheetsLogger = (operation, data = {}) => {
  return logger.child({ 
    service: 'sheets',
    operation,
    ...data 
  });
};

// Função auxiliar para logs de cron
export const cronLogger = (job, data = {}) => {
  return logger.child({ 
    service: 'cron',
    job,
    ...data 
  });
};

export { logger };