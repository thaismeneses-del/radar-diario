# 🚀 Guia de Deploy - Radar Diário

Este guia apresenta as opções de deploy para o Radar Diário em diferentes plataformas.

## 📋 Pré-requisitos

- ✅ Código testado e funcionando localmente
- ✅ Variáveis de ambiente configuradas
- ✅ Google Sheet configurada e compartilhada
- ✅ Bot do Telegram criado e configurado

## 🌐 Opções de Deploy

### 1. 🚄 Railway (Recomendado - Mais Fácil)

**Vantagens:** Deploy automático, fácil configuração, gratuito para começar

#### Passo a passo:

1. **Criar conta no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Faça login com GitHub

2. **Conectar repositório:**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório do Radar Diário

3. **Configurar variáveis de ambiente:**
   - Vá em "Variables" no dashboard
   - Adicione todas as variáveis do `env.production.example`

4. **Deploy automático:**
   - Railway detecta automaticamente que é um projeto Node.js
   - O deploy acontece automaticamente

#### Comandos úteis:
```bash
# Instalar Railway CLI (opcional)
npm install -g @railway/cli

# Deploy manual
railway login
railway link
railway up
```

---

### 2. 🎨 Render (Alternativa Gratuita)

**Vantagens:** Plano gratuito generoso, interface amigável

#### Passo a passo:

1. **Criar conta no Render:**
   - Acesse [render.com](https://render.com)
   - Conecte com GitHub

2. **Criar Web Service:**
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório

3. **Configurações:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. **Variáveis de ambiente:**
   - Vá em "Environment"
   - Adicione todas as variáveis necessárias

---

### 3. 🖥️ VPS com PM2 (Mais Controle)

**Vantagens:** Controle total, custo fixo, performance dedicada

#### Passo a passo:

1. **Contratar VPS:**
   - DigitalOcean, Linode, AWS EC2
   - Ubuntu 20.04+ recomendado

2. **Configurar servidor:**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Git
sudo apt install git -y
```

3. **Deploy do código:**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/radar-diario.git
cd radar-diario

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.production.example .env
nano .env  # Editar com suas credenciais
```

4. **Iniciar com PM2:**
```bash
# Iniciar aplicação
npm run pm2:start

# Configurar para iniciar no boot
pm2 startup
pm2 save

# Verificar status
pm2 status
pm2 logs radar-diario
```

---

## 🔧 Configurações Específicas por Plataforma

### Railway
- **Port:** Railway define automaticamente
- **Health Check:** Automático
- **Logs:** Dashboard integrado

### Render
- **Port:** `process.env.PORT` (Render define)
- **Health Check:** `/health` endpoint
- **Logs:** Dashboard integrado

### VPS/PM2
- **Port:** Configurável (padrão: não necessário para bot)
- **Health Check:** PM2 monitora automaticamente
- **Logs:** `pm2 logs radar-diario`

---

## 🚨 Monitoramento e Manutenção

### Comandos úteis (VPS):
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs radar-diario

# Reiniciar aplicação
pm2 restart radar-diario

# Parar aplicação
pm2 stop radar-diario

# Monitor de recursos
pm2 monit
```

### Health Check:
- **Endpoint:** `/health` (se implementado)
- **Comando Telegram:** `/health`
- **Logs:** Verificar regularmente

---

## 🔐 Segurança

1. **Variáveis de ambiente:** Nunca commitar no Git
2. **Google Sheets:** Service Account com permissões mínimas
3. **Telegram Bot:** Token seguro
4. **VPS:** Firewall configurado, updates regulares

---

## 📞 Suporte

- **Logs:** Sempre verificar logs em caso de problemas
- **Telegram:** Comando `/debug_last` para último erro
- **Google Sheets:** Verificar permissões do Service Account
- **Rede:** Verificar conectividade com APIs externas

---

## ✅ Checklist Pós-Deploy

- [ ] Bot responde a `/start`
- [ ] Comando `/health` funciona
- [ ] Mensagens são registradas na planilha
- [ ] Resumo diário é enviado às 18:00
- [ ] Logs estão sendo gerados
- [ ] Monitoramento ativo

**🎉 Deploy concluído com sucesso!**
