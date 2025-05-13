require('dotenv').config();
const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');
const axios = require('axios');

const app = express();
app.use(cors()); // inicia cors
app.use(express.json()); // recebe json no corpo do html

const db = mysql.createConnection({
    host: process.env.HOST,
    user: 'felipe',
    password: process.env.PASSWORD,
    database: 'pizzaria'
});

db.connect(err => {
    if (err) {
        console.error('Não foi possível conectar ao banco de dados:', err);
    } else {
        console.log('A conexão foi um sucesso!');
    }
});

// Testa rota
app.get('/', (req, res) => {
    res.send('API está funcionando!');
});

// Rota para cadastrar clientes - tabela cliente
app.post('/clientes', (req, res) => {
    console.log("Corpo da requisição:", req.body); // Verificar entrada

    const { nome, telefone, endereco, situacao = true } = req.body; // Define situacao como true se não for enviado

    const sql = 'INSERT INTO cliente (nome, telefone, endereco, situacao) VALUES (?,?,?,?)';

    db.query(sql, [nome, telefone, endereco, situacao], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar cliente:', err);
            return res.status(500).send("Erro ao inserir cliente");
        }
        res.status(201).json({ id: result.insertId, nome, telefone, endereco, situacao });
    });
});

// Atualizar dados do cliente
app.put('/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nome, telefone, endereco, situacao } = req.body;

    const sql = 'UPDATE cliente SET nome = ?, telefone = ?, endereco = ?, situacao = ? WHERE codigo = ?';

    db.query(sql, [nome, telefone, endereco, situacao, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar cliente:', err);
            return res.status(500).send('Erro ao atualizar cliente');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Cliente não encontrado.');
        }
        res.status(200).send('Cliente atualizado com sucesso!');
    });
});

// Rota para cadastrar pizzas - tabela pizzas
app.post('/pizzas', (req, res) => {
    const { nome, ingredientes, nome_da_imagem, preco } = req.body;

    const sql = 'INSERT INTO pizza (nome, ingredientes, nome_da_imagem, preco) VALUES (?,?,?,?)';

    db.query(sql, [nome, ingredientes, nome_da_imagem, preco], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar pizza:', err);
            return res.status(500).send("Erro ao inserir pizza");
        }
        res.status(201).json({ 
            codigo: result.insertId, // Retorna o ID gerado
            nome, 
            ingredientes, 
            nome_da_imagem, 
            preco 
        });
    });
});

// Rota para atualizar pizzas
app.put('/pizzas/:id', (req, res) => {
    const { id } = req.params;
    const { nome, ingredientes, nome_da_imagem, preco } = req.body;

    const sql = 'UPDATE pizza SET nome = ?, ingredientes = ?, nome_da_imagem = ?, preco = ? WHERE codigo = ?';

    db.query(sql, [nome, ingredientes, nome_da_imagem, preco, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar pizza:', err);
            return res.status(500).send('Erro ao atualizar pizza');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Pizza não encontrada.');
        }
        res.status(200).send('Pizza atualizada com sucesso!');
    });
});

// Rota para cadastrar o pedido
app.post('/api/pedido', async (req, res) => {
    const { codigo_cliente, pizzas, forma_de_pagamento, data_hora_da_entrega } = req.body;

    if (!codigo_cliente || !Array.isArray(pizzas) || pizzas.length === 0) {
        return res.status(400).json({ erro: "Dados do pedido incompletos." });
    }

    try {
        // Calcula o valor total do pedido
        let valor_total = 0;
        let consultas_pizzas = pizzas.map(item => {
            return new Promise((resolve, reject) => {
                db.query('SELECT preco FROM pizza WHERE codigo = ?', [item.codigo_pizza], (err, result) => {
                    if (err || result.length === 0) return reject(`Pizza código ${item.codigo_pizza} inválida.`);
                    valor_total += result[0].preco * item.quantidade;
                    resolve();
                });
            });
        });

        await Promise.all(consultas_pizzas);

        // Busca o cliente pelo código
        const cliente = await new Promise((resolve, reject) => {
            db.query('SELECT nome FROM cliente WHERE codigo = ?', [codigo_cliente], (err, result) => {
                if (err || result.length === 0) return reject('Cliente não encontrado.');
                resolve(result[0]);
            });
        });

        let situacao = 'aguardando';

        // Se a forma de pagamento for "cartão", verifica o saldo no wscartao
        if (forma_de_pagamento === 'cartao') {
            try {
                const resposta = await axios.post('http://localhost:8080/cartao/compras', {
                    nome: cliente.nome,
                    valor: valor_total,
                });

                if (resposta.data.mensagem === 'Compra aprovada') {
                    situacao = 'preparando';
                } else {
                    return res.status(402).json({ erro: 'Saldo insuficiente.' });
                }
            } catch (error) {
                if (error.response && error.response.status === 402) {
                    // Trata especificamente o erro 402 retornado pelo serviço de cartão
                    return res.status(402).json({ erro: 'Saldo insuficiente.' });
                }
                console.error('Erro ao processar pagamento com cartão:', error.message);
                return res.status(500).json({ erro: 'Erro ao processar pagamento com cartão.' });
            }
        }

        // Formata a data para o formato MySQL
        const dataFormatada = formatarDataMySQL(data_hora_da_entrega);

        // Insere o pedido no banco de dados
        const sqlPedido = `
            INSERT INTO pedidos (codigo_cliente, valor_total, forma_de_pagamento, situacao, data_hora_da_entrega)
            VALUES (?, ?, ?, ?, ?)`;

        db.query(sqlPedido, [codigo_cliente, valor_total, forma_de_pagamento, situacao, dataFormatada], (err, result) => {
            if (err) {
                console.error('Erro ao inserir pedido:', err);
                return res.status(500).json({ erro: "Erro ao registrar pedido." });
            }

            const codigo_pedido = result.insertId;

            let insercoes = pizzas.map(item => {
                return new Promise((resolve, reject) => {
                    const sqlItem = 'INSERT INTO pedido_pizza (codigo_pedido, codigo_pizza, quantidade) VALUES (?, ?, ?)';
                    db.query(sqlItem, [codigo_pedido, item.codigo_pizza, item.quantidade], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(insercoes)
                .then(() => res.status(201).json({ sucesso: true, codigo_pedido, situacao }))
                .catch(err => {
                    console.error('Erro ao inserir itens do pedido:', err);
                    res.status(500).json({ erro: "Erro ao salvar itens do pedido." });
                });
        });

    } catch (err) {
        console.error('Erro inesperado:', err);
        res.status(500).json({ erro: "Erro inesperado." });
    }
});

// Função para formatar a data no formato MySQL
const formatarDataMySQL = isoString => {
    const data = new Date(isoString);

    const pad = n => n.toString().padStart(2, '0');

    const ano = data.getFullYear();
    const mes = pad(data.getMonth() + 1);
    const dia = pad(data.getDate());
    const hora = pad(data.getHours());
    const minuto = pad(data.getMinutes());
    const segundo = pad(data.getSeconds());

    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
};

// Rota para listar pedidos com cliente e pizzas
app.get('/api/pedidos', (req, res) => {
    const sql = `
        SELECT 
            p.codigo AS codigo_pedido,
            p.codigo_cliente,
            c.nome AS nome_cliente,
            p.valor_total,
            p.situacao,
            p.forma_de_pagamento,
            p.data_hora_da_entrega,
            pp.codigo_pizza,
            pi.nome AS nome_pizza,
            pp.quantidade
        FROM pedidos p
        JOIN cliente c ON p.codigo_cliente = c.codigo
        JOIN pedido_pizza pp ON pp.codigo_pedido = p.codigo
        JOIN pizza pi ON pi.codigo = pp.codigo_pizza
        ORDER BY p.codigo DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pedidos:', err);
            return res.status(500).json({ erro: "Erro ao buscar pedidos" });
        }

        // Agrupar os resultados por pedido
        const pedidosAgrupados = {};
        results.forEach(row => {
            if (!pedidosAgrupados[row.codigo_pedido]) {
                pedidosAgrupados[row.codigo_pedido] = {
                    codigo: row.codigo_pedido,
                    cliente: row.nome_cliente,
                    codigo_cliente: row.codigo_cliente,
                    valor_total: row.valor_total,
                    situacao: row.situacao,
                    forma_de_pagamento: row.forma_de_pagamento,
                    data_hora_da_entrega: row.data_hora_da_entrega,
                    pizzas: []
                };
            }

            pedidosAgrupados[row.codigo_pedido].pizzas.push({
                codigo: row.codigo_pizza,
                nome: row.nome_pizza,
                quantidade: row.quantidade
            });
        });

        res.json(Object.values(pedidosAgrupados));
    });
});

// Rota para atualizar o status do pedido
app.put('/api/pedidos/:codigo/status', (req, res) => {
    const { codigo } = req.params;  // Pega o código do pedido
    const { situacao } = req.body;  // Pega a nova situação do corpo da requisição

    if (!situacao) {
        return res.status(400).json({ erro: 'A nova situação deve ser fornecida.' });
    }

    const sql = 'UPDATE pedidos SET situacao = ? WHERE codigo = ?';

    db.query(sql, [situacao, codigo], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status do pedido:', err);
            return res.status(500).json({ erro: 'Erro ao atualizar o status do pedido' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Pedido não encontrado' });
        }

        res.status(200).json({ mensagem: 'Status do pedido atualizado com sucesso!' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Rota para buscar pedidos finalizados por cliente
app.get('/api/pedidos/finalizados', (req, res) => {
    const { cliente } = req.query;

    if (!cliente) {
        return res.status(400).json({ erro: 'O nome do cliente é obrigatório.' });
    }

    const sql = `
    SELECT 
        p.codigo AS codigo_pedido,
        c.nome AS nome_cliente,
        CAST(p.valor_total AS DECIMAL(10,2)) AS valor_total,
        p.forma_de_pagamento,
        p.data_hora_da_entrega,
        GROUP_CONCAT(CONCAT(pi.nome, ' (', pp.quantidade, 'x)') SEPARATOR ', ') AS pizzas
    FROM pedidos p
    JOIN cliente c ON p.codigo_cliente = c.codigo
    JOIN pedido_pizza pp ON p.codigo = pp.codigo_pedido
    JOIN pizza pi ON pp.codigo_pizza = pi.codigo
    WHERE c.nome LIKE ? AND p.situacao = 'entregue'
    GROUP BY p.codigo
`;

db.query(sql, [`%${cliente}%`], (err, results) => {
    if (err) {
        console.error('Erro ao buscar pedidos finalizados:', err);
        return res.status(500).json({ erro: 'Erro ao buscar pedidos finalizados.' });
    }

    // Converte valor_total para número no backend
    const pedidos = results.map(row => ({
        codigo: row.codigo_pedido,
        cliente: row.nome_cliente,
        valor_total: parseFloat(row.valor_total), // Converte para número
        forma_de_pagamento: row.forma_de_pagamento,
        data_hora_da_entrega: row.data_hora_da_entrega,
        pizzas: row.pizzas
    }));

    res.json(pedidos);
    });
});

// Rota para listar pedidos em andamento
app.get('/api/pedidos/andamento', (req, res) => {
    const sql = `
        SELECT 
            p.codigo AS numero,
            c.nome AS cliente,
            GROUP_CONCAT(CONCAT(pi.nome, ' (', pp.quantidade, 'x)') SEPARATOR ', ') AS sabor,
            p.situacao AS status
        FROM pedidos p
        JOIN cliente c ON p.codigo_cliente = c.codigo
        JOIN pedido_pizza pp ON pp.codigo_pedido = p.codigo
        JOIN pizza pi ON pi.codigo = pp.codigo_pizza
        WHERE p.situacao IN ('preparando', 'no forno')
        GROUP BY p.codigo
        ORDER BY p.codigo DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pedidos em andamento:', err);
            return res.status(500).json({ erro: 'Erro ao buscar pedidos em andamento.' });
        }

        res.json(results);
    });
});

// Lista todos os clientes
app.get('/clientes', (req, res) => {
    const sql = 'SELECT * FROM cliente';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            return res.status(500).send("Erro ao buscar clientes");
        }
        res.status(200).json(results);
    });
});

// Lista todas as pizzas
app.get('/pizzas', (req, res) => {
    const { nome } = req.query;

    let sql = 'SELECT * FROM pizza WHERE situacao = true';
    const params = [];

    if (nome) {
        sql += ' AND nome LIKE ?';
        params.push(`%${nome}%`);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar pizzas:', err);
            return res.status(500).json({ erro: 'Erro ao buscar pizzas.' });
        }

        res.json(results);
    });
});
