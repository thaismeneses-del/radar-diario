# 🤖 Radar Diário

Bot do Telegram para capturar demandas e registrar automaticamente na Google Sheet com resumo diário automático.

## 🚀 Funcionalidades

- **Captura automática** de demandas via Telegram
- **Parsing inteligente** de prazos, prioridades e projetos
- **Registro automático** na Google Sheet
- **Resumo diário** às 18:00 (configurável)
- **Comandos úteis** para consulta de status
- **Idempotência** para evitar duplicatas
- **Logs estruturados** para monitoramento
- **Testes automatizados** com Jest

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta Google Cloud
- Bot do Telegram
- Planilha Google Sheets

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd radar-diario
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_aqui
OWNER_CHAT_ID=seu_chat_id_aqui

# Google Sheets
GOOGLE_PROJECT_ID=seu_project_id
GOOGLE_CLIENT_EMAIL=seu_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=seu_sheet_id

# Sistema
TIMEZONE=America/Sao_Paulo
SUMMARY_HOUR=18
```

## 🔧 Configuração

### 1. Criar Bot do Telegram

1. Acesse [@BotFather](https://t.me/botfather) no Telegram
2. Envie `/newbot`
3. Escolha um nome e username para o bot
4. Copie o token gerado para `TELEGRAM_BOT_TOKEN`

### 2. Obter Chat ID

1. Envie `/start` para o bot
2. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Copie o `id` do campo `from` para `OWNER_CHAT_ID`

### 3. Configurar Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Ative a **Google Sheets API**
4. Crie uma **Service Account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Nome: `radar-diario-bot`
   - Role: `Editor` (ou `Viewer` se só leitura)
5. Gere uma chave JSON:
   - Clique na Service Account → Keys → Add Key → Create New Key → JSON
   - Copie o conteúdo para as variáveis do `.env`

### 4. Configurar Google Sheet

1. Crie uma nova planilha no Google Sheets
2. Renomeie a primeira aba para "Demandas"
3. Configure as colunas na primeira linha:
   ```
   A: Timestamp Recebido
   B: Origem
   C: Remetente
   D: Conteúdo Original
   E: Resumo
   F: Prioridade
   G: Prazo ISO
   H: Prazo (BR)
   I: Status
   J: Projeto/Cliente
   K: Fonte
   L: ID Mensagem
   M: Observações
   ```
4. Compartilhe a planilha com o email da Service Account (permissão de Editor)
5. Copie o ID da planilha da URL para `GOOGLE_SHEET_ID`

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

## 📱 Comandos do Bot

- `/start` - Instruções de uso
- `/pendentes` - Lista tarefas abertas (máx. 10)
- `/hoje` - Vencimentos do dia
- `/sem_prazo` - Itens sem deadline (máx. 10)
- `/aguardando` - Aguardando terceiros (máx. 10)
- `/resumo` - Resumo imediato
- `/health` - Status do sistema
- `/debug_last` - Último erro registrado

## 🎯 Como Usar

### Enviar Demandas
Envie mensagens no formato:
```
[Projeto] Descrição da tarefa #prioridade até prazo
```

**Exemplos:**
- `Enviar relatório de conciliação até 05/10 [UGF] #urgente`
- `Revisar minuta de contrato amanhã [UGOC]`
- `Aguardando aprovação da OS 11/2025 pela área financeira [UGOC]`
- `Em andamento a revisão do RAT [UGF]`

### Tags de Prioridade
- `#urgente` ou `#alta` → Alta
- `#baixa` → Baixa
- Sem tag → Média

### Tags de Projeto
- `[UGF]` - UGF
- `[UGOC]` - UGOC  
- `[UAC]` - UAC
- `[Sebrae SP]` - Sebrae SP
- `[Sebrae Nacional]` - Sebrae Nacional

### Formatos de Prazo
- `05/10/2025` - Data específica
- `05/10` - Data no ano atual
- `amanhã` - D+1
- `hoje` - Data atual
- `primeira quinzena de outubro` - Dia 10
- `segunda quinzena de outubro` - Dia 25

## 🚨 Erros Comuns & Soluções

### ❌ "Variáveis de ambiente obrigatórias não encontradas"
**Problema:** Faltam variáveis no arquivo `.env`

**Solução:**
1. Verifique se o arquivo `.env` existe
2. Confirme se todas as variáveis obrigatórias estão preenchidas
3. Reinicie o bot após alterar o `.env`

### ❌ "Erro de conexão: invalid_grant"
**Problema:** `GOOGLE_PRIVATE_KEY` com formatação incorreta

**Solução:**
1. Abra o arquivo JSON da Service Account
2. Copie a chave `private_key` completa
3. No `.env`, use:
   ```env
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
   ```
4. **Importante:** Use `\n` (não `\\n`) para quebras de linha

### ❌ "Sheet: ❌ Erro de conexão"
**Problema:** Service Account sem permissão na planilha

**Solução:**
1. Abra a planilha no Google Sheets
2. Clique em "Compartilhar" (canto superior direito)
3. Adicione o email da Service Account
4. Defina permissão como "Editor"
5. Clique em "Enviar"

### ❌ "OWNER_CHAT_ID vazio"
**Problema:** Chat ID não configurado

**Solução:**
1. Envie `/start` para o bot
2. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Procure por `"from":{"id":123456789}`
4. Copie o número para `OWNER_CHAT_ID`

### ❌ "Fuso horário errado"
**Problema:** Resumos em horário incorreto

**Solução:**
1. Confirme no `.env`: `TIMEZONE=America/Sao_Paulo`
2. Verifique se o servidor está no timezone correto
3. Reinicie o bot após alterar

### ❌ "Bot não responde"
**Problema:** Token inválido ou bot desabilitado

**Solução:**
1. Verifique se o token está correto
2. Teste o bot em [@BotFather](https://t.me/botfather)
3. Use `/health` para verificar status
4. Verifique logs para erros específicos

## 📊 Monitoramento

### Logs Estruturados
O bot usa logs estruturados com Pino:
- **info**: Operações normais
- **warn**: Situações de atenção
- **error**: Erros que precisam investigação

### Comando /health
Verifica:
- ✅ Hora local
- ✅ Conexão com Google Sheets
- ✅ Variáveis de ambiente
- ✅ Status do sistema

### Comando /debug_last
Mostra:
- 🐛 Último erro registrado
- 💡 Sugestões de correção
- ⏰ Timestamp do erro

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm test parsing.test.js
npm test fixtures.test.js

# Com coverage
npm run test:coverage
```

### Fixtures de Teste
Os testes usam fixtures reais em `tests/fixtures.json`:
- Parsing de datas
- Extração de prioridades
- Identificação de projetos
- Validação de idempotência

## 🚀 Deploy

### Railway
1. Conecte o repositório ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático

### Render
1. Conecte o repositório ao Render
2. Configure as variáveis de ambiente
3. Deploy automático

### PM2 (VPS)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start src/index.js --name radar-diario

# Monitorar
pm2 monit

# Logs
pm2 logs radar-diario
```

## 📝 Estrutura do Projeto

```
radar-diario/
├── src/
│   ├── index.js          # Ponto de entrada
│   ├── config.js         # Configurações e validação
│   ├── logger.js         # Logs estruturados
│   ├── bot.js           # Bot do Telegram
│   ├── sheets.js        # Integração Google Sheets
│   ├── parsing.js       # Parser de mensagens
│   └── summary.js       # Agendador de resumos
├── tests/
│   ├── fixtures.json    # Dados de teste
│   ├── parsing.test.js  # Testes de parsing
│   └── fixtures.test.js # Testes com fixtures
├── package.json
├── .env.example
└── README.md
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente os testes
4. Execute `npm test`
5. Faça commit das mudanças
6. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do bot
2. Use `/health` e `/debug_last`
3. Consulte a seção "Erros Comuns"
4. Abra uma issue no repositório