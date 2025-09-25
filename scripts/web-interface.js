/**
 * Interface Web para Gerenciar Clientes (FUTURO)
 * 
 * Este script criará uma interface web simples para:
 * - Adicionar novos clientes
 * - Editar clientes existentes
 * - Remover clientes
 * - Visualizar estatísticas
 */

import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rota para listar clientes
app.get('/api/clients', (req, res) => {
  try {
    const clientsPath = path.join(process.cwd(), 'src', 'clients.js');
    const content = fs.readFileSync(clientsPath, 'utf8');
    
    // Extrair clientes do arquivo (simplificado)
    const clients = {};
    // Implementar parsing do arquivo clients.js
    
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota para adicionar cliente
app.post('/api/clients', (req, res) => {
  try {
    const { name, fullName, category, description } = req.body;
    
    // Validar dados
    if (!name || !fullName || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, nome completo e categoria são obrigatórios' 
      });
    }
    
    // Adicionar cliente (implementar lógica)
    console.log('Novo cliente:', { name, fullName, category, description });
    
    res.json({ success: true, message: 'Cliente adicionado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir interface web
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gerenciar Clientes - Radar Diário</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .client-list { margin-top: 30px; }
        .client-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>🏢 Gerenciar Clientes - Radar Diário</h1>
      
      <form id="clientForm">
        <div class="form-group">
          <label for="name">Nome do Cliente:</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="fullName">Nome Completo:</label>
          <input type="text" id="fullName" name="fullName" required>
        </div>
        
        <div class="form-group">
          <label for="category">Categoria:</label>
          <select id="category" name="category" required>
            <option value="">Selecione...</option>
            <option value="Interno">Interno</option>
            <option value="Externo">Externo</option>
            <option value="Governo">Governo</option>
            <option value="ONG">ONG</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="description">Descrição:</label>
          <textarea id="description" name="description" rows="3"></textarea>
        </div>
        
        <button type="submit">➕ Adicionar Cliente</button>
      </form>
      
      <div class="client-list">
        <h2>📋 Clientes Cadastrados</h2>
        <div id="clientsList">Carregando...</div>
      </div>
      
      <script>
        // Implementar JavaScript para gerenciar clientes
        document.getElementById('clientForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData);
          
          try {
            const response = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
              alert('✅ Cliente adicionado com sucesso!');
              e.target.reset();
              loadClients();
            } else {
              alert('❌ Erro: ' + result.error);
            }
          } catch (error) {
            alert('❌ Erro ao adicionar cliente: ' + error.message);
          }
        });
        
        async function loadClients() {
          try {
            const response = await fetch('/api/clients');
            const result = await response.json();
            
            if (result.success) {
              const clientsList = document.getElementById('clientsList');
              clientsList.innerHTML = '<p>Clientes carregados com sucesso!</p>';
            }
          } catch (error) {
            document.getElementById('clientsList').innerHTML = '<p>❌ Erro ao carregar clientes</p>';
          }
        }
        
        // Carregar clientes ao iniciar
        loadClients();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Interface web rodando em http://localhost:${PORT}`);
  console.log('💡 Acesse para gerenciar clientes visualmente');
});

export default app;
