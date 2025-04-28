const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');


const app = express();
app.use(cors()); // inicia cors
app.use(express.json());// recebe json no corpo do html


const db = mysql.createConnection({
    host: 'localhost',
    user: '',
    password:'',
    database:'pizzaria'
});

db.connect(err=>{
    if(err){
        console.error('Não foi possível conectar ao banco de dados:',err);
    }else{
        console.log('A conexão foi um sucesso!')
    };
});

//testa rota
app.get('/',(req,res)=>{
    res.send('API está funcionando!');
});

//Rota para cadastrar clientes - table cliente
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

//Rota para atualizar clientes 
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
    console.log("Corpo da requisição:", req.body); // debug

    const { nome, ingredientes, nome_da_imagem, preco } = req.body;

    const sql = 'INSERT INTO pizza (nome, ingredientes, nome_da_imagem, preco) VALUES (?,?,?,?)';

    db.query(sql, [nome, ingredientes, nome_da_imagem, preco], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar pizza:', err);
            return res.status(500).send("Erro ao inserir pizza");
        }
        res.status(201).json({ nome, ingredientes, nome_da_imagem, preco });
    });
});

//Rota para atualizar pizzas
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
app.post('/pedidos', (req, res) => {
    // Criação da constante a partir do body
    const {id_cliente, codigo_pizza, quantidade, situacao, valor_total, forma_de_pagamento, data_tempo} = req.body;
    // Procurar o ID da pizza baseado no código
    const sqlBuscaPizza = 'SELECT codigo FROM pizza WHERE codigo = ?';
    db.query(sqlBuscaPizza, [codigo_pizza], (err, results) => {
        if(err){
            console.error("Erro ao buscar pizza:", err);
            return res.status(500).send("Erro ao buscar pizza.");
        }
        if(results.length === 0){
            return res.status(404).send("Pizza não encontrada com esse código.");
        }
        const id_pizza = results[0].id;
        // Fazendo o pedido, já com o id_pizza correto
        const sqlPedido = 'INSERT INTO pedido (id_cliente, id_pizza, quantidade, situacao, valor_total, forma_de_pagamento, data_hora_da_entrega) VALUES (?,?,?,?,?,?,?)';
        // Erro e Resultado
        db.query(sqlPedido, [id_cliente, id_pizza, quantidade, situacao, valor_total, forma_de_pagamento, data_tempo], (err, result) =>{
            if(err){
                console.error("Erro ao inserir pedido: ", err);
                return res.status(500).send("Erro ao cadastrar pedido");
            }
            // Sucesso
            res.status(201).json({ id: result.insertId, id_cliente, id_pizza, quantidade, situacao, valor_total, forma_de_pagamento, data_tempo });
        });
    })
});

const PORT = 3000;
app.listen(PORT,()=>{
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

//Lista todos os clientes atraves da rota: table
app.get('/clientes',(req,res)=>{
    const sql = 'SELECT * FROM cliente';
    db.query(sql,(err,results) => {
        if(err){
            console.error('Erro ao buscar clientes:',err);
            return res.status(500).send("Erro ao buscar clientes");
        }
        res.status(200).json(results);
    });
});

//Lista todos os pizza atraves da rota: table
app.get('/pizzas',(req,res)=>{
    const sql = 'SELECT * FROM pizza';
    db.query(sql,(err,results) => {
        if(err){
            console.error('Erro ao buscar pizzas:',err);
            return res.status(500).send("Erro ao buscar pizzas");
        }
        res.status(200).json(results);
    });
});