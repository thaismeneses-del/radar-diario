FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S radar -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/

# Alterar propriedade dos arquivos
RUN chown -R radar:nodejs /app
USER radar

# Expor porta (se necessário)
EXPOSE 3000

# Usar dumb-init para tratamento correto de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicialização
CMD ["npm", "start"]
