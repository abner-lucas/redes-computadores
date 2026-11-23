// Rodar: node --test testes/
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../logica.js');

test('modelo OSI tem 7 camadas, da 7 à 1, com as PDUs certas', () => {
    assert.deepEqual(R.CAMADAS.map(c => c.n), [7, 6, 5, 4, 3, 2, 1]);
    assert.equal(R.camada(4).pdu, 'Segmento');
    assert.equal(R.camada(3).pdu, 'Pacote');
    assert.equal(R.camada(2).pdu, 'Quadro');
    assert.equal(R.camada(1).pdu, 'Bits');
    assert.equal(R.camada(9), null);
});

test('texto vira bits em UTF-8 (acento ocupa 2 bytes)', () => {
    assert.deepEqual(R.textoParaBits('A').grupos, ['01000001']);
    const o = R.textoParaBits('ó');
    assert.equal(o.total, 2);
    assert.deepEqual(o.grupos, ['11000011', '10110011']);
    const longo = R.textoParaBits('redes', 2);
    assert.equal(longo.grupos.length, 2);
    assert.equal(longo.cortado, true);
});

test('encapsular desce da Aplicação à Física com os cabeçalhos de cada camada', () => {
    const r = R.encapsular('Oi');
    assert.equal(r.passos.length, 7);
    assert.deepEqual(r.passos.map(p => p.n), [7, 6, 5, 4, 3, 2, 1]);
    assert.match(r.passos[3].cabecalho.valor, /porta 49152 → 80/);
    assert.match(r.passos[4].cabecalho.valor, /192\.168\.0\.15 → 192\.168\.0\.1/);
    assert.equal(r.passos[5].cabecalho.final, 'FCS');
    assert.equal(r.passos[6].cabecalho, null);
    assert.deepEqual(r.passos[6].bits.grupos, ['01001111', '01101001']);
});

test('mensagem vazia usa um texto padrão e opções trocam a porta', () => {
    assert.equal(R.encapsular('   ').mensagem, 'Olá, rede!');
    assert.match(R.encapsular('x', { portaDestino: 443 }).passos[3].cabecalho.valor, /→ 443/);
});

test('T568A e T568B: só verde e laranja trocam de lugar', () => {
    const a = R.PADROES.T568A, b = R.PADROES.T568B;
    const diferentes = a.map((c, i) => c !== b[i] ? i + 1 : 0).filter(Boolean);
    assert.deepEqual(diferentes, [1, 2, 3, 6]);
    assert.equal(R.verificarSequencia(b, 'T568B').correta, true);
    assert.equal(R.identificarPadrao(a), 'T568A');
});

test('sequência com erro aponta as posições erradas', () => {
    const seq = R.PADROES.T568B.slice();
    [seq[0], seq[1]] = [seq[1], seq[0]];
    const v = R.verificarSequencia(seq, 'T568B');
    assert.equal(v.correta, false);
    assert.deepEqual(v.erros, [0, 1]);
    const incompleta = R.verificarSequencia(['branco-laranja'], 'T568B');
    assert.equal(incompleta.completa, false);
    assert.deepEqual(incompleta.erros, []);
});

test('mesmo padrão nas duas pontas = direto; padrões diferentes = crossover', () => {
    assert.equal(R.tipoCabo(R.PADROES.T568B, R.PADROES.T568B).tipo, 'direto');
    assert.equal(R.tipoCabo(R.PADROES.T568A, R.PADROES.T568B).tipo, 'crossover');
    assert.equal(R.tipoCabo(['azul'], R.PADROES.T568B).tipo, 'invalido');
});

test('jogo das camadas: resposta certa, errada e embaralhar com semente', () => {
    const roteador = R.ITENS_CAMADA.find(i => i.termo === 'Roteador');
    assert.equal(R.conferirCamada(roteador, 3).certo, true);
    assert.equal(R.conferirCamada(roteador, 2).certo, false);
    const x = R.embaralhar(R.ITENS_CAMADA, 7), y = R.embaralhar(R.ITENS_CAMADA, 7);
    assert.deepEqual(x, y);
    assert.equal(x.length, R.ITENS_CAMADA.length);
    R.ITENS_CAMADA.forEach(i => assert.ok(i.camada >= 1 && i.camada <= 7));
});

test('normalizar tira acentos e maiúsculas', () => {
    assert.equal(R.normalizar('Física ÓPTICA'), 'fisica optica');
});
