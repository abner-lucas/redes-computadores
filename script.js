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

    /* ---------- rota (traceroute): salto atual, pacote que viaja, rótulo do topo ---------- */
    var cenas = $$('[data-cena]');
    var conexoes = $$('[data-conexao]');
    var rota = $('#rota');
    var saltos = rota ? $$('a[data-salto]', rota) : [];
    var secoes = saltos.map(function (a) { return $(a.getAttribute('href')); });
    var listaRota = rota ? $('ol', rota) : null;
    var topoSalto = $('#topo-salto'), topoNome = $('#topo-nome');
    var largo = window.matchMedia('(min-width: 1180px)');

    function atualizarCenas() {
        var vh = window.innerHeight;
        cenas.forEach(function (s) {
            var palco = s.classList.contains('secao-palco');
            var alvo = palco ? s : s.firstElementChild;
            var p = (vh - s.getBoundingClientRect().top) / (vh * 0.35);
            p = Math.max(0, Math.min(1, p));
            if (calmo() || p >= 1) { alvo.style.clipPath = alvo.style.transform = alvo.style.opacity = ''; return; }
            var q = 1 - p;
            alvo.style.clipPath = palco
                ? 'inset(' + (4 * q) + '% ' + (5 * q) + '% 0% ' + (5 * q) + '% round ' + (28 + 20 * q) + 'px)'
                : 'inset(' + (3 * q) + '% ' + (2 * q) + '% 0% ' + (2 * q) + '% round ' + (40 * q) + 'px)';
            alvo.style.transform = 'translateY(' + (48 * q) + 'px)';
            alvo.style.opacity = String(0.7 + 0.3 * Math.min(1, p / 0.4));
        });
        // plugue desce até encaixar quando a conexão passa de ~75% da tela
        conexoes.forEach(function (c) {
            var t = c.getBoundingClientRect().top;
            var p = calmo() ? 1 : Math.max(0, Math.min(1, (vh * 0.95 - t) / (vh * 0.25)));
            c.style.setProperty('--p', p.toFixed(3));
            c.classList.toggle('encaixado', p >= 0.98);
        });
    }

    function atualizarRota() {
        if (!rota || !secoes.length) return;
        var marco = window.innerHeight * 0.35;
        var atual = 0, frac = 0;
        for (var i = 0; i < secoes.length; i++) {
            if (secoes[i] && secoes[i].getBoundingClientRect().top <= marco) atual = i;
        }
        var s = secoes[atual], prox = secoes[atual + 1];
        if (s && prox) {
            var a = s.getBoundingClientRect().top, b = prox.getBoundingClientRect().top;
            frac = Math.max(0, Math.min(1, (marco - a) / Math.max(1, b - a)));
        }
        if (html.scrollHeight - window.innerHeight - window.scrollY < 4) { atual = secoes.length - 1; frac = 0; }

        saltos.forEach(function (lk, i) {
            lk.setAttribute('aria-current', String(i === atual));
            lk.classList.toggle('passou', i < atual);
        });

        // posição do pacote entre o nó atual e o próximo
        var nos = saltos.map(function (lk) { return $('.rota-no', lk); });
        var base = listaRota.getBoundingClientRect();
        var r1 = nos[atual].getBoundingClientRect();
        var r2 = nos[Math.min(atual + 1, nos.length - 1)].getBoundingClientRect();
        if (largo.matches) {
            var y1 = r1.top + r1.height / 2 - base.top, y2 = r2.top + r2.height / 2 - base.top;
            var y = y1 + (y2 - y1) * frac;
            rota.style.setProperty('--rota-y', Math.max(0, y - 8).toFixed(1) + 'px');
            rota.style.setProperty('--pac-y', (y - 5).toFixed(1) + 'px');
        } else {
            var x0 = nos[0].getBoundingClientRect().left;
            var x1 = r1.left - x0, x2 = r2.left - x0;
            var rx = x1 + (x2 - x1) * frac;
            rota.style.setProperty('--rota-x', rx.toFixed(1) + 'px');
            var rr = rota.getBoundingClientRect(), n0 = nos[0].getBoundingClientRect();
            rota.style.setProperty('--pac-x', (n0.left + n0.width / 2 - rr.left - 5 + rx).toFixed(1) + 'px');
        }
        var cores = ['#f0a067', '#7fd6ff', '#7fd39c', '#7fb2f0', '#d6a682'];
        var pac = $('#rota-pacote');
        if (pac) { pac.style.background = cores[atual]; pac.style.boxShadow = '0 0 12px ' + cores[atual]; }

        if (topoSalto) topoSalto.textContent = 'salto ' + (atual + 1) + ' de ' + saltos.length;
        if (topoNome) topoNome.textContent = $('.rota-nome', saltos[atual]).textContent.toLowerCase();
    }

    var topoEl = $('#topo'), ultimoY = window.scrollY;
    var saltosTrace = $$('.traceroute li');
    function aoRolar() {
        atualizarCenas(); atualizarRota();
        var y = window.scrollY;
        var painelAberto = $('#painel-conforto') && !$('#painel-conforto').hidden;
        if (topoEl) topoEl.classList.toggle('escondido', !calmo() && !painelAberto && y > ultimoY && y > 400);
        ultimoY = y;
        saltosTrace.forEach(function (li) { li.classList.toggle('ativa', li.getBoundingClientRect().top < window.innerHeight * 0.75); });
    }
    var pedido = false;
    window.addEventListener('scroll', function () {
        if (pedido) return;
        pedido = true;
        requestAnimationFrame(function () { pedido = false; aoRolar(); });
    }, { passive: true });
    window.addEventListener('resize', aoRolar);
    aoRolar();

    /* ---------- malha de fundo: nós, enlaces e pacotes (canvas) ---------- */
    (function () {
        var tela = $('#malha');
        if (!tela || !tela.getContext) return;
        var ctx = tela.getContext('2d');
        var nos = [], enlaces = [], pacotes = [];
        var largura = 0, altura = 0, dpr = 1;
        var ponteiro = { x: -999, y: -999 };
        var CORES = ['240,160,103', '127,211,156', '127,178,240', '214,166,130', '127,214,255'];
        var rodando = false, ultimo = 0;

        function cor(nome) { return getComputedStyle(html).getPropertyValue(nome).trim() || '127,214,255'; }

        // gerador com semente: a malha é sempre a mesma para o mesmo tamanho de tela
        function aleatorio(semente) {
            var s = semente >>> 0;
            return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        }

        function montar() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            largura = window.innerWidth; altura = window.innerHeight;
            tela.width = largura * dpr; tela.height = altura * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var rnd = aleatorio(largura * 7 + altura);
            var passo = largura < 700 ? 120 : 150;
            nos = [];
            for (var y = passo / 2; y < altura + passo; y += passo) {
                for (var x = passo / 2; x < largura + passo; x += passo) {
                    nos.push({ x: x + (rnd() - 0.5) * passo * 0.8, y: y + (rnd() - 0.5) * passo * 0.8, r: 1.2 + rnd() * 1.8, hub: rnd() < 0.12 });
                }
            }
            enlaces = [];
            nos.forEach(function (a, i) {
                var perto = nos.map(function (b, j) { return { j: j, d: Math.hypot(a.x - b.x, a.y - b.y) }; })
                    .filter(function (o) { return o.j !== i; }).sort(function (p, q) { return p.d - q.d; }).slice(0, 2);
                perto.forEach(function (o) {
                    if (o.d < passo * 1.6 && !enlaces.some(function (e) { return (e.a === o.j && e.b === i); })) enlaces.push({ a: i, b: o.j });
                });
            });
            pacotes = [];
            var qtd = largura < 700 ? 5 : 9;
            for (var k = 0; k < qtd; k++) pacotes.push(novoPacote(rnd));
        }

        function novoPacote(rnd) {
            rnd = rnd || Math.random;
            return { e: Math.floor(rnd() * enlaces.length), t: rnd(), v: 0.04 + rnd() * 0.05, c: CORES[Math.floor(rnd() * CORES.length)], ida: rnd() < 0.5 };
        }

        function desenhar(dt) {
            ctx.clearRect(0, 0, largura, altura);
            var cn = cor('--malha-no'), cl = cor('--malha-linha');
            ctx.lineWidth = 1;
            enlaces.forEach(function (e) {
                var a = nos[e.a], b = nos[e.b];
                var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                var perto = Math.max(0, 1 - Math.hypot(mx - ponteiro.x, my - ponteiro.y) / 220);
                ctx.strokeStyle = 'rgba(' + cl + ',' + (0.22 + perto * 0.5).toFixed(3) + ')';
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            });
            nos.forEach(function (n) {
                var perto = Math.max(0, 1 - Math.hypot(n.x - ponteiro.x, n.y - ponteiro.y) / 180);
                ctx.fillStyle = 'rgba(' + cn + ',' + (0.45 + perto * 0.55).toFixed(3) + ')';
                if (n.hub) {
                    ctx.fillRect(n.x - 4, n.y - 3, 8, 6);
                } else {
                    ctx.beginPath(); ctx.arc(n.x, n.y, n.r + perto * 1.5, 0, Math.PI * 2); ctx.fill();
                }
            });
            if (calmo() || !enlaces.length) return;
            pacotes.forEach(function (p, i) {
                p.t += p.v * dt;
                if (p.t >= 1) { pacotes[i] = novoPacote(); return; }
                var e = enlaces[p.e]; if (!e) return;
                var a = nos[p.ida ? e.a : e.b], b = nos[p.ida ? e.b : e.a];
                var x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
                var g = ctx.createRadialGradient(x, y, 0, x, y, 10);
                g.addColorStop(0, 'rgba(' + p.c + ',.9)'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(' + p.c + ',1)'; ctx.fillRect(x - 2, y - 2, 4, 4);
            });
        }

        function quadro(t) {
            if (!rodando) return;
            var dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0.016;
            ultimo = t;
            desenhar(dt);
            requestAnimationFrame(quadro);
        }
        function iniciar() {
            if (calmo() || document.hidden) { rodando = false; desenhar(0); return; }
            if (rodando) return;
            rodando = true; ultimo = 0; requestAnimationFrame(quadro);
        }

        montar(); iniciar();
        var espera;
        window.addEventListener('resize', function () { clearTimeout(espera); espera = setTimeout(function () { montar(); desenhar(0); }, 200); });
        window.addEventListener('pointermove', function (e) { ponteiro.x = e.clientX; ponteiro.y = e.clientY; if (!rodando) desenhar(0); }, { passive: true });
        document.addEventListener('visibilitychange', function () { if (document.hidden) rodando = false; else iniciar(); });
        // reage às trocas do painel de conforto (modo calmo e tema)
        new MutationObserver(function () { rodando = false; iniciar(); })
            .observe(html, { attributes: true, attributeFilter: ['data-calmo', 'data-tema'] });
    })();

    /* ---------- revelação em cascata ---------- */
    (function () {
        var grupos = ['.vitrine > .projeto', '.biblioteca > li', '.avisos > li', '.traceroute > li', '.ementa', '.mural > article'];
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

    /* ---------- cortina: marca a visita da sessão ---------- */
    try { sessionStorage.setItem('rc:visitado', '1'); } catch (e) { /* sem armazenamento */ }

    /* ---------- títulos palavra a palavra (máscara) ---------- */
    (function () {
        var titulos = $$('[data-palavras]');
        titulos.forEach(function (t) {
            var texto = t.textContent.replace(/\s+/g, ' ').trim();
            t.setAttribute('aria-label', texto);
            t.textContent = '';
            texto.split(' ').forEach(function (p, i) {
                var m = document.createElement('span'); m.className = 'palavra'; m.setAttribute('aria-hidden', 'true');
                var d = document.createElement('span'); d.textContent = p; d.style.setProperty('--i', i);
                m.appendChild(d); t.appendChild(m); t.appendChild(document.createTextNode(' '));
            });
        });
        if (!('IntersectionObserver' in window)) { titulos.forEach(function (t) { t.classList.add('visivel'); }); return; }
        var obs = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        titulos.forEach(function (t) { obs.observe(t); });
    })();

    /* ---------- cursor deslizante dos filtros ---------- */
    function posicionarCursor(grupo) {
        var cursor = $('.seletor-cursor', grupo), b = $('.filtro[aria-pressed="true"]', grupo);
        if (!cursor || !b) return;
        cursor.style.width = b.offsetWidth + 'px';
        cursor.style.height = b.offsetHeight + 'px';
        cursor.style.transform = 'translate(' + b.offsetLeft + 'px, ' + b.offsetTop + 'px)';
    }
    $$('.seletor').forEach(function (g) {
        posicionarCursor(g);
        window.addEventListener('resize', function () { posicionarCursor(g); });
        if (document.fonts) document.fonts.ready.then(function () { posicionarCursor(g); });
    });

    /* ---------- filtros (vitrine e biblioteca) ---------- */
    $$('.filtros').forEach(function (grupo) {
        var alvo = $(grupo.dataset.filtroAlvo);
        if (!alvo) return;
        var botoes = $$('.filtro', grupo);
        botoes.forEach(function (b) {
            b.addEventListener('click', function () {
                var f = b.dataset.filtro;
                botoes.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
                posicionarCursor(grupo);
                $$('[data-tipo]', alvo).forEach(function (item) {
                    var tipos = item.dataset.tipo.split(' ');
                    item.hidden = !(f === 'todos' || tipos.indexOf(f) >= 0);
                    if (!item.hidden) item.classList.add('visivel');
                });
            });
        });
    });

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
