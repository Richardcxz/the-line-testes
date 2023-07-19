const express = require('express');
const app = express();
const mysql = require('mysql');
const path = require('path');
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const { query } = require('express');

app.use(express.static('www'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// variáveis usadas nas outras páginas do projeto
var islogged = 0;
var usuario = "";
var usertag = 0;
var nometarefa = "";
var arqproj;
var projetoscriados = 0;
var projsmembro = 0;
var totalprojs = 0;
var projetoscriadoscheck = 0;
var projsmembrocheck = 0;
var totalprojscheck = 0;
var nomeproj = "";
var descproj = "";
var projtag = "";
var iscriador = "";
//

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDirectoryPath, 'index.html'));
});

const pool = mysql.createPool({
  host: 'b5a0yocqy8nk6zvkxbeo-mysql.services.clever-cloud.com',
  user: 'ukoz6hn5habn25uo',
  password: 'iLjAuwNfnYaQwOWuPP7N',
  port: 3306,
  database: 'b5a0yocqy8nk6zvkxbeo'
});
var server = app.listen(8000, function () {

    console.log('Server rodando em http://127.0.0.1:8000/')

})

app.post('/salvar-conta', function(req, res) {
  const usucad = req.body.usuario;
  const emailcad = req.body.email;
  const sencad = req.body.senha;
  console.log(usucad)
  const tag = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
  pool.getConnection()
    .then(conn => {
      conn.query("SELECT COUNT(*) AS count FROM contas WHERE nick = ? OR email = ?", [usucad, emailcad])
        .then(result => {
          if (result[0].count > 0) {
            res.status(500).send('Usuário ou e-mail já cadastrados.');
            conn.release();
          } else {
            conn.query("INSERT INTO contas (nick, nicktag, email, senha) VALUES (?, ?, ?, ?)", [usucad, tag, emailcad, sencad])
              .then(result => {
                res.send('Conta salva com sucesso!');
              })
              .catch(error => {
                res.status(500).send('Erro ao salvar a conta no banco de dados.');
              })
              .finally(() => {
                conn.release();
              });
          }
        })
        .catch(error => {
          res.status(500).send('Erro ao verificar a existência do usuário ou e-mail no banco de dados.');
        })
    })
    .catch(error => {
      res.status(500).send('Erro ao se conectar ao banco de dados.');
    });
});

  app.post('/fazer-login', function(req, res) {
    const usu = req.body.usu;
    const sen = req.body.sen;
    pool.getConnection()
      .then(conn => {
        const resultado = conn.query('SELECT * FROM contas WHERE nick = ? AND senha = ?', [usu, sen])     
          .then(result => {
            if(result.length > 0) {
              usertag = result[0].nicktag;
              islogged = 1;
              usuario = usu;

            conn.query('SELECT COUNT(*) AS projsmembro FROM membros WHERE usertag = ?', [usertag])
              .then(result => {
              projsmembro = parseInt(result[0].projsmembro);
              })
            conn.query('SELECT COUNT(*) AS projscriados FROM projetos WHERE criador = ?', [usertag])
            .then(result => {
              projetoscriados = parseInt(result[0].projscriados);
              totalprojs = projsmembro + projetoscriados;
              res.redirect('index3.html');
              })
            .finally(() => {
              conn.release();
            });
            } else {
              res.status(401).send('Usuário ou senha inválidos');
            }
          })
      })
      .catch(error => {
        res.status(500).send('Erro ao se conectar ao banco de dados.');
      });
  });

  app.post('/salvar-projeto', function(req, res) {
    const nomeproj = req.body.nomeproj;
    const descproj = req.body.descproj;
    const tag = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
    
    pool.getConnection()
      .then(conn => {
            conn.query("INSERT INTO projetos (nome, descricao, criador, projtag) VALUES (?, ?, ?, ?)", [nomeproj, descproj, usertag, tag])
              .then(result => {
                res.send('Projeto salvo com sucesso!');
                projetoscriados++;
              })
              .catch(error => {
                console.error('Erro ao salvar o projeto no banco de dados.', error);
                res.status(500).send('Erro ao salvar o projeto no banco de dados.');
              })
              .finally(() => {
                conn.release();
              });
      });
    });

    app.post('/mudar-info', function(req, res) {
      const usuchg = req.body.usuchg;
      const emailchg = req.body.emailchg;
      const senchg = req.body.senchg;
      let sql = "UPDATE contas SET nick = nick";
      if (usuchg != "") {
        sql += ", nick = '" + usuchg + "'";}
      if (emailchg != "") {
        sql += ", email = '" + emailchg + "'";}
      if (senchg != "") {
        sql += ", senha = '" + senchg + "'";}
      if (!usuchg && !emailchg && !senchg) {
        res.status(400).send('Nenhum dado foi fornecido para atualização.');
        return; }
      sql += " WHERE nicktag = '" + usertag + "'";
      pool.getConnection()
        .then(conn => {
          conn.query(sql)
            .then(result => {
              if (result.affectedRows > 0) {
                res.send('Informação atualizada com sucesso!');
                usuario = usuchg;
              } else {
                res.status(400).send('Usuário não encontrado.');
              }
              conn.release();
            })
            .catch(error => {
              res.status(500).send('Erro ao atualizar informações no banco de dados.');
              conn.release();
            });
        })
        .catch(error => {
          res.status(500).send('Erro ao se conectar ao banco de dados.');
        });
    });
  
    app.post('/verificar-login', function(req, res) {
      pool.getConnection().then(conn => {
        if(islogged == 1){
        const data = {
          islogged: "true",
          username: usuario + "#" + usertag
        }; res.json(data);
        } else{
          const data = {
            islogged: "false"
          }; res.json(data);
        }
        
        conn.release();
      });
    });

    app.get('/carregar-projetos', function(req, res) {
      var projetos = [];
    
      pool.getConnection()
        .then(conn => {
          conn.query("SELECT nome FROM projetos WHERE criador = ? UNION SELECT projetos.nome FROM projetos INNER JOIN membros ON projetos.projtag = membros.projtag WHERE membros.usertag = ?", [usertag, usertag])
            .then(result => {
              result.forEach(row => {
                projetos.push(row.nome);
              });
              res.send(projetos);
              conn.release();
            })
            .catch(error => {
              res.status(500).send('Erro ao buscar os projetos no banco de dados.');
            });
        });
    });

    app.get('/carregar-solicitacoes', function(req, res) {
      var solicitacoes = [];
    
      pool.getConnection()
        .then(conn => {
          conn.query("SELECT projtag FROM notificacoes WHERE usertag = ?", [usertag])
            .then(result => {
              // Vamos utilizar Promise.all para esperar todas as consultas serem concluídas
              return Promise.all(result.map(row => {
                return conn.query("SELECT projetos.nome FROM projetos WHERE projtag = ?", [row.projtag]);
              }));
            })
            .then(results => {
              // results é um array com os resultados das consultas dos projetos
              results.forEach(result => {
                if (result.length > 0) {
                  var linhasolicitacao = "Convite para o projeto " + result[0].nome;
                  solicitacoes.push(linhasolicitacao);
                }
              });
    
              res.send(solicitacoes);
              conn.release();
            })
            .catch(error => {
              res.status(500).send('Erro ao buscar as solicitações no banco de dados.');
            });
        });
    });
    
  
  app.post('/deslogar', (req, res) => {
    const valor = req.body.off;
    islogged = valor;
    usuario = "";
    usertag = 0;
    projetoscriados = 0;
    projsmembro = 0;
    totalprojs = 0;
    counter = -1;
    res.sendStatus(200);
  });

  app.post('/selecao-proj', function(req, res) {
    const prj = req.body.prj;
    pool.getConnection()
      .then(conn => {
        const resultado = conn.query('SELECT nome, descricao, projtag, criador FROM projetos WHERE nome = ?', [prj])
          .then(result => {
            nomeproj = result[0].nome;
            descproj = result[0].descricao;
            projtag = result[0].projtag;
            if(usertag == result[0].criador){
            iscriador = "true";
            }
            else{
            iscriador = "false";
            }
            res.redirect('index4.html');
            conn.release();
          })
          .catch(error => {
            res.status(500).send('Erro ao salvar o texto no banco de dados.');
          });
      });
  });
  
  app.post('/info-proj', function(req, res) {
    pool.getConnection().then(conn => {
      const data = {
        nome: nomeproj,
        descricao: descproj,
        iscriador: iscriador
      };
      res.json(data);
      conn.release();
    });
  });

  app.post('/cad-tarefa', function(req, res) {
    const tarnome = req.body.tarnome;
    const tardesc = req.body.tardesc;
    const tagtarefa = req.body.tagtarefa;
  
    pool.getConnection()
      .then(conn => {
        const subquery = 'SELECT tarefas_pend + 1 AS new_tarefas_pend, log FROM projetos WHERE projtag = ?';
        conn.query(subquery, [projtag])
          .then(result => {
            const newTarefasPend = result[0].new_tarefas_pend;
            let logText = result[0].log;
            if (logText) {
              logText += '\nUsuário #' + usertag + ' criou a tarefa ' + tarnome;
            } else {
              logText = 'Usuário #' + usertag + ' criou a tarefa ' + tarnome;
            }
            conn.query('UPDATE projetos SET tarefas_pend = ?, log = ? WHERE projtag = ?', [newTarefasPend, logText, projtag])
              .then(result => {
                conn.query("INSERT INTO tarefas (nome_tarefa, desc_tarefa, tag_tarefa, tag, criador, finalizada, excluida) VALUES (?, ?, ?, ?, ?, 0, 0)", [tarnome, tardesc, tagtarefa, projtag, usertag])
                  .then(result => {
                    res.send('Tarefa salva com sucesso!');
                  });
              });
          })
          .finally(() => {
            conn.release();
          });
      });
  });

    app.post('/get-tarefas', function(req, res) {
      pool.getConnection()
        .then(conn => {
          conn.query('SELECT nome_tarefa, desc_tarefa, criador FROM tarefas WHERE tag = ? AND finalizada = 0 AND excluida = 0', [projtag])
            .then(result => {
              const data = result.map(row => {
                return {
                  tarefa: row.nome_tarefa,
                  desctarefa: row.desc_tarefa,
                  criador: row.criador
                }
              });
              res.json(data);
              conn.release();
            })
            .catch(error => {
              console.log(error);
              res.sendStatus(500);
            });
        });
    });

    app.post('/get-tarefasarq', function(req, res) {
      pool.getConnection()
        .then(conn => {
          conn.query('SELECT nome_tarefa, desc_tarefa, criador FROM tarefas WHERE tag = ? AND finalizada = 1 AND excluida = 0', [projtag])
            .then(result => {
              const data = result.map(row => {
                return {
                  tarefa: row.nome_tarefa,
                  desctarefa: row.desc_tarefa,
                  criador: row.criador
                }
              });
              res.json(data);
              conn.release();
            })
            .catch(error => {
              console.log(error);
              res.sendStatus(500);
            });
        });
    });
    
    app.post('/escolher-tarefa', function(req, res) {
      const data2 = req.body.selectext;
      nometarefa = data2
      pool.getConnection()
        .then(conn => {
          conn.query('SELECT nome_tarefa, desc_tarefa, criador, code FROM tarefas WHERE nome_tarefa = ?', [data2])
            .then(result => {
              const data = result.map(row => {
                return {
                  tarefa: row.nome_tarefa,
                  desctarefa: row.desc_tarefa,
                  criador: row.criador,
                  code: row.code
                }
              });
              res.json(data);
              conn.release();
            })
            .catch(error => {
              console.log(error);
              res.sendStatus(500);
            });
        });
    });

    app.post('/salvar-tarefa', function(req, res) {
      const code = req.body.code;
      const nometrf = req.body.nometrf;
    
      pool.getConnection()
        .then(conn => {
          conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
            .then(result => {
              let logText = '';
              if (result.length > 0 && result[0].log) {
                logText = result[0].log + '\n';
              }
              logText += `Usuário #${usertag} alterou detalhes da tarefa ${nometrf}`;
    
              conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [logText, projtag])
                .then(result => {
                  conn.query('UPDATE tarefas SET code = ? WHERE nome_tarefa = ?', [code, nometrf])
                    .then(result => {
                      res.send('Tarefa salva com sucesso!');
                    });
                });
            })
            .finally(() => {
              conn.release();
            });
        });
    });
    

    app.post('/excluir-tarefa', function(req, res) {
      const nometrf = req.body.nometrf;
    
      pool.getConnection()
        .then(conn => {
          // Subtrai 1 do valor de tarefas_pend e adiciona 1 a tarefas_exc
          conn.query('UPDATE projetos SET tarefas_pend = tarefas_pend - 1, tarefas_exc = tarefas_exc + 1 WHERE projtag = ?', [projtag])
            .then(result => {
              conn.query('UPDATE tarefas SET excluida = 1 WHERE nome_tarefa = ?', [nometrf])
              .then(result => {
              
              // Verifica se a coluna log está vazia ou não
              conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
                .then(result => {
                  let log = result[0].log;
                  if (log) {
                    // Se a coluna log não estiver vazia, adiciona o texto na próxima linha
                    log += '\nUsuário #' + usertag + ' excluiu a tarefa ' + nometrf;
                  } else {
                    // Se a coluna log estiver vazia, adiciona o texto na primeira linha
                    log = 'Usuário #' + usertag + ' excluiu a tarefa ' + nometrf;
                  }
                  // Atualiza a coluna log com o texto modificado
                  conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [log, projtag])
                    .then(result => {
                      // Exclui a tarefa normalmente
                      conn.query('DELETE FROM tarefas WHERE nome_tarefa = ?', [nometrf])
                        .then(result => {
                          res.send('Tarefa excluída com sucesso!');
                        })
                        .finally(() => {
                          conn.release();
                        });
                    });
                });
              });
            });
        });
    });    
      
    app.post('/finalizar-tarefa', function(req, res) {
      const nometrf = req.body.nometrf;
    
      pool.getConnection()
        .then(conn => {
          // Subtrai 1 do valor de tarefas_pend
          conn.query('UPDATE projetos SET tarefas_pend = tarefas_pend - 1, tarefas_conc = tarefas_conc + 1 WHERE projtag = ?', [projtag])
            .then(result => {
              conn.query('UPDATE tarefas SET finalizada = 1 WHERE nome_tarefa = ?', [nometrf])
            .then(result => {
              // Atualiza o log com a informação de que a tarefa foi finalizada
              conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
                .then(result => {
                  const log = result[0].log;
                  const message = `Usuário #${usertag} finalizou a tarefa ${nometrf}`;
    
                  if (log) {
                    conn.query('UPDATE projetos SET log = CONCAT(log, "\n", ?) WHERE projtag = ?', [message, projtag])
                      .then(result => {
                        res.send('Tarefa finalizada com sucesso!');
                      });
                  } else {
                    conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [message, projtag])
                      .then(result => {
                        res.send('Tarefa finalizada com sucesso!');
                      });
                  }
                });
              });
            })
            .finally(() => {
              conn.release();
            });
        });
    });
    
      
      app.post('/dados-tarefas', function(req, res) {
        pool.getConnection()
          .then(conn => {
            conn.query('SELECT tarefas_conc, tarefas_pend, tarefas_exc FROM projetos WHERE projtag = ?', [projtag])
              .then(result => {
                const data = result.map(row => {
                  return {
                    tarefas_conc: row.tarefas_conc,
                    tarefas_pend: row.tarefas_pend
                  }
                });
                res.json(data);
                conn.release();
              })
              .catch(error => {
                console.log(error);
                res.sendStatus(500);
              });
          });
      });

      app.post('/finalizar-projeto', function(req, res) {
        pool.getConnection()
          .then(conn => {
            conn.query('UPDATE projetos SET criador = 0000, projtag = 0000, arqcriador = ?, arqprojtag = ? WHERE projtag = ?', [usertag, projtag, projtag])
                  .then(result => {
                    conn.query('DELETE FROM membros WHERE projtag = ?', [projtag])
                  .then(result => {
                  })
                  })
                  .finally(() => {
                    conn.release();
                  });
          });
      });

      app.post('/alterar-projeto', function(req, res) {
        const nome = req.body.nome;
        const descricao = req.body.descricao;
      
        let sql = "UPDATE projetos SET ";
        if (nome != "") {
          sql += " nome = '" + nome + "'";
          if (descricao != "") {
            sql += ", descricao = '" + descricao + "'";
          }
        }
        if (nome == "" && descricao != "") {
          sql += " descricao = '" + descricao + "'";
        }
        sql += " WHERE projtag = '" + projtag + "'";
      
        if (!nome && !descricao) {
          res.status(400).send('Nenhum dado foi fornecido para atualização.');
          return;
        }
      
        pool.getConnection()
          .then(conn => {
            conn.query(sql)
              .then(result => {
                if (result.affectedRows > 0) {
                  let logMsg = '';
                  conn.query("SELECT log FROM projetos WHERE projtag = ?", [projtag])
                    .then(result => {
                      let log = result[0].log;
                      if (!log) {
                        logMsg = "Usuário #" + usertag + " alterou informações do projeto.";
                      } else {
                        logMsg = log + "\nUsuário #" + usertag + " alterou informações do projeto.";
                      }
                      conn.query("UPDATE projetos SET log = ? WHERE projtag = ?", [logMsg, projtag])
                        .then(result => {
                          res.send('Informação atualizada com sucesso!');
                          conn.release();
                        })
                        .catch(error => {
                          res.status(500).send('Erro ao atualizar informações no banco de dados.');
                          conn.release();
                        });
                    })
                    .catch(error => {
                      res.status(500).send('Erro ao atualizar informações no banco de dados.');
                      conn.release();
                    });
                } else {
                  res.status(400).send('Projeto não encontrado.');
                  conn.release();
                }
              })
              .catch(error => {
                res.status(500).send('Erro ao atualizar informações no banco de dados.');
                conn.release();
              });
          })
          .catch(error => {
            res.status(500).send('Erro ao se conectar ao banco de dados.');
          });
      });    
      
      app.post('/aceitar-convite', function(req, res) {
        const nomeprojeto = req.body.nomeproj;
        var projtag = 0;
        var logText;
      
        pool.getConnection().then(conn => {
          conn.query('SELECT projtag FROM projetos WHERE nome = ?', [nomeprojeto])
            .then(result => {
              projtag = result[0].projtag;
            })
            .then(result => {
              return conn.query('INSERT INTO membros (projtag, usertag) VALUES (?, ?)', [projtag, usertag]);
            })
            .then(result => {
              return conn.query('DELETE FROM notificacoes WHERE projtag = ? AND usertag = ?', [projtag, usertag]);
            })
            .then(result => {
              res.send('Adicionado com sucesso!');
            })
            .catch(error => {
              console.error('Erro:', error.message);
              res.status(500).send(error.message);
            })
            .finally(() => {
              conn.release();
            });
        });
      });    
      
      app.post('/recusar-convite', function(req, res) {
        const nomeprojeto = req.body.nomeproj;
        var projtag = 0;
        var logText;
      
        pool.getConnection().then(conn => {
          conn.query('SELECT projtag FROM projetos WHERE nome = ?', [nomeprojeto])
            .then(result => {
              projtag = result[0].projtag;
            })
            .then(result => {
              return conn.query('DELETE FROM notificacoes WHERE projtag = ? AND usertag = ?', [projtag, usertag]);
            })
            .then(result => {
              res.send('Recusado com sucesso!');
            })
            .catch(error => {
              console.error('Erro:', error.message);
              res.status(500).send(error.message);
            })
            .finally(() => {
              conn.release();
            });
        });
      });   
    
      app.post('/add-membro', function(req, res) {
        const mbr1 = req.body.mbr1;
      
        pool.getConnection().then(conn => {
          conn.query(
            "SELECT * FROM notificacoes WHERE projtag = ? AND usertag = ?",
            [projtag, mbr1]
          ).then(result => {
            if (result.length > 0) {
              res.status(500).send('Erro: essa combinação de informações já existe na tabela!');
            } else {
              conn.query('SELECT COUNT(*) AS projsmembro FROM membros WHERE usertag = ?', [mbr1])
                .then(result => {
                  projsmembrocheck = parseInt(result[0].projsmembro);
                  return conn.query('SELECT COUNT(*) AS projscriados FROM projetos WHERE criador = ?', [mbr1]);
                })
                .then(result => {
                  projetoscriadoscheck = parseInt(result[0].projscriados);
                  totalprojscheck = projsmembrocheck + projetoscriadoscheck;
                  
                    return conn.query("INSERT INTO notificacoes (projtag, usertag) VALUES (?, ?)", [projtag, mbr1])
                      .then(result => {
                        conn.query("SELECT log FROM projetos WHERE projtag = ?", [projtag])
                          .then(result => {
                            res.send('Solicitação enviada com sucesso!');
                          });
                      });
                })
                .finally(() => {
                  conn.release();
                });
            }
          });
        });
      });      

      app.post('/rmv-membro', function(req, res) {
        const mbr1 = req.body.mbr2;
      
        pool.getConnection()
          .then(conn => {
            conn.query('SELECT nick FROM contas WHERE nicktag = ?', [mbr1])
              .then(result => {
                conn.query('DELETE FROM membros WHERE usertag = ? AND projtag = ?', [mbr1, projtag])
                  .then(result => {
                    if (result.affectedRows === 0) {
                      res.status(500).send('Usuário não encontrado!');
                    } else {
                      conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
                        .then(result => {
                          let log = result[0].log;
                          if (log) {
                            log += '\n';
                          }
                          log = 'Usuário #" + usertag + " removeu o membro" + mbr1 +" do projeto.';
                          conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [log, projtag])
                            .then(result => {
                              res.send('Membro removido com sucesso!');
                            })
                            .catch(err => {
                              console.log(err);
                              res.status(500).send('Erro ao atualizar log!');
                            });
                        })
                        .catch(err => {
                          console.log(err);
                          res.status(500).send('Erro ao buscar log!');
                        });
                    }
                    conn.release();
                  })
                  .catch(err => {
                    console.log(err);
                    res.status(500).send('Erro ao remover membro!');
                    conn.release();
                  });
              })
              .catch(err => {
                console.log(err);
                res.status(500).send('Erro ao buscar nome do usuário!');
                conn.release();
              });
          });
      });      

app.post('/get-membros', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT usertag FROM membros WHERE projtag = ?', [projtag])
        .then(result => {
          const usertags = result.map(row => row.usertag);
          const promises = usertags.map(usertag => {
            return conn.query('SELECT nick FROM contas WHERE nicktag = ?', [usertag])
              .then(result => {
                return result.length > 0 ? result[0].nick + '#' + usertag : '';
              })
              .catch(error => {
                console.log(error);
                return '';
              });
          });
          Promise.all(promises)
            .then(nicks => {
              const data = nicks.filter(nick => nick !== '');
              res.json(data);
            })
            .catch(error => {
              console.log(error);
              res.json([]);
            })
            .finally(() => {
              conn.release();
            });
        })
        .catch(error => {
          console.log(error);
          res.json([]);
        });
    });
});

app.post('/sair-projeto', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('DELETE FROM membros WHERE projtag = ? AND usertag = ?', [projtag, usertag])
        .then(result => {
          // Adiciona mensagem no log
          conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
            .then(logResult => {
              const logText = logResult[0].log || ''; // verifica se já existe log, se não, usa uma string vazia
              const newLogText = `${logText}\nUsuário #${usertag} saiu do projeto`; // adiciona a nova mensagem ao log
              conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [newLogText, projtag])
                .then(logUpdateResult => {
                  res.sendStatus(200);
                  conn.release();
                })
                .catch(logUpdateError => {
                  console.error(logUpdateError);
                  res.sendStatus(500);
                  conn.release();
                });
            })
            .catch(logError => {
              console.error(logError);
              res.sendStatus(500);
              conn.release();
            });
        })
        .catch(error => {
          console.error(error);
          res.sendStatus(500);
          res.json([]);
        });
    });
});


app.post('/add-anexo', function(req, res) {
  const link = req.body.link;
  const texto = req.body.texto;

  const novaLinha = `<a href="${link}">${texto}</a>`;
  
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag]) // seleciona o log do projeto
        .then(result => {
          let log = result[0].log;
          if (log === undefined || log === null || log === '') {
            log = `Usuario #${usertag} adicionou um anexo na tarefa ${nometarefa} do projeto.`; // se o log estiver vazio, escreve a mensagem
          } else {
            log += `\nUsuario #${usertag} adicionou um anexo na tarefa ${nometarefa} do projeto.`; // se o log já tiver conteúdo, adiciona a mensagem em uma nova linha
          }
          conn.query('UPDATE projetos SET log = ? WHERE projtag = ?', [log, projtag]) // atualiza o log do projeto
            .then(() => {
              conn.query('SELECT anexos FROM tarefas WHERE nome_tarefa = ?', [nometarefa])
                .then(result => {
                  let textHtml = result[0].anexos;
                  if (textHtml === undefined || textHtml === null || textHtml === '') {
                    textHtml = novaLinha;
                  } else {
                    textHtml += `|${novaLinha}`;
                  }
                  conn.query('UPDATE tarefas SET anexos = ? WHERE nome_tarefa = ?', [textHtml, nometarefa])
                    .then(result => {
                      res.send('Link adicionado com sucesso!');
                    });
                })
                .finally(() => {
                  conn.release();
                });
            });
        });
    });
});


app.post('/get-anexos', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT anexos FROM tarefas WHERE tag = ? AND nome_tarefa = ?', [projtag, nometarefa])
        .then(result => {
          const data = [];
          if (result.length > 0 && result[0].anexos !== null) {
            const links = result[0].anexos.split('</a>');
            links.forEach(link => {
              if (link) {
                const $ = cheerio.load(link);
                const name = $('a').text();
                const href = $('a').attr('href');
                data.push({
                  link: href,
                  name: name
                });
              }
            });
          }
          res.json(data);
          conn.release();
        })
    });
});

app.post('/get-arqproj', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT nome FROM projetos WHERE arqcriador = ?', [usertag])
        .then(result => {
          const data = result.map(row => {
            return {
              nome: row.nome
            }
          });
          res.json(data);
          conn.release();
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        });
    });
});

app.post('/get-infoarqproj', function(req, res) {
  const data2 = req.body.selectext;
  nometarefa = data2
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT nome, descricao, arqprojtag, log FROM projetos WHERE nome = ?', [data2])
        .then(result => {
          const data = result.map(row => {
            return {
              nome: row.nome,
              desc: row.descricao,
              tag: row.arqprojtag,
              log: row.log
            }
           
          });
          arqproj = data[0].tag;
          res.json(data);
          conn.release();
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        });
    });
});

app.post('/get-arqtarefas', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT nome_tarefa FROM tarefas WHERE tag = ?', [arqproj])
        .then(result => {
          const data2 = result.map(row => {
            return {
              tarefa: row.nome_tarefa
            }
          });
          res.json(data2);
          conn.release();
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        });
    });
});

app.post('/get-infoarqtar', function(req, res) {
  const data2 = req.body.selectext;
  nometarefa = data2
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT nome_tarefa, desc_tarefa, criador, IFNULL(code, "") AS code FROM tarefas WHERE nome_tarefa = ?', [data2])
        .then(result => {
          const data = result.map(row => {
            return {
              tarefa: row.nome_tarefa,
              desctarefa: row.desc_tarefa,
              code: row.code
            }
          });
          res.json(data);
          conn.release();
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        });
    });
});


app.post('/get-log', function(req, res) {
  pool.getConnection()
    .then(conn => {
      conn.query('SELECT log FROM projetos WHERE projtag = ?', [projtag])
        .then(result => {
          const data = result.map(row => {
            return {
              log: row.log
            }
          });
          res.json(data);
          conn.release();
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(500);
        });
    });
});
