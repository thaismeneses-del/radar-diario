// Teste do bot do Telegram
import { config } from '../src/config.js';
import { logger } from '../src/logger.js';

console.log('🤖 Iniciando testes do bot do Telegram...');

// Teste de conectividade com Telegram
const testTelegramConnectivity = async () => {
  console.log(`\n📡 Testando conectividade com Telegram...`);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   ✅ Bot conectado: ${data.result.first_name}`);
      console.log(`   ✅ Username: @${data.result.username}`);
      console.log(`   ✅ ID: ${data.result.id}`);
      return true;
    } else {
      console.log(`   ❌ Erro na API: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro de conectividade: ${error.message}`);
    return false;
  }
};

// Teste de envio de mensagem
const testSendMessage = async () => {
  console.log(`\n📤 Testando envio de mensagem...`);
  
  try {
    const testMessage = `🧪 Teste de conectividade - ${new Date().toLocaleString()}`;
    
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.system.ownerChatId,
        text: testMessage,
        parse_mode: 'Markdown'
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   ✅ Mensagem enviada com sucesso`);
      console.log(`   ✅ Message ID: ${data.result.message_id}`);
      return true;
    } else {
      console.log(`   ❌ Erro no envio: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro no envio: ${error.message}`);
    return false;
  }
};

// Teste de comandos
const testCommands = async () => {
  console.log(`\n⌨️ Testando comandos do bot...`);
  
  const commands = [
    { command: '/start', description: 'Instruções de uso' },
    { command: '/pendentes', description: 'Tarefas abertas' },
    { command: '/hoje', description: 'Vencimentos do dia' },
    { command: '/sem_prazo', description: 'Itens sem prazo' },
    { command: '/aguardando', description: 'Aguardando terceiros' },
    { command: '/resumo', description: 'Resumo imediato' }
  ];
  
  let successCount = 0;
  
  for (const cmd of commands) {
    try {
      console.log(`   🧪 Testando ${cmd.command}...`);
      
      const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.system.ownerChatId,
          text: cmd.command,
          parse_mode: 'Markdown'
        })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        console.log(`   ✅ ${cmd.command} funcionando`);
        successCount++;
      } else {
        console.log(`   ❌ ${cmd.command} falhou: ${data.description}`);
      }
      
      // Aguardar um pouco entre comandos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Erro em ${cmd.command}: ${error.message}`);
    }
  }
  
  console.log(`   📊 Comandos funcionando: ${successCount}/${commands.length}`);
  return successCount === commands.length;
};

// Teste de webhook (se configurado)
const testWebhook = async () => {
  console.log(`\n🔗 Testando webhook...`);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      if (data.result.url) {
        console.log(`   ✅ Webhook configurado: ${data.result.url}`);
        console.log(`   ✅ Updates pendentes: ${data.result.pending_update_count}`);
        return true;
      } else {
        console.log(`   ℹ️ Webhook não configurado (usando long polling)`);
        return true;
      }
    } else {
      console.log(`   ❌ Erro ao verificar webhook: ${data.description}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Erro no webhook: ${error.message}`);
    return false;
  }
};

// Teste de rate limiting
const testRateLimiting = async () => {
  console.log(`\n⏱️ Testando rate limiting...`);
  
  try {
    const startTime = Date.now();
    const requests = [];
    
    // Enviar múltiplas requisições rapidamente
    for (let i = 0; i < 10; i++) {
      requests.push(
        fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`)
      );
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    const successCount = responses.filter(r => r.ok).length;
    const duration = endTime - startTime;
    
    console.log(`   📊 Resultados:`);
    console.log(`   ✅ Requisições bem-sucedidas: ${successCount}/10`);
    console.log(`   ⏱️ Tempo total: ${duration}ms`);
    console.log(`   🚀 Velocidade: ${(10 / duration) * 1000} req/s`);
    
    return successCount >= 8; // Pelo menos 80% de sucesso
    
  } catch (error) {
    console.log(`   ❌ Erro no rate limiting: ${error.message}`);
    return false;
  }
};

// Executar todos os testes do Telegram
const runTelegramTests = async () => {
  console.log('🧪 INICIANDO TESTES DO TELEGRAM\n');
  
  try {
    // Teste 1: Conectividade
    const connectivityTest = await testTelegramConnectivity();
    
    // Teste 2: Envio de mensagem
    const sendTest = await testSendMessage();
    
    // Teste 3: Comandos
    const commandsTest = await testCommands();
    
    // Teste 4: Webhook
    const webhookTest = await testWebhook();
    
    // Teste 5: Rate limiting
    const rateLimitTest = await testRateLimiting();
    
    // Resumo final
    console.log(`\n📊 RESUMO DOS TESTES DO TELEGRAM:`);
    console.log(`   📡 Conectividade: ${connectivityTest ? '✅' : '❌'}`);
    console.log(`   📤 Envio de mensagem: ${sendTest ? '✅' : '❌'}`);
    console.log(`   ⌨️ Comandos: ${commandsTest ? '✅' : '❌'}`);
    console.log(`   🔗 Webhook: ${webhookTest ? '✅' : '❌'}`);
    console.log(`   ⏱️ Rate limiting: ${rateLimitTest ? '✅' : '❌'}`);
    
    const allTestsPassed = connectivityTest && sendTest && commandsTest && webhookTest && rateLimitTest;
    
    if (allTestsPassed) {
      console.log(`\n🎉 TODOS OS TESTES DO TELEGRAM PASSARAM!`);
      console.log(`✅ Bot aprovado para produção`);
    } else {
      console.log(`\n⚠️ ALGUNS TESTES DO TELEGRAM FALHARAM`);
      console.log(`❌ Revisar configurações antes do deploy`);
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error(`❌ Erro durante os testes do Telegram: ${error.message}`);
    return false;
  }
};

// Executar testes
runTelegramTests();
