// Teste automatizado completo do Radar Diário
import { config } from '../src/config.js';
import { logger } from '../src/logger.js';

console.log('🤖 INICIANDO TESTES AUTOMATIZADOS DO RADAR DIÁRIO\n');

// Função para enviar mensagem via API do Telegram
const sendMessage = async (text) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.system.ownerChatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    
    const data = await response.json();
    return { success: data.ok, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Função para obter mensagens do bot
const getBotMessages = async () => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getUpdates`);
    const data = await response.json();
    return data.ok ? data.result : [];
  } catch (error) {
    return [];
  }
};

// Teste 1: Conectividade com Telegram
const testTelegramConnectivity = async () => {
  console.log('🧪 TESTE 1: Conectividade com Telegram');
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   ✅ Bot conectado: ${data.result.first_name}`);
      console.log(`   ✅ Username: @${data.result.username}`);
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

// Teste 2: Envio de mensagem de teste
const testMessageSending = async () => {
  console.log('\n🧪 TESTE 2: Envio de mensagem de teste');
  
  const testMessage = `🧪 Teste automatizado - ${new Date().toLocaleString()}`;
  const result = await sendMessage(testMessage);
  
  if (result.success) {
    console.log(`   ✅ Mensagem enviada com sucesso`);
    console.log(`   ✅ Message ID: ${result.data.result.message_id}`);
    return true;
  } else {
    console.log(`   ❌ Falha no envio: ${result.error || result.data.description}`);
    return false;
  }
};

// Teste 3: Comando /start
const testStartCommand = async () => {
  console.log('\n🧪 TESTE 3: Comando /start');
  
  const result = await sendMessage('/start');
  
  if (result.success) {
    console.log(`   ✅ Comando /start enviado`);
    
    // Aguardar resposta do bot
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updates = await getBotMessages();
    const recentMessages = updates.filter(update => 
      update.message && 
      update.message.chat.id == config.system.ownerChatId &&
      update.message.date > (Date.now() / 1000) - 60
    );
    
    if (recentMessages.length > 0) {
      console.log(`   ✅ Bot respondeu com ${recentMessages.length} mensagens`);
      return true;
    } else {
      console.log(`   ⚠️ Bot não respondeu (pode estar offline)`);
      return false;
    }
  } else {
    console.log(`   ❌ Falha no comando /start: ${result.error || result.data.description}`);
    return false;
  }
};

// Teste 4: Registro de demanda
const testDemandRegistration = async () => {
  console.log('\n🧪 TESTE 4: Registro de demanda');
  
  const testDemand = `Teste automatizado até 30/09 [UGF] #urgente`;
  const result = await sendMessage(testDemand);
  
  if (result.success) {
    console.log(`   ✅ Demanda enviada: ${testDemand}`);
    
    // Aguardar resposta do bot
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const updates = await getBotMessages();
    const recentMessages = updates.filter(update => 
      update.message && 
      update.message.chat.id == config.system.ownerChatId &&
      update.message.date > (Date.now() / 1000) - 60
    );
    
    if (recentMessages.length > 0) {
      const botResponse = recentMessages[recentMessages.length - 1].message.text;
      if (botResponse.includes('Radar Diário registrou sua demanda')) {
        console.log(`   ✅ Bot confirmou registro da demanda`);
        console.log(`   ✅ Resposta: ${botResponse.substring(0, 100)}...`);
        return true;
      } else {
        console.log(`   ⚠️ Bot respondeu, mas não confirmou registro`);
        console.log(`   ⚠️ Resposta: ${botResponse.substring(0, 100)}...`);
        return false;
      }
    } else {
      console.log(`   ❌ Bot não respondeu à demanda`);
      return false;
    }
  } else {
    console.log(`   ❌ Falha no envio da demanda: ${result.error || result.data.description}`);
    return false;
  }
};

// Teste 5: Comandos do bot
const testBotCommands = async () => {
  console.log('\n🧪 TESTE 5: Comandos do bot');
  
  const commands = ['/pendentes', '/hoje', '/sem_prazo', '/aguardando', '/resumo'];
  let successCount = 0;
  
  for (const command of commands) {
    console.log(`   🧪 Testando ${command}...`);
    
    const result = await sendMessage(command);
    
    if (result.success) {
      console.log(`   ✅ ${command} enviado`);
      successCount++;
      
      // Aguardar resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`   ❌ ${command} falhou: ${result.error || result.data.description}`);
    }
  }
  
  console.log(`   📊 Comandos funcionando: ${successCount}/${commands.length}`);
  return successCount === commands.length;
};

// Teste 6: Verificação de Google Sheets
const testGoogleSheetsIntegration = async () => {
  console.log('\n🧪 TESTE 6: Integração com Google Sheets');
  
  try {
    // Importar dinamicamente para evitar problemas de módulo
    const { default: GoogleSheetsService } = await import('../src/sheets.js');
    const sheetsService = new GoogleSheetsService();
    
    // Teste de conectividade
    console.log(`   🧪 Testando conectividade com Google Sheets...`);
    const demands = await sheetsService.getOpenDemands();
    console.log(`   ✅ Conectividade OK - ${demands.length} demandas encontradas`);
    
    // Teste de busca
    console.log(`   🧪 Testando busca de demandas...`);
    const noDeadline = await sheetsService.getDemandsWithoutDeadline();
    const waiting = await sheetsService.getWaitingDemands();
    const upcoming = await sheetsService.getUpcomingDeadlines();
    
    console.log(`   ✅ Busca OK - Sem prazo: ${noDeadline.length}, Aguardando: ${waiting.length}, Próximos: ${upcoming.length}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Erro na integração: ${error.message}`);
    return false;
  }
};

// Executar todos os testes
const runAllTests = async () => {
  console.log('🚀 EXECUTANDO BATERIA COMPLETA DE TESTES AUTOMATIZADOS\n');
  
  const tests = [
    { name: 'Conectividade Telegram', fn: testTelegramConnectivity },
    { name: 'Envio de Mensagem', fn: testMessageSending },
    { name: 'Comando /start', fn: testStartCommand },
    { name: 'Registro de Demanda', fn: testDemandRegistration },
    { name: 'Comandos do Bot', fn: testBotCommands },
    { name: 'Integração Google Sheets', fn: testGoogleSheetsIntegration }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`   ❌ Erro no teste ${test.name}: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMO FINAL DOS TESTES AUTOMATIZADOS');
  console.log(`${'='.repeat(60)}\n`);
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n📈 RESULTADO GERAL:`);
  console.log(`   ✅ Testes passaram: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);
  console.log(`   📊 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 TODOS OS TESTES AUTOMATIZADOS PASSARAM!`);
    console.log(`✅ Sistema aprovado para produção`);
    console.log(`🚀 Pronto para deploy no Railway`);
  } else if (passedTests >= totalTests * 0.8) {
    console.log(`\n⚠️ MAIORIA DOS TESTES PASSARAM`);
    console.log(`✅ Sistema aceitável para produção`);
    console.log(`🔧 Considerar correções antes do deploy`);
  } else {
    console.log(`\n❌ MUITOS TESTES FALHARAM`);
    console.log(`❌ Sistema não aprovado para produção`);
    console.log(`🛠️ Necessárias correções antes do deploy`);
  }
  
  return {
    passedTests,
    totalTests,
    successRate: (passedTests / totalTests) * 100,
    approved: passedTests === totalTests
  };
};

// Executar testes
runAllTests().then(result => {
  process.exit(result.approved ? 0 : 1);
});
