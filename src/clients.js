/**
 * Lista de Clientes e Projetos do Radar Diário
 * 
 * Para adicionar novos clientes:
 * 1. Adicione na lista abaixo
 * 2. Atualize os testes se necessário
 * 3. Documente no README
 */

export const CLIENTS = {
  // Clientes Internos
  UGF: {
    name: 'UGF',
    fullName: 'Unidade de Gestão Financeira',
    category: 'Interno',
    description: 'Gestão financeira e orçamentária'
  },
  UGOC: {
    name: 'UGOC', 
    fullName: 'Unidade de Gestão Operacional e Contratual',
    category: 'Interno',
    description: 'Gestão operacional e contratual'
  },
  UAC: {
    name: 'UAC',
    fullName: 'Unidade de Apoio e Controle', 
    category: 'Interno',
    description: 'Apoio administrativo e controle'
  },
  
  // Clientes Externos
  SEBRAE_SP: {
    name: 'Sebrae SP',
    fullName: 'Sebrae São Paulo',
    category: 'Externo',
    description: 'Serviço Brasileiro de Apoio às Micro e Pequenas Empresas - SP'
  },
  SEBRAE_NACIONAL: {
    name: 'Sebrae Nacional',
    fullName: 'Sebrae Nacional',
    category: 'Externo', 
    description: 'Serviço Brasileiro de Apoio às Micro e Pequenas Empresas - Nacional'
  },
  
  // Novos Clientes (exemplos)
  MINISTERIO_ECONOMIA: {
    name: 'Ministério da Economia',
    fullName: 'Ministério da Economia',
    category: 'Governo',
    description: 'Ministério da Economia do Brasil'
  },
  BANCO_CENTRAL: {
    name: 'Banco Central',
    fullName: 'Banco Central do Brasil',
    category: 'Governo',
    description: 'Banco Central do Brasil'
  },
  FIESP: {
    name: 'FIESP',
    fullName: 'Federação das Indústrias do Estado de São Paulo',
    category: 'Externo',
    description: 'Federação das Indústrias do Estado de São Paulo'
  },
  CNI: {
    name: 'CNI',
    fullName: 'Confederação Nacional da Indústria',
    category: 'Externo',
    description: 'Confederação Nacional da Indústria'
  }
};

/**
 * Lista de tags válidas para parsing
 */
export const VALID_TAGS = Object.values(CLIENTS).map(client => `[${client.name}]`);

/**
 * Busca cliente por nome
 */
export function findClientByName(name) {
  return Object.values(CLIENTS).find(client => 
    client.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Lista clientes por categoria
 */
export function getClientsByCategory(category) {
  return Object.values(CLIENTS).filter(client => 
    client.category === category
  );
}

/**
 * Retorna todas as categorias
 */
export function getCategories() {
  return [...new Set(Object.values(CLIENTS).map(client => client.category))];
}
