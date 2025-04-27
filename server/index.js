const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');


const app = express();
app.use(cors()); // inicia cors
app.use(express.json());// recebe json no corpo do html


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
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
// #################################################################################################################
// Rota para cadastrar pizzas - tabela pizzas
app.post('/pizzas', (req, res) => {
    console.log("Corpo da requisição:", req.body); // debug

    const { codigo, nome, ingredientes, nome_da_imagem, preco, situacao } = req.body;

    const sql = 'INSERT INTO pizzas (codigo, nome, ingredientes, nome_da_imagem, preco, situacao) VALUES (?,?,?,?,?,?)';

    db.query(sql, [codigo, nome, ingredientes, nome_da_imagem, preco, situacao], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar pizza:', err);
            return res.status(500).send("Erro ao inserir pizza");
        }
        res.status(201).json({ codigo, nome, ingredientes, nome_da_imagem, preco, situacao });
    });
});
// #################################################################################################################
// #################################################################################################################
// rota para cadastrar o pedido
app.post('/pedidos', (req, res) => {
    // Criação da constante a partir do body
    const {id_cliente, codigo_pizza, quantidade, situacao, valor_total, forma_de_pagamento, data_tempo} = req.body;
    // Procurar o ID da pizza baseado no código
    const sqlBuscaPizza = 'SELECT id FROM pizzas WHERE codigo = ?';
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
// #################################################################################################################
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