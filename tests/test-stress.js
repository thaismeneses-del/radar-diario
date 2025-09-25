// Teste de stress e carga do Radar Diário
import { parseMessage } from '../src/parsing.js';
import { logger } from '../src/logger.js';

console.log('🚀 Iniciando testes de stress...');

// Gerar mensagens de teste em massa
const generateTestMessages = (count) => {
  const messages = [];
  const projetos = ['[UGF]', '[UGOC]', '[UAC]', '[Sebrae SP]', '[Sebrae Nacional]'];
  const prioridades = ['#urgente', '#alta', '#baixa', ''];
  const status = ['aguardando', 'em andamento', 'executando', ''];
  const prazos = ['amanhã', 'até 05/10', 'primeira quinzena de outubro', 'segunda quinzena de outubro', ''];
  
  for (let i = 0; i < count; i++) {
    const projeto = projetos[Math.floor(Math.random() * projetos.length)];
    const prioridade = prioridades[Math.floor(Math.random() * prioridades.length)];
    const statusText = status[Math.floor(Math.random() * status.length)];
    const prazo = prazos[Math.floor(Math.random() * prazos.length)];
    
    const message = `Tarefa ${i + 1} ${statusText} ${prazo} ${projeto} ${prioridade}`.trim();
    messages.push(message);
  }
  
  return messages;
};

// Teste de performance
const testPerformance = async (messageCount) => {
  console.log(`\n⚡ Testando performance com ${messageCount} mensagens...`);
  
  const messages = generateTestMessages(messageCount);
  const startTime = Date.now();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const message of messages) {
    try {
      const result = parseMessage(message);
      if (result && result.resumo) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      errorCount++;
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const messagesPerSecond = (messageCount / duration) * 1000;
  
  console.log(`📊 Resultados:`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   ⏱️ Tempo: ${duration}ms`);
  console.log(`   🚀 Velocidade: ${messagesPerSecond.toFixed(2)} mensagens/segundo`);
  console.log(`   📈 Taxa de sucesso: ${((successCount / messageCount) * 100).toFixed(1)}%`);
  
  return {
    successCount,
    errorCount,
    duration,
    messagesPerSecond,
    successRate: (successCount / messageCount) * 100
  };
};

// Teste de memória
const testMemoryUsage = () => {
  console.log(`\n💾 Testando uso de memória...`);
  
  const initialMemory = process.memoryUsage();
  console.log(`   Memória inicial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // Processar muitas mensagens
  const messages = generateTestMessages(1000);
  const results = [];
  
  for (const message of messages) {
    try {
      const result = parseMessage(message);
      results.push(result);
    } catch (error) {
      // Ignorar erros para teste de memória
    }
  }
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  console.log(`   Memória final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Aumento de memória: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Resultados processados: ${results.length}`);
  
  return {
    initialMemory: initialMemory.heapUsed,
    finalMemory: finalMemory.heapUsed,
    memoryIncrease,
    resultsCount: results.length
  };
};

// Teste de concorrência
const testConcurrency = async (concurrentCount) => {
  console.log(`\n🔄 Testando concorrência com ${concurrentCount} operações simultâneas...`);
  
  const messages = generateTestMessages(concurrentCount);
  const startTime = Date.now();
  
  const promises = messages.map(async (message, index) => {
    try {
      const result = parseMessage(message);
      return { index, success: true, result };
    } catch (error) {
      return { index, success: false, error: error.message };
    }
  });
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;
  const duration = endTime - startTime;
  
  console.log(`📊 Resultados de concorrência:`);
  console.log(`   ✅ Sucessos: ${successCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   ⏱️ Tempo: ${duration}ms`);
  console.log(`   📈 Taxa de sucesso: ${((successCount / concurrentCount) * 100).toFixed(1)}%`);
  
  return {
    successCount,
    errorCount,
    duration,
    successRate: (successCount / concurrentCount) * 100
  };
};

// Executar todos os testes
const runAllTests = async () => {
  console.log('🧪 INICIANDO TESTES DE STRESS E CARGA\n');
  
  try {
    // Teste 1: Performance com diferentes volumes
    const test1 = await testPerformance(100);
    const test2 = await testPerformance(500);
    const test3 = await testPerformance(1000);
    
    // Teste 2: Uso de memória
    const memoryTest = testMemoryUsage();
    
    // Teste 3: Concorrência
    const concurrencyTest = await testConcurrency(50);
    
    // Resumo final
    console.log(`\n📊 RESUMO FINAL DOS TESTES:`);
    console.log(`   🚀 Performance (100 msg): ${test1.messagesPerSecond.toFixed(2)} msg/s`);
    console.log(`   🚀 Performance (500 msg): ${test2.messagesPerSecond.toFixed(2)} msg/s`);
    console.log(`   🚀 Performance (1000 msg): ${test3.messagesPerSecond.toFixed(2)} msg/s`);
    console.log(`   💾 Memória: ${(memoryTest.memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   🔄 Concorrência: ${concurrencyTest.successRate.toFixed(1)}% sucesso`);
    
    // Avaliação
    const avgPerformance = (test1.messagesPerSecond + test2.messagesPerSecond + test3.messagesPerSecond) / 3;
    const avgSuccessRate = (test1.successRate + test2.successRate + test3.successRate) / 3;
    
    console.log(`\n🎯 AVALIAÇÃO:`);
    console.log(`   📈 Performance média: ${avgPerformance.toFixed(2)} msg/s`);
    console.log(`   📈 Taxa de sucesso média: ${avgSuccessRate.toFixed(1)}%`);
    
    if (avgPerformance > 100 && avgSuccessRate > 95) {
      console.log(`   ✅ SISTEMA APROVADO PARA PRODUÇÃO`);
    } else if (avgPerformance > 50 && avgSuccessRate > 90) {
      console.log(`   ⚠️ SISTEMA ACEITÁVEL, MAS PODE PRECISAR DE OTIMIZAÇÃO`);
    } else {
      console.log(`   ❌ SISTEMA NÃO APROVADO - NECESSÁRIAS CORREÇÕES`);
    }
    
  } catch (error) {
    console.error(`❌ Erro durante os testes: ${error.message}`);
  }
};

// Executar testes
runAllTests();
