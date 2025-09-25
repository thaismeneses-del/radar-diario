// Teste de funcionalidades básicas do Radar Diário
import { parseMessage } from '../src/parsing.js';
import { logger } from '../src/logger.js';

console.log('🧪 Iniciando testes básicos...');

// Casos de teste do anexo
const testCases = [
  {
    label: "1. Prazo exato + prioridade alta",
    input: "Enviar relatório de conciliação até 05/10 [UGF] #urgente",
    expected: {
      prioridade: "Alta",
      prazoISO: "2025-10-05",
      prazoBR: "05-10-2025",
      status: "Backlog",
      projeto: "UGF"
    }
  },
  {
    label: "2. Amanhã",
    input: "Revisar minuta de contrato amanhã [UGOC]",
    expected: {
      prioridade: "Média",
      status: "Backlog",
      projeto: "UGOC"
    }
  },
  {
    label: "3. Primeira quinzena",
    input: "Revisar minuta na primeira quinzena de outubro [Sebrae Nacional]",
    expected: {
      prazoISO: "2025-10-10",
      prazoBR: "10-10-2025",
      status: "Backlog"
    }
  },
  {
    label: "4. Segunda quinzena",
    input: "Validar parecer na segunda quinzena de outubro [UGF]",
    expected: {
      prazoISO: "2025-10-25",
      prazoBR: "25-10-2025",
      status: "Backlog"
    }
  },
  {
    label: "5. Sem prazo",
    input: "Preparar ata da reunião com diretoria [UAC]",
    expected: {
      prazoISO: "",
      prazoBR: "",
      status: "Backlog",
      projeto: "UAC"
    }
  },
  {
    label: "6. Aguardando terceiros",
    input: "Aguardando aprovação da OS 11/2025 pela área financeira [UGOC]",
    expected: {
      status: "Aguardando terceiros",
      projeto: "UGOC"
    }
  },
  {
    label: "7. Em andamento",
    input: "Em andamento a revisão do RAT [UGF]",
    expected: {
      status: "Em andamento",
      projeto: "UGF"
    }
  },
  {
    label: "8. Prioridade baixa",
    input: "Revisar manual de procedimentos [Sebrae SP] #baixa",
    expected: {
      prioridade: "Baixa",
      status: "Backlog",
      projeto: "Sebrae SP"
    }
  }
];

// Executar testes
let passedTests = 0;
let totalTests = testCases.length;

console.log(`\n📋 Executando ${totalTests} testes...\n`);

for (const testCase of testCases) {
  try {
    console.log(`🧪 ${testCase.label}`);
    console.log(`   Input: "${testCase.input}"`);
    
    const result = parseMessage(testCase.input);
    
    // Verificar resultados
    let testPassed = true;
    const errors = [];
    
    for (const [key, expectedValue] of Object.entries(testCase.expected)) {
      if (result[key] !== expectedValue) {
        testPassed = false;
        errors.push(`${key}: esperado "${expectedValue}", obtido "${result[key]}"`);
      }
    }
    
    if (testPassed) {
      console.log(`   ✅ PASSOU`);
      passedTests++;
    } else {
      console.log(`   ❌ FALHOU`);
      errors.forEach(error => console.log(`      - ${error}`));
    }
    
    console.log(`   Resultado: ${JSON.stringify(result, null, 2)}\n`);
    
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
  }
}

console.log(`\n📊 RESULTADO DOS TESTES:`);
console.log(`✅ Testes passaram: ${passedTests}/${totalTests}`);
console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);
console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log(`\n🎉 TODOS OS TESTES PASSARAM!`);
} else {
  console.log(`\n⚠️ ALGUNS TESTES FALHARAM - REVISAR CÓDIGO`);
}
