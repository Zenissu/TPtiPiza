const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');


const app = express();
app.use(cors()); // inicia cors
app.use(express.json());// recebe json no corpo do html


const db = mysql.createConnection({
    host: 'localhost',
<<<<<<< HEAD
    user: 'root',
    password:'',
=======
    user: 'root',
    password:'',
>>>>>>> 363218d (Commit de Anderson)
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
<<<<<<< HEAD
=======
});

// rota para cadastrar pizza
app.post('/pizza', (req, res) => {
    // 
    const {codigo, nome, ingredientes, nome_da_imagem, preco, situacao} = req.body;
    //  
    const sql = 'INSERT INTO pizza(codigo, nome, ingredientes, nome_da_imagem, preco, situacao) VALUES (?, ?, ?, ?, ?, ?)';
    //
    db.query(sql, [codigo, nome, ingredientes, nome_da_imagem, preco, situacao], (err, result) => {

        if(err){
            console.eror('Erro ao cadastrar pizza', err);
            return res.status(500).send("Erro ao inserir pizza");
        }
        res.status(201).json({mensagem: "Pizza cadastrada com sucesso!", codigo});
    });
>>>>>>> 363218d (Commit de Anderson)
});