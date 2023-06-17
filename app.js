const mysql = require('mysql');
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Define o caminho para a pasta "www" na raiz do projeto
const publicDirectoryPath = path.join(__dirname, 'www');

// Define o middleware para servir os arquivos estáticos da pasta "www"
app.use(express.static(publicDirectoryPath));

// Rota principal para exibir o arquivo "index.html"
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor está executando na porta ${port}`);
});

// Configurações de conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'b5a0yocqy8nk6zvkxbeo-mysql.services.clever-cloud.com',
  user: 'ukoz6hn5habn25uo',
  password: 'iLjAuwNfnYaQwOWuPP7N',
  port: 3306,
  database: 'b5a0yocqy8nk6zvkxbeo'
});

// Conecta ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão estabelecida com o banco de dados.');

  // Cria a tabela "teste"
  const createTableQuery = 'CREATE TABLE IF NOT EXISTS teste (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(255))';
  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error('Erro ao criar a tabela:', err);
      return;
    }
    console.log('Tabela "teste" criada com sucesso.');

    // Insere o valor "12345" na tabela
    const insertValueQuery = 'INSERT INTO teste (value) VALUES (?)';
    connection.query(insertValueQuery, ['12345'], (err) => {
      if (err) {
        console.error('Erro ao inserir o valor na tabela:', err);
        return;
      }
      console.log('Valor inserido com sucesso na tabela.');

      // Fecha a conexão com o banco de dados
      connection.end((err) => {
        if (err) {
          console.error('Erro ao fechar a conexão com o banco de dados:', err);
          return;
        }
        console.log('Conexão encerrada com o banco de dados.');
      });
    });
  });
});
