# 🔌 Portal de Redes de Computadores

Portal da disciplina de **Redes de Computadores** (Prof. Ábner Lucas · IFPA Campus Breves · Técnico em Informática).

🌐 **Acesse:** https://abner-lucas.github.io/redes-computadores/

O portal é **genérico** (sem datas) e funciona como vitrine da disciplina: projetos, aulas práticas, laboratórios e materiais. Ele foi feito pensando em alunos com hipersensibilidade e no espectro autista: cores suaves, filtros para ver um tema por vez, detalhes escondidos até o aluno pedir, e o painel **Conforto** (modo calmo sem animações, texto maior, tema escuro), que fica salvo no navegador.

## Seções

| Seção | O que tem |
|---|---|
| Início | Laboratório "Envie uma mensagem pela rede": encapsulamento pelas 7 camadas do OSI |
| Projetos | Vitrine dos projetos e práticas da turma (Missão OSI em destaque), com filtro |
| Laboratório | Montagem do cabo UTP e o jogo "Em qual camada?" |
| Materiais | Biblioteca de slides e revisões por tema, com filtro |
| Sobre | Ementa, ficha da disciplina, o que se estuda, código da Sala de Aula e avisos |

A navegação é uma "rota" (à esquerda no computador, embaixo no celular) e o fundo é uma malha de rede animada, que para no modo calmo.

## Como atualizar

O `index.html` tem um comentário **COMO ADICIONAR** antes de cada lista. Em resumo:

1. **Projeto ou prática**: copie um `<article class="projeto">` na seção Projetos. `data-tipo` = `plataforma`, `pratica` ou `jogo`. Fotos vão em `img/`.
2. **Material**: copie um `<li class="doc">` na Biblioteca. `data-tipo` = tema (`fundamentos`, `infraestrutura`, `cabeamento`, `modelos`). PDFs vão em `docs/` (hoje os links apontam para o Google Sala de Aula).
3. **Aviso**: copie um `<li class="aviso">` no Mural (seção Sobre).
4. **Nova turma**: troque o código da Sala de Aula no Mural.
5. Se mudar `style.css`, `script.js` ou `logica.js`, troque o `?v=...` nos links do `index.html`.
6. Commit e push na branch `main`. O GitHub Pages atualiza em cerca de 1 minuto.

## Testes

```bash
node --test testes/logica.test.js
```
