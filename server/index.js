const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');


const app = express();
app.use(cors()); // inicia cors
app.use(express.json());// recebe json no corpo do html


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password:'Oracl1ntodeJesus@512##@$12131dsaccasas',
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

//Consulta cliente pelo id
app.get('/clientes/:id',(req,res)=>{
    const {id} = req.params;
    const sql = 'SELECT * FROM cliente WHERE codigo=?';
    db.query(sql,[id],(err,results)=>{
        if(err) return res.status(500).send("Erro ao buscar cliente");
        if(results.length === 0) return res.status(404).send('Cliente não encontrado!');
        res.status(200).json(results[0]);
    });
});

//Atualiza dados do cliente pelo id 
app.put('/clientes/:id',(req,res)=>{
    const {id} = req.params;
    const {nome, telefone, endereco, situacao} = req.body;

    const sql = 'UPDATE cliente SET nome=?, telefone=?, endereco=?, situacao=? WHERE codigo=?';
    db.query(sql,[nome,telefone,endereco,situacao,id],(err,result)=>{
        if(err){
            console.error('Erro ao atualizar cliente:', err);
            return res.status(500).send("Erro ao atualizar cliente");
        }
        res.status(200).send("Cliente atualizado com sucesso!")
    })
})