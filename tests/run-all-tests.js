// Script para executar todos os testes
import { spawn } from 'child_process';
import { logger } from '../src/logger.js';

console.log('🧪 EXECUTANDO TODOS OS TESTES DO RADAR DIÁRIO\n');

// Função para executar um teste
const runTest = (testName, testFile) => {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🧪 EXECUTANDO: ${testName}`);
    console.log(`${'='.repeat(50)}\n`);
    
    const child = spawn('node', [testFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testName} - CONCLUÍDO COM SUCESSO`);
        resolve(true);
      } else {
        console.log(`\n❌ ${testName} - FALHOU (código: ${code})`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ ${testName} - ERRO: ${error.message}`);
      resolve(false);
    });
  });
};

// Executar todos os testes
const runAllTests = async () => {
  const tests = [
    { name: 'Testes Básicos', file: 'tests/test-basic.js' },
    { name: 'Testes de Stress', file: 'tests/test-stress.js' },
    { name: 'Testes de Integração', file: 'tests/test-integration.js' },
    { name: 'Testes do Telegram', file: 'tests/test-telegram.js' }
  ];
  
  const results = [];
  
  console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES\n');
  
  for (const test of tests) {
    const result = await runTest(test.name, test.file);
    results.push({ name: test.name, passed: result });
  }
  
  // Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMO FINAL DE TODOS OS TESTES');
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
    console.log(`\n🎉 TODOS OS TESTES PASSARAM!`);
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
  
  // Salvar resultado em arquivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = `test-results-${timestamp}.log`;
  
  console.log(`\n📁 Resultado salvo em: ${logFile}`);
  
  return {
    passedTests,
    totalTests,
    successRate: (passedTests / totalTests) * 100,
    approved: passedTests === totalTests
  };
};

// Executar todos os testes
runAllTests().then(result => {
  process.exit(result.approved ? 0 : 1);
});
