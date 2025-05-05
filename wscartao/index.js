/*
cd\node
mkdir wscartao
cd  wscartao
npm init -y
npm install express
node index.js
*/

const express = require('express');
const app = express();
app.use(express.json());

// Simula uma base de dados de cartões de crédito
const cartoes = [
  { nome: "João Silva Santos", numero: '1111-2222-3333-4444', saldo: 2000, limite: 5000 },
  { nome: "Maria Oliveira", numero: '5555-6666-7777-8888', saldo: 1000, limite: 3000 },
  { nome: "Ana Costa", numero: '9999-0000-1111-2222', saldo: 4000, limite: 8000 },
  { nome: "Paula Pereira", numero: '3333-4444-5555-6666', saldo: 500, limite: 2000 },
  { nome: "Felipe", numero: '7777-8888-9999-0000', saldo: 300, limite: 1500 },
  { nome: 'Jão das figueiras', numero: '2222-3333-4444-5555', saldo: 1000, limite: 4000 },
  { nome: 'Pedro Sampaio', numero: '6666-7777-8888-9999', saldo: 10000, limite: 200000 },
];

// Função para verificar se uma compra é aprovada
function aprovarCompra(cartao, valor) {
  if (cartao.saldo + valor <= cartao.limite) {
    cartao.saldo += valor;
    return true;
  } else {
    return false;
  }
}

// Endpoint para realizar uma compra
app.post('/cartao/compras', (req, res) => {
    const { nome, valor } = req.body;
    const cartao = cartoes.find((c) => c.nome === nome);

    if (!cartao) {
        return res.status(404).json({ mensagem: 'Cartão não encontrado para o cliente informado.' });
    }

    if (cartao.saldo >= valor) {
        cartao.saldo -= valor;
        return res.json({ mensagem: 'Compra aprovada', saldo: cartao.saldo });
    } else {
        return res.status(402).json({ mensagem: 'Compra não aprovada. Saldo insuficiente.' });
    }
});

// Endpoint para consultar o saldo do cartão
app.get('/cartao/saldo/:numeroCartao', (req, res) => {
  const { numeroCartao } = req.params;
  const cartao = cartoes.find((c) => c.numero === numeroCartao);
  if (!cartao) {
    res.status(404).json({ mensagem: 'Cartão não encontrado' });
  } else {
    res.json({ saldo: cartao.saldo, limite: cartao.limite });
  }
});

const port = 8080;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
