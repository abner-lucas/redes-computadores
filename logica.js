/*
 * logica.js · Redes de Computadores
 * Regras puras dos laboratórios (sem DOM). Funciona no navegador (window.Redes)
 * e no Node (require), para ser testada com: node --test testes/
 */
(function (raiz, fabrica) {
    if (typeof module === 'object' && module.exports) module.exports = fabrica();
    else raiz.Redes = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------- Modelo OSI ---------- */
    var CAMADAS = [
        { n: 7, nome: 'Aplicação', pdu: 'Dados', funcao: 'É onde os programas conversam com a rede.', exemplos: 'HTTP, DNS, e-mail (SMTP)' },
        { n: 6, nome: 'Apresentação', pdu: 'Dados', funcao: 'Ajusta o formato: codifica, comprime e criptografa.', exemplos: 'UTF-8, JPEG, TLS' },
        { n: 5, nome: 'Sessão', pdu: 'Dados', funcao: 'Abre, mantém e encerra a conversa entre os dois lados.', exemplos: 'controle de sessão, RPC' },
        { n: 4, nome: 'Transporte', pdu: 'Segmento', funcao: 'Entrega de ponta a ponta, usando portas, e confere erros.', exemplos: 'TCP, UDP' },
        { n: 3, nome: 'Rede', pdu: 'Pacote', funcao: 'Dá o endereço lógico (IP) e escolhe a rota.', exemplos: 'IP, ICMP · roteador' },
        { n: 2, nome: 'Enlace de Dados', pdu: 'Quadro', funcao: 'Entrega dentro da mesma rede, pelo endereço físico (MAC).', exemplos: 'Ethernet, Wi-Fi · switch' },
        { n: 1, nome: 'Física', pdu: 'Bits', funcao: 'Transforma tudo em sinais no meio: cabo, fibra ou rádio.', exemplos: 'cabo UTP, fibra · hub' }
    ];

    function camada(n) {
        for (var i = 0; i < CAMADAS.length; i++) if (CAMADAS[i].n === n) return CAMADAS[i];
        return null;
    }

    /* Texto -> bits (UTF-8), agrupados em bytes. limite = máximo de bytes mostrados. */
    function textoParaBits(texto, limite) {
        var bytes = utf8(String(texto || ''));
        var max = typeof limite === 'number' ? limite : bytes.length;
        var grupos = [];
        for (var i = 0; i < bytes.length && i < max; i++) {
            grupos.push(('00000000' + bytes[i].toString(2)).slice(-8));
        }
        return { grupos: grupos, total: bytes.length, cortado: bytes.length > max };
    }

    function utf8(s) {
        if (typeof TextEncoder !== 'undefined') return Array.prototype.slice.call(new TextEncoder().encode(s));
        var r = [], e = unescape(encodeURIComponent(s));
        for (var i = 0; i < e.length; i++) r.push(e.charCodeAt(i));
        return r;
    }

    /*
     * Encapsulamento: devolve os 7 passos, da Aplicação (7) até a Física (1).
     * Cada passo traz o cabeçalho que a camada acrescenta.
     */
    var PADRAO_ENVIO = {
        portaOrigem: 49152, portaDestino: 80,
        ipOrigem: '192.168.0.15', ipDestino: '192.168.0.1',
        macOrigem: 'AA:BB:CC:00:00:15', macDestino: 'AA:BB:CC:00:00:01'
    };

    function encapsular(mensagem, opcoes) {
        var o = {};
        for (var k in PADRAO_ENVIO) o[k] = PADRAO_ENVIO[k];
        if (opcoes) for (var j in opcoes) o[j] = opcoes[j];
        var texto = String(mensagem || '').trim() || 'Olá, rede!';

        var cab = {
            7: { rotulo: 'HTTP', valor: 'GET /mensagem' },
            6: { rotulo: 'Formato', valor: 'UTF-8' },
            5: { rotulo: 'Sessão', valor: 'nº 0042' },
            4: { rotulo: 'TCP', valor: 'porta ' + o.portaOrigem + ' → ' + o.portaDestino },
            3: { rotulo: 'IP', valor: o.ipOrigem + ' → ' + o.ipDestino },
            2: { rotulo: 'MAC', valor: o.macOrigem + ' → ' + o.macDestino, final: 'FCS' },
            1: null
        };

        var passos = [];
        for (var n = 7; n >= 1; n--) {
            var c = camada(n);
            passos.push({
                n: n, nome: c.nome, pdu: c.pdu, funcao: c.funcao,
                cabecalho: cab[n],
                bits: n === 1 ? textoParaBits(texto, 4) : null
            });
        }
        return { mensagem: texto, passos: passos };
    }

    /* ---------- Cabo UTP: T568A e T568B ---------- */
    var PADROES = {
        T568A: ['branco-verde', 'verde', 'branco-laranja', 'azul', 'branco-azul', 'laranja', 'branco-marrom', 'marrom'],
        T568B: ['branco-laranja', 'laranja', 'branco-verde', 'azul', 'branco-azul', 'verde', 'branco-marrom', 'marrom']
    };

    function verificarSequencia(seq, padrao) {
        var alvo = PADROES[padrao];
        if (!alvo) throw new Error('Padrão desconhecido: ' + padrao);
        var erros = [];
        for (var i = 0; i < 8; i++) if (seq[i] && seq[i] !== alvo[i]) erros.push(i);
        var preenchidos = 0;
        for (var p = 0; p < 8; p++) if (seq[p]) preenchidos++;
        return { completa: preenchidos === 8, correta: preenchidos === 8 && erros.length === 0, erros: erros };
    }

    function identificarPadrao(seq) {
        for (var nome in PADROES) {
            if (verificarSequencia(seq, nome).correta) return nome;
        }
        return null;
    }

    /* Ponta A + ponta B -> direto (mesmo padrão), crossover (padrões diferentes) ou inválido. */
    function tipoCabo(seqA, seqB) {
        var a = identificarPadrao(seqA), b = identificarPadrao(seqB);
        if (!a || !b) return { tipo: 'invalido', a: a, b: b };
        return { tipo: a === b ? 'direto' : 'crossover', a: a, b: b };
    }

    /* ---------- Jogo "Em qual camada?" ---------- */
    var ITENS_CAMADA = [
        { termo: 'HTTP (abrir um site)', camada: 7, porque: 'É um protocolo usado diretamente pelo navegador.' },
        { termo: 'DNS (traduz nome em IP)', camada: 7, porque: 'É um serviço que os programas pedem à rede.' },
        { termo: 'Criptografia da conexão', camada: 6, porque: 'Mudar o formato dos dados é tarefa da Apresentação.' },
        { termo: 'Compressão de imagem (JPEG)', camada: 6, porque: 'Codificar e comprimir é tarefa da Apresentação.' },
        { termo: 'Abrir e encerrar o diálogo', camada: 5, porque: 'Controlar a conversa é o papel da Sessão.' },
        { termo: 'Porta 80', camada: 4, porque: 'Portas identificam o programa: isso é Transporte.' },
        { termo: 'TCP e UDP', camada: 4, porque: 'São os protocolos de Transporte.' },
        { termo: 'Endereço IP', camada: 3, porque: 'O IP é o endereço lógico, da camada de Rede.' },
        { termo: 'Roteador', camada: 3, porque: 'Ele escolhe o caminho entre redes pelo IP.' },
        { termo: 'Endereço MAC', camada: 2, porque: 'O MAC é o endereço físico da placa, do Enlace.' },
        { termo: 'Switch', camada: 2, porque: 'Ele encaminha quadros pelo endereço MAC.' },
        { termo: 'Cabo UTP', camada: 1, porque: 'O cabo é o meio por onde passam os sinais.' },
        { termo: 'Hub', camada: 1, porque: 'Ele só repete o sinal para todas as portas.' },
        { termo: 'Fibra óptica', camada: 1, porque: 'É um meio de transmissão: camada Física.' }
    ];

    function conferirCamada(item, resposta) {
        return { certo: item.camada === resposta, correta: item.camada, porque: item.porque };
    }

    /* Embaralhar com semente: a mesma semente gera sempre a mesma ordem (teste). */
    function embaralhar(lista, semente) {
        var r = lista.slice(), s = (semente >>> 0) || 1;
        for (var i = r.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) >>> 0;
            var j = s % (i + 1);
            var t = r[i]; r[i] = r[j]; r[j] = t;
        }
        return r;
    }

    function normalizar(t) {
        return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    return {
        CAMADAS: CAMADAS, camada: camada, textoParaBits: textoParaBits, encapsular: encapsular,
        PADROES: PADROES, verificarSequencia: verificarSequencia, identificarPadrao: identificarPadrao, tipoCabo: tipoCabo,
        ITENS_CAMADA: ITENS_CAMADA, conferirCamada: conferirCamada, embaralhar: embaralhar,
        normalizar: normalizar
    };
});
