/*
 * script.js · interface do portal de Redes de Computadores
 * A lógica (modelo OSI e cabo UTP) está em logica.js (window.Redes).
 * Tudo aqui se protege contra elementos ausentes: o mesmo arquivo pode
 * ser usado por subpáginas.
 */
(function () {
    'use strict';
    var R = window.Redes;
    var html = document.documentElement;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    function calmo() { return html.dataset.calmo === 'sim'; }
    function salvar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* navegador sem armazenamento */ } }

    /* ---------- painel de conforto ---------- */
    (function () {
        var botao = $('#botao-conforto'), painel = $('#painel-conforto');
        if (!botao || !painel) return;
        var estado = {
            calmo: function () { return html.dataset.calmo === 'sim'; },
            texto: function () { return html.dataset.texto === 'maior'; },
            tema: function () { return html.dataset.tema === 'escuro'; }
        };
        var aplicar = {
            calmo: function (on) { html.dataset.calmo = on ? 'sim' : 'nao'; salvar('rc:calmo', html.dataset.calmo); atualizarCenas(); },
            texto: function (on) { html.dataset.texto = on ? 'maior' : 'normal'; salvar('rc:texto', html.dataset.texto); },
            tema: function (on) {
                var trocar = function () { html.dataset.tema = on ? 'escuro' : 'claro'; };
                if (document.startViewTransition && !calmo()) document.startViewTransition(trocar); else trocar();
                salvar('rc:tema', on ? 'escuro' : 'claro');
            }
        };
        function sincronizar() {
            $$('.chave', painel).forEach(function (c) { c.setAttribute('aria-pressed', String(estado[c.dataset.ajuste]())); });
        }
        function abrir(on) {
            painel.hidden = !on;
            botao.setAttribute('aria-expanded', String(on));
            if (on) { sincronizar(); $('.chave', painel).focus(); }
        }
        botao.addEventListener('click', function () { abrir(painel.hidden); });
        $$('.chave', painel).forEach(function (c) {
            c.addEventListener('click', function () {
                var k = c.dataset.ajuste;
                aplicar[k](!estado[k]());
                sincronizar();
            });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !painel.hidden) { abrir(false); botao.focus(); }
        });
        document.addEventListener('click', function (e) {
            if (!painel.hidden && !painel.contains(e.target) && !botao.contains(e.target)) abrir(false);
        });
    })();

    /* ---------- menu móvel ---------- */
    (function () {
        var botao = $('#botao-menu'), menu = $('#menu');
        if (!botao || !menu) return;
        function abrir(on) {
            menu.classList.toggle('aberto', on);
            botao.setAttribute('aria-expanded', String(on));
            botao.setAttribute('aria-label', on ? 'Fechar menu' : 'Abrir menu');
        }
        botao.addEventListener('click', function () { abrir(!menu.classList.contains('aberto')); });
        $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { abrir(false); }); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('aberto')) { abrir(false); botao.focus(); }
        });
    })();

    /* ---------- rolagem: progresso, seção atual, cenas, trilha ---------- */
    var barra = $('#progresso-barra');
    var cenas = $$('[data-cena]');
    var trilha = $('#trilha-lista');
    var linksMenu = $$('#menu a').filter(function (a) { return a.getAttribute('href').charAt(0) === '#'; });

    function atualizarCenas() {
        var vh = window.innerHeight;
        cenas.forEach(function (s) {
            if (calmo()) { s.style.removeProperty('--cena'); return; }
            var topo = s.getBoundingClientRect().top;
            // começa quando o topo entra pela base da tela e termina a ~65% da altura
            var p = (vh - topo) / (vh * 0.35);
            s.style.setProperty('--cena', Math.max(0, Math.min(1, p)).toFixed(3));
        });
    }

    function aoRolar() {
        var doc = html.scrollHeight - window.innerHeight;
        if (barra) barra.style.setProperty('--leitura', doc > 0 ? (window.scrollY / doc).toFixed(4) : 0);
        atualizarCenas();

        if (trilha) {
            var r = trilha.getBoundingClientRect();
            var p = calmo() ? 1 : (window.innerHeight * 0.7 - r.top) / r.height;
            trilha.style.setProperty('--trilha', Math.max(0, Math.min(1, p)).toFixed(3));
        }

        var atual = null;
        linksMenu.forEach(function (a) {
            var alvo = $(a.getAttribute('href'));
            if (alvo && alvo.getBoundingClientRect().top < window.innerHeight * 0.35) atual = a;
        });
        linksMenu.forEach(function (a) { a.setAttribute('aria-current', String(a === atual)); });
    }
    var pedido = false;
    window.addEventListener('scroll', function () {
        if (pedido) return;
        pedido = true;
        requestAnimationFrame(function () { pedido = false; aoRolar(); });
    }, { passive: true });
    window.addEventListener('resize', aoRolar);
    aoRolar();

    /* ---------- revelação em cascata ---------- */
    (function () {
        var grupos = ['.agora-grade > *', '.avisos > li', '.trilha > li', '.tabela tbody tr'];
        var itens = [];
        grupos.forEach(function (g) {
            $$(g).forEach(function (el, i) { el.classList.add('revelar'); el.style.setProperty('--i', i); itens.push(el); });
        });
        if (!('IntersectionObserver' in window)) { itens.forEach(function (el) { el.classList.add('visivel'); }); return; }
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        itens.forEach(function (el) { obs.observe(el); });
    })();

    /* ---------- abas genéricas (teclado: setas, Home, End) ---------- */
    function ligarAbas(lista, aoTrocar) {
        if (!lista) return null;
        var abas = $$('[role="tab"]', lista);
        function selecionar(aba, focar) {
            abas.forEach(function (a) {
                var sel = a === aba;
                a.setAttribute('aria-selected', String(sel));
                a.tabIndex = sel ? 0 : -1;
                var painel = document.getElementById(a.getAttribute('aria-controls'));
                if (painel) painel.hidden = !sel;
            });
            if (focar) aba.focus();
            if (aoTrocar) aoTrocar(aba);
        }
        abas.forEach(function (a, i) {
            a.addEventListener('click', function () { selecionar(a); });
            a.addEventListener('keydown', function (e) {
                var n = null;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = abas[(i + 1) % abas.length];
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = abas[(i - 1 + abas.length) % abas.length];
                if (e.key === 'Home') n = abas[0];
                if (e.key === 'End') n = abas[abas.length - 1];
                if (n) { e.preventDefault(); selecionar(n, true); }
            });
        });
        return { abas: abas, selecionar: selecionar };
    }

    /* ---------- aulas: abas por unidade (lembra a última aberta) ---------- */
    (function () {
        var abas = ligarAbas($('#aulas .abas'), function (aba) { salvar('rc:unidade', aba.id); });
        if (!abas) return;
        var salva = null;
        try { salva = localStorage.getItem('rc:unidade'); } catch (e) { /* sem armazenamento */ }
        var aba = salva && document.getElementById(salva);
        if (aba && abas.abas.indexOf(aba) >= 0) abas.selecionar(aba);
    })();

    /* ---------- copiar código da Sala de Aula ---------- */
    (function () {
        var b = $('#copiar-codigo'), cod = $('#codigo-sala'), st = $('#copiar-status');
        if (!b || !cod) return;
        b.addEventListener('click', function () {
            var ok = function () { b.textContent = 'Copiado ✓'; if (st) st.textContent = 'Código copiado.'; setTimeout(function () { b.textContent = 'Copiar código'; }, 2200); };
            if (navigator.clipboard) navigator.clipboard.writeText(cod.textContent).then(ok, function () { b.textContent = 'Selecione e copie'; });
            else b.textContent = 'Selecione e copie';
        });
    })();

    /* ---------- laboratório: envio pelas camadas OSI ---------- */
    (function () {
        var raiz = $('#lab-envio');
        if (!raiz || !R) return;
        var entrada = $('#envio-texto'), pilha = $('#pilha-osi'), env = $('#envelope'),
            pdu = $('#envelope-pdu'), explica = $('#envelope-explica'), status = $('#envio-status'),
            bAv = $('#envio-avancar'), bVo = $('#envio-voltar'), bRe = $('#envio-reiniciar');
        var passo = -1; // -1 = mensagem ainda no aplicativo; 0..6 = camadas 7..1
        var dados;

        R.CAMADAS.forEach(function (c) {
            var li = document.createElement('li');
            li.innerHTML = '<span class="num"><span>' + c.n + '</span></span><span class="nome">' + c.nome + '</span>';
            li.title = c.nome;
            pilha.appendChild(li);
        });
        var itens = $$('li', pilha);

        function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

        function desenhar(animar) {
            dados = R.encapsular(entrada.value);
            itens.forEach(function (li, i) {
                li.classList.toggle('feita', i < passo);
                li.classList.toggle('atual', i === passo);
                if (i === passo) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
            });

            var p = passo >= 0 ? dados.passos[passo] : null;
            var partes = [];
            if (p && p.n === 1) {
                var b = p.bits;
                partes.push('<p class="bits">' + b.grupos.join(' ') + (b.cortado ? ' … (' + b.total + ' bytes no total)' : '') + '</p>');
            } else {
                // cabeçalhos da camada mais baixa (externa) para a mais alta
                for (var i = passo; i >= 0; i--) {
                    var c = dados.passos[i].cabecalho;
                    if (!c) continue;
                    partes.push('<span class="peca peca-' + dados.passos[i].n + (animar && i === passo ? ' nova' : '') + '"><b>' + esc(c.rotulo) + '</b>' + esc(c.valor) + '</span>');
                }
                partes.push('<span class="peca peca-dados"><b>dados</b>' + esc(dados.mensagem) + '</span>');
                if (passo >= 5) partes.push('<span class="peca peca-fcs' + (animar && passo === 5 ? ' nova' : '') + '"><b>final</b>FCS</span>');
            }
            env.innerHTML = partes.join('');

            if (!p) {
                pdu.innerHTML = 'No aplicativo · <b>Dados</b>';
                explica.textContent = 'Sua mensagem está pronta para sair. Toque em “Descer uma camada”.';
            } else {
                pdu.innerHTML = 'Camada ' + p.n + ' · ' + p.nome + ' · <b>' + p.pdu + '</b>';
                explica.textContent = p.funcao + (p.n === 1 ? ' No destino, o caminho é o inverso: sobe da camada 1 até a 7.' : '');
            }
            status.textContent = p
                ? 'Camada ' + p.n + ', ' + p.nome + '. ' + (p.cabecalho ? 'Acrescentou ' + p.cabecalho.rotulo + ': ' + p.cabecalho.valor + '. ' : 'Tudo virou bits. ') + 'Agora a unidade se chama ' + p.pdu + '.'
                : 'Mensagem no aplicativo.';
            bAv.disabled = passo >= 6;
            bVo.disabled = passo < 0;
        }

        bAv.addEventListener('click', function () { if (passo < 6) { passo++; desenhar(!calmo()); } });
        bVo.addEventListener('click', function () { if (passo > -1) { passo--; desenhar(false); } });
        bRe.addEventListener('click', function () { passo = -1; desenhar(false); });
        entrada.addEventListener('input', function () { desenhar(false); });
        desenhar(false);
    })();

    /* ---------- laboratório: cabo UTP ---------- */
    var FIOS = [
        { id: 'branco-laranja', nome: 'branco-laranja', cor: '#e8823a', listra: true },
        { id: 'laranja', nome: 'laranja', cor: '#e8823a' },
        { id: 'branco-verde', nome: 'branco-verde', cor: '#3fa45b', listra: true },
        { id: 'verde', nome: 'verde', cor: '#3fa45b' },
        { id: 'branco-azul', nome: 'branco-azul', cor: '#3b74c9', listra: true },
        { id: 'azul', nome: 'azul', cor: '#3b74c9' },
        { id: 'branco-marrom', nome: 'branco-marrom', cor: '#8b5a2b', listra: true },
        { id: 'marrom', nome: 'marrom', cor: '#8b5a2b' }
    ];
    (function () {
        var caixaFios = $('#fios'), conector = $('#conector');
        if (!caixaFios || !conector || !R) return;
        var resultado = $('#cabo-resultado'), dica = $('#dica-ordem'), bDica = $('#cabo-dica'),
            pontaB = $('#ponta-b'), selB = $('#ponta-b-padrao'), tipoB = $('#ponta-b-tipo');
        var seq = [null, null, null, null, null, null, null, null];
        var porId = {};
        FIOS.forEach(function (f) { porId[f.id] = f; });

        function padrao() { var r = $('input[name="padrao"]:checked'); return r ? r.value : 'T568B'; }

        FIOS.forEach(function (f) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'fio'; b.dataset.fio = f.id;
            b.innerHTML = '<span class="amostra' + (f.listra ? ' listrada' : '') + '" style="--cor:' + f.cor + '"></span>' + f.nome;
            b.addEventListener('click', function () {
                var i = seq.indexOf(null);
                if (i < 0) return;
                seq[i] = f.id;
                desenhar();
                var prox = $('.fio:not([disabled])', caixaFios);
                if (prox) prox.focus(); else $('#cabo-conferir').focus();
            });
            caixaFios.appendChild(b);
        });

        for (var p = 0; p < 8; p++) {
            var li = document.createElement('li');
            li.className = 'pino';
            li.innerHTML = '<button type="button" data-pino="' + p + '"></button><span>' + (p + 1) + '</span>';
            conector.appendChild(li);
        }
        $$('button', conector).forEach(function (b) {
            b.addEventListener('click', function () {
                var i = +b.dataset.pino;
                if (!seq[i]) return;
                seq[i] = null;
                desenhar();
            });
        });

        function desenhar(marcas) {
            $$('button', conector).forEach(function (b, i) {
                var f = seq[i] ? porId[seq[i]] : null;
                b.className = f ? 'cheio' + (f.listra ? ' listrada' : '') : '';
                b.style.setProperty('--cor', f ? f.cor : 'transparent');
                b.setAttribute('aria-label', 'Pino ' + (i + 1) + ': ' + (f ? f.nome + ' (toque para tirar)' : 'vazio'));
                if (marcas) b.classList.add(marcas.erros.indexOf(i) >= 0 ? 'erro' : (f ? 'certo' : 'x'));
            });
            $$('.fio', caixaFios).forEach(function (b) { b.disabled = seq.indexOf(b.dataset.fio) >= 0; });
            if (!marcas) { resultado.innerHTML = ''; pontaB.hidden = true; }
        }

        function mostrarDica() {
            var on = bDica.getAttribute('aria-pressed') === 'true';
            dica.hidden = !on;
            dica.innerHTML = R.PADROES[padrao()].map(function (c) { return '<li>' + c + '</li>'; }).join('');
        }

        function atualizarPontaB() {
            var t = R.tipoCabo(seq, R.PADROES[selB.value]);
            tipoB.innerHTML = t.tipo === 'direto'
                ? '<b>Cabo direto</b> (' + t.a + ' nas duas pontas): liga computador ao switch.'
                : '<b>Cabo crossover</b> (' + t.a + ' numa ponta e ' + t.b + ' na outra): liga dois equipamentos iguais, como dois computadores.';
        }

        $('#cabo-conferir').addEventListener('click', function () {
            var v = R.verificarSequencia(seq, padrao());
            desenhar(v);
            if (!v.completa && v.erros.length === 0) {
                resultado.innerHTML = '<span class="falta">Faltam fios.</span> Preencha os 8 pinos e confira de novo.';
            } else if (v.correta) {
                resultado.innerHTML = '<span class="ok">Tudo certo!</span> Esta ponta está no padrão ' + padrao() + '.';
                pontaB.hidden = false; atualizarPontaB();
            } else {
                var pinos = v.erros.map(function (i) { return i + 1; }).join(', ');
                resultado.innerHTML = '<span class="falta">Quase.</span> Confira ' + (v.erros.length === 1 ? 'o pino ' : 'os pinos ') + pinos + '. Toque no pino para tirar o fio.';
            }
        });
        $('#cabo-limpar').addEventListener('click', function () { seq = [null, null, null, null, null, null, null, null]; desenhar(); });
        bDica.addEventListener('click', function () {
            bDica.setAttribute('aria-pressed', String(bDica.getAttribute('aria-pressed') !== 'true'));
            bDica.textContent = bDica.getAttribute('aria-pressed') === 'true' ? 'Esconder a ordem' : 'Mostrar a ordem';
            mostrarDica();
        });
        $$('input[name="padrao"]').forEach(function (r) { r.addEventListener('change', function () { desenhar(); mostrarDica(); }); });
        selB.addEventListener('change', atualizarPontaB);
        desenhar();
    })();

    /* ---------- laboratório: em qual camada? ---------- */
    (function () {
        var opcoes = $('#quiz-opcoes');
        if (!opcoes || !R) return;
        var termo = $('#quiz-termo'), prog = $('#quiz-progresso'), ret = $('#quiz-retorno'),
            bProx = $('#quiz-proximo'), bRe = $('#quiz-reiniciar');
        var lista, atual, acertos;

        R.CAMADAS.forEach(function (c) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'opcao'; b.dataset.n = c.n;
            b.innerHTML = '<span class="num">' + c.n + '</span>' + c.nome;
            b.addEventListener('click', function () { responder(c.n, b); });
            opcoes.appendChild(b);
        });
        var botoes = $$('.opcao', opcoes);

        function iniciar() {
            lista = R.embaralhar(R.ITENS_CAMADA, Date.now() % 100000);
            atual = 0; acertos = 0; mostrar();
        }
        function mostrar() {
            var item = lista[atual];
            if (!item) {
                termo.textContent = 'Fim!';
                prog.textContent = 'Você acertou ' + acertos + ' de ' + lista.length + '.';
                ret.innerHTML = 'Quer tentar de novo? Toque em “Recomeçar”.';
                botoes.forEach(function (b) { b.disabled = true; b.className = 'opcao'; });
                bProx.disabled = true;
                return;
            }
            termo.textContent = item.termo;
            prog.textContent = 'Item ' + (atual + 1) + ' de ' + lista.length + ' · ' + acertos + (acertos === 1 ? ' acerto' : ' acertos');
            ret.innerHTML = '';
            botoes.forEach(function (b) { b.disabled = false; b.className = 'opcao'; });
            bProx.disabled = true;
        }
        function responder(n, botao) {
            var r = R.conferirCamada(lista[atual], n);
            if (r.certo) acertos++;
            botoes.forEach(function (b) {
                b.disabled = true;
                if (+b.dataset.n === r.correta) b.classList.add('certa');
            });
            if (!r.certo) botao.classList.add('errada');
            ret.innerHTML = '<b>' + (r.certo ? 'Isso mesmo!' : 'É a camada ' + r.correta + ' · ' + R.camada(r.correta).nome + '.') + '</b>' + r.porque;
            prog.textContent = 'Item ' + (atual + 1) + ' de ' + lista.length + ' · ' + acertos + (acertos === 1 ? ' acerto' : ' acertos');
            bProx.disabled = false;
            bProx.focus();
        }
        bProx.addEventListener('click', function () { atual++; mostrar(); });
        bRe.addEventListener('click', iniciar);
        iniciar();
        ligarAbas($('#laboratorio .abas'));
    })();
})();
