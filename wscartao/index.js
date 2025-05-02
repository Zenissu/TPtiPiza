const express = require('express');
const app = express();
app.use(express.json());

// Simula uma base de dados de cartões de créditonaç
const cartoes = [
  { nome: 'João Silva', numero: '1234-5678-9012-3456', saldo: 1000, limite: 2000 },
  { nome: 'Maria Oliveira', numero: '2345-6789-0123-4567', saldo: 500, limite: 1500 },
  { nome: 'Carlos Souza', numero: '3456-7890-1234-5678', saldo: 200, limite: 800 },
  { nome: 'Ana Costa', numero: '4567-8901-2345-6789', saldo: 300, limite: 1200 },
  { nome: 'Paula Pereira', numero: '1224-5678-9012-3456', saldo: 1000, limite: 2000 },
  { nome: 'felipe', numero: '1234-5878-9012-3456', saldo: 1000, limite: 2000 },
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
  const { nome, valor } = req.body; // Recebe o nome do cliente e o valor do pedido
  const cartao = cartoes.find((c) => c.nome === nome); // Busca o cartão pelo nome do cliente

  if (!cartao) {
    return res.status(404).json({ mensagem: 'Cartão não encontrado para o cliente informado.' });
  }

  if (cartao.saldo >= valor) {
    cartao.saldo -= valor; // Deduz o valor do saldo
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
