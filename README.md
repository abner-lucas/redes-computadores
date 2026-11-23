# 🔌 Portal de Redes de Computadores

Portal da disciplina de **Redes de Computadores** (Prof. Ábner Lucas · IFPA Campus Breves · Técnico em Informática).

🌐 **Acesse:** https://abner-lucas.github.io/redes-computadores/

O portal é **genérico**: não tem datas, para servir a qualquer turma. Ele foi feito pensando em alunos com hipersensibilidade e no espectro autista: cores suaves, uma unidade por vez, detalhes escondidos até o aluno pedir, e o painel **Conforto** (modo calmo sem animações, texto maior, tema escuro), que fica salvo no navegador.

## Seções

| Seção | O que tem |
|---|---|
| Abertura | Laboratório "Envie uma mensagem pela rede": encapsulamento pelas 7 camadas do OSI, passo a passo |
| Comece aqui | Como a disciplina funciona, código da Sala de Aula e avisos |
| Aulas | Aulas por unidade (abas), com tópicos e material de cada uma |
| Laboratório | Montagem do cabo UTP (T568A/T568B, direto e crossover) e o jogo "Em qual camada?" |
| Materiais | Missão OSI, revisões, simulado e livro de referência |
| Trilha | As 4 unidades da disciplina |

## Como atualizar

O `index.html` tem um comentário **COMO ADICIONAR** antes de cada lista. Em resumo:

1. **Aviso**: copie um `<li class="aviso">` para o topo e troque o tipo (`info`, `prazo` ou `ok`), o título e o texto.
2. **Aula**: copie um `<li class="aula">` dentro da unidade e troque o número, o título, os tópicos e o material.
3. **PDF**: coloque o arquivo em `docs/` e use `href="./docs/NomeDoArquivo.pdf"`. Hoje os links dos slides apontam para o Google Sala de Aula.
4. **Nova turma**: troque o código da Sala de Aula no painel "Comece aqui".
5. Se mudar `style.css`, `script.js` ou `logica.js`, troque o `?v=...` nos links do `index.html` (ex.: `?v=2026.12.01`), para os alunos não verem a versão antiga guardada no navegador.
6. Commit e push na branch `main`. O GitHub Pages atualiza em cerca de 1 minuto.

## Testes

```bash
node --test testes/logica.test.js
```
