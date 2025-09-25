// Teste de integração com Google Sheets
import GoogleSheetsService from '../src/sheets.js';
import { parseMessage } from '../src/parsing.js';
import { logger } from '../src/logger.js';

console.log('🔗 Iniciando testes de integração...');

// Teste de conectividade
const testConnectivity = async () => {
  console.log(`\n📡 Testando conectividade com Google Sheets...`);
  
  try {
    const sheetsService = new GoogleSheetsService();
    
    // Teste 1: Verificar se consegue acessar a planilha
    console.log(`   🧪 Teste 1: Acesso à planilha`);
    const testMessageId = `test_${Date.now()}`;
    const exists = await sheetsService.checkMessageExists(testMessageId);
    console.log(`   ✅ Conectividade OK - Mensagem não existe (esperado)`);
    
    // Teste 2: Verificar estrutura da planilha
    console.log(`   🧪 Teste 2: Estrutura da planilha`);
    const demands = await sheetsService.getOpenDemands();
    console.log(`   ✅ Estrutura OK - ${demands.length} demandas encontradas`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Erro de conectividade: ${error.message}`);
    return false;
  }
};

// Teste de registro de demanda
const testDemandRegistration = async () => {
  console.log(`\n📝 Testando registro de demanda...`);
  
  try {
    const sheetsService = new GoogleSheetsService();
    
    // Criar demanda de teste
    const testMessage = "Teste de integração até 30/09 [UGF] #urgente";
    const parsed = parseMessage(testMessage);
    
    const demandData = {
      messageId: `test_${Date.now()}`,
      remetente: "Teste de Integração",
      conteudoOriginal: testMessage,
      ...parsed
    };
    
    console.log(`   🧪 Registrando demanda de teste...`);
    const success = await sheetsService.registerDemand(demandData);
    
    if (success) {
      console.log(`   ✅ Demanda registrada com sucesso`);
      
      // Verificar se foi registrada
      console.log(`   🧪 Verificando se foi registrada...`);
      const exists = await sheetsService.checkMessageExists(demandData.messageId);
      
      if (exists) {
        console.log(`   ✅ Demanda confirmada na planilha`);
        return true;
      } else {
        console.log(`   ❌ Demanda não encontrada na planilha`);
        return false;
      }
    } else {
      console.log(`   ❌ Falha ao registrar demanda`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no registro: ${error.message}`);
    return false;
  }
};

// Teste de busca de demandas
const testDemandSearch = async () => {
  console.log(`\n🔍 Testando busca de demandas...`);
  
  try {
    const sheetsService = new GoogleSheetsService();
    
    // Teste 1: Buscar demandas abertas
    console.log(`   🧪 Teste 1: Demandas abertas`);
    const openDemands = await sheetsService.getOpenDemands();
    console.log(`   ✅ ${openDemands.length} demandas abertas encontradas`);
    
    // Teste 2: Buscar demandas sem prazo
    console.log(`   🧪 Teste 2: Demandas sem prazo`);
    const noDeadline = await sheetsService.getDemandsWithoutDeadline();
    console.log(`   ✅ ${noDeadline.length} demandas sem prazo encontradas`);
    
    // Teste 3: Buscar demandas aguardando
    console.log(`   🧪 Teste 3: Demandas aguardando terceiros`);
    const waiting = await sheetsService.getWaitingDemands();
    console.log(`   ✅ ${waiting.length} demandas aguardando encontradas`);
    
    // Teste 4: Buscar vencimentos próximos
    console.log(`   🧪 Teste 4: Vencimentos próximos`);
    const upcoming = await sheetsService.getUpcomingDeadlines();
    console.log(`   ✅ ${upcoming.length} vencimentos próximos encontrados`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Erro na busca: ${error.message}`);
    return false;
  }
};

// Teste de idempotência
const testIdempotency = async () => {
  console.log(`\n🔄 Testando idempotência...`);
  
  try {
    const sheetsService = new GoogleSheetsService();
    
    const testMessageId = `idempotency_test_${Date.now()}`;
    const testMessage = "Teste de idempotência [UGF]";
    const parsed = parseMessage(testMessage);
    
    const demandData = {
      messageId: testMessageId,
      remetente: "Teste de Idempotência",
      conteudoOriginal: testMessage,
      ...parsed
    };
    
    // Primeiro registro
    console.log(`   🧪 Primeiro registro...`);
    const firstResult = await sheetsService.registerDemand(demandData);
    console.log(`   ${firstResult ? '✅' : '❌'} Primeiro registro: ${firstResult ? 'Sucesso' : 'Falha'}`);
    
    // Verificar se existe
    console.log(`   🧪 Verificando existência...`);
    const exists = await sheetsService.checkMessageExists(testMessageId);
    console.log(`   ${exists ? '✅' : '❌'} Mensagem existe: ${exists}`);
    
    // Tentar registrar novamente (deve falhar)
    console.log(`   🧪 Tentativa de registro duplicado...`);
    const secondResult = await sheetsService.registerDemand(demandData);
    console.log(`   ${!secondResult ? '✅' : '❌'} Segundo registro: ${secondResult ? 'Sucesso (ERRO!)' : 'Falha (esperado)'}`);
    
    return firstResult && exists && !secondResult;
    
  } catch (error) {
    console.log(`   ❌ Erro na idempotência: ${error.message}`);
    return false;
  }
};

// Teste de performance da integração
const testIntegrationPerformance = async () => {
  console.log(`\n⚡ Testando performance da integração...`);
  
  try {
    const sheetsService = new GoogleSheetsService();
    const startTime = Date.now();
    
    // Executar múltiplas operações
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(sheetsService.getOpenDemands());
      operations.push(sheetsService.getDemandsWithoutDeadline());
      operations.push(sheetsService.getWaitingDemands());
    }
    
    const results = await Promise.all(operations);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    const operationsPerSecond = (operations.length / duration) * 1000;
    
    console.log(`   📊 Resultados:`);
    console.log(`   ⏱️ Tempo: ${duration}ms`);
    console.log(`   🚀 Velocidade: ${operationsPerSecond.toFixed(2)} operações/segundo`);
    console.log(`   📈 Operações executadas: ${operations.length}`);
    
    return {
      duration,
      operationsPerSecond,
      operationsCount: operations.length
    };
    
  } catch (error) {
    console.log(`   ❌ Erro na performance: ${error.message}`);
    return false;
  }
};

// Executar todos os testes de integração
const runIntegrationTests = async () => {
  console.log('🧪 INICIANDO TESTES DE INTEGRAÇÃO\n');
  
  try {
    // Teste 1: Conectividade
    const connectivityTest = await testConnectivity();
    
    // Teste 2: Registro de demanda
    const registrationTest = await testDemandRegistration();
    
    // Teste 3: Busca de demandas
    const searchTest = await testDemandSearch();
    
    // Teste 4: Idempotência
    const idempotencyTest = await testIdempotency();
    
    // Teste 5: Performance
    const performanceTest = await testIntegrationPerformance();
    
    // Resumo final
    console.log(`\n📊 RESUMO DOS TESTES DE INTEGRAÇÃO:`);
    console.log(`   📡 Conectividade: ${connectivityTest ? '✅' : '❌'}`);
    console.log(`   📝 Registro: ${registrationTest ? '✅' : '❌'}`);
    console.log(`   🔍 Busca: ${searchTest ? '✅' : '❌'}`);
    console.log(`   🔄 Idempotência: ${idempotencyTest ? '✅' : '❌'}`);
    console.log(`   ⚡ Performance: ${performanceTest ? '✅' : '❌'}`);
    
    const allTestsPassed = connectivityTest && registrationTest && searchTest && idempotencyTest && performanceTest;
    
    if (allTestsPassed) {
      console.log(`\n🎉 TODOS OS TESTES DE INTEGRAÇÃO PASSARAM!`);
      console.log(`✅ Sistema aprovado para produção`);
    } else {
      console.log(`\n⚠️ ALGUNS TESTES DE INTEGRAÇÃO FALHARAM`);
      console.log(`❌ Revisar configurações antes do deploy`);
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error(`❌ Erro durante os testes de integração: ${error.message}`);
    return false;
  }
};

// Executar testes
runIntegrationTests();
