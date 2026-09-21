/* ════════════════════════════════════════════════════════════════
   js/cofre.js — Núcleo do prontuário: criptografia, modelo e regras.

   Sem DOM. Roda no navegador (window.Cofre) e no Node (testes).

   Por que assim:
   - Prontuário é dado pessoal sensível (LGPD) e sigiloso (Resolução
     COFFITO nº 414/2012, art. 3º e art. 6º, II). Nada sai do aparelho:
     o banco inteiro fica no navegador, cifrado.
   - AES-GCM 256 com chave derivada da senha por PBKDF2-SHA-256. O GCM
     autentica: senha errada ou arquivo adulterado falham, nunca abrem
     "meio certo".
   - A senha nunca é guardada. Sem senha não há como abrir — nem por
     nós. Esquecer a senha = perder o acesso; por isso o backup.
   - Guarda mínima de 5 anos a contar do último registro (art. 6º, I):
     o modelo impede excluir antes disso; antes, só arquivar.
   - Registro eletrônico traz nome completo e número no CREFITO de quem
     registra (art. 2º): toda evolução leva a autoria.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var Cofre = {};
  Cofre.ITERACOES = 310000;
  Cofre.SENHA_MINIMA = 8;
  Cofre.ANOS_GUARDA = 5;
  Cofre.FORMATO = 'vf-cofre';

  var codificador = new TextEncoder();
  var decodificador = new TextDecoder();

  function cripto() {
    var c = raiz.crypto || (typeof globalThis !== 'undefined' ? globalThis.crypto : null);
    if (!c || !c.subtle) {
      throw new Error('Este navegador não oferece criptografia segura. Abra a suíte pelo endereço https:// ou pelo arquivo no computador.');
    }
    return c;
  }
  function paraB64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function deB64(t) {
    var s = atob(t), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function idNovo() {
    var b = cripto().getRandomValues(new Uint8Array(9));
    return Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  /* ── criptografia ─────────────────────────────────────────────── */
  Cofre.validarSenha = function (senha) {
    if (typeof senha !== 'string' || senha.length < Cofre.SENHA_MINIMA) {
      throw new Error('A senha precisa ter pelo menos ' + Cofre.SENHA_MINIMA + ' caracteres.');
    }
  };

  Cofre.derivarChave = async function (senha, sal, iteracoes) {
    var c = cripto();
    var base = await c.subtle.importKey('raw', codificador.encode(senha), 'PBKDF2', false, ['deriveKey']);
    return c.subtle.deriveKey(
      { name: 'PBKDF2', salt: sal, iterations: iteracoes, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  Cofre.cifrar = async function (sessao, banco) {
    var c = cripto();
    var iv = c.getRandomValues(new Uint8Array(12));
    var ct = await c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, sessao.chave,
      codificador.encode(JSON.stringify(banco)));
    return { formato: Cofre.FORMATO, v: 1, iter: sessao.iter, sal: paraB64(sessao.sal),
             iv: paraB64(iv), dados: paraB64(ct), cifradoEm: new Date().toISOString() };
  };

  Cofre.validarEnvelope = function (env) {
    if (!env || env.formato !== Cofre.FORMATO || env.v !== 1 ||
        !env.sal || !env.iv || !env.dados || !(env.iter > 0)) {
      throw new Error('Este arquivo não é um backup do prontuário.');
    }
  };

  /* Abre um envelope com a senha. Devolve a sessão (chave em memória)
     e o banco decifrado. */
  Cofre.abrir = async function (senha, env) {
    Cofre.validarEnvelope(env);
    var sal = deB64(env.sal);
    var chave = await Cofre.derivarChave(senha, sal, env.iter);
    var banco;
    try {
      var pt = await cripto().subtle.decrypt({ name: 'AES-GCM', iv: deB64(env.iv) }, chave, deB64(env.dados));
      banco = JSON.parse(decodificador.decode(pt));
    } catch (e) {
      throw new Error('Senha incorreta ou arquivo danificado.');
    }
    Cofre.validarBanco(banco);
    return { sessao: { chave: chave, sal: sal, iter: env.iter }, banco: banco };
  };

  Cofre.criar = async function (senha) {
    Cofre.validarSenha(senha);
    var sal = cripto().getRandomValues(new Uint8Array(16));
    var sessao = { chave: await Cofre.derivarChave(senha, sal, Cofre.ITERACOES), sal: sal, iter: Cofre.ITERACOES };
    var banco = Cofre.bancoVazio();
    return { sessao: sessao, banco: banco, envelope: await Cofre.cifrar(sessao, banco) };
  };

  /* Troca de senha: novo sal, nova chave, mesmo conteúdo. */
  Cofre.trocarSenha = async function (banco, novaSenha) {
    Cofre.validarSenha(novaSenha);
    var sal = cripto().getRandomValues(new Uint8Array(16));
    var sessao = { chave: await Cofre.derivarChave(novaSenha, sal, Cofre.ITERACOES), sal: sal, iter: Cofre.ITERACOES };
    return { sessao: sessao, envelope: await Cofre.cifrar(sessao, banco) };
  };

  /* ── modelo ───────────────────────────────────────────────────── */
  Cofre.bancoVazio = function () {
    return { versao: 1, criadoEm: new Date().toISOString(), pacientes: [] };
  };

  Cofre.validarBanco = function (b) {
    if (!b || b.versao !== 1 || !Array.isArray(b.pacientes)) {
      throw new Error('O conteúdo do prontuário não está no formato esperado.');
    }
  };

  Cofre.ETAPAS = ['Avaliação', 'Em tratamento', 'Alta', 'Pós-alta'];

  Cofre.novaPaciente = function (dados) {
    var d = dados || {};
    var nome = String(d.nome || '').trim();
    if (!nome) throw new Error('Informe o nome da paciente.');
    var agora = new Date().toISOString();
    return {
      id: idNovo(),
      nome: nome,
      nascimento: d.nascimento || '',
      telefone: d.telefone || '',
      origem: d.origem || '',
      encaminhadoPor: d.encaminhadoPor || '',
      consentimentoRegistro: !!d.consentimentoRegistro,
      consentimentoWhatsapp: !!d.consentimentoWhatsapp,
      etapa: d.etapa || 'Avaliação',
      proximaAcao: { texto: '', data: '' },
      arquivada: false,
      /* Conteúdo mínimo do prontuário — Resolução COFFITO 414/2012, art. 1º, § 1º */
      historia: '', exameFisico: '', examesComplementares: '',
      diagnostico: '', prognostico: '', plano: '',
      evolucoes: [],
      criadoEm: agora,
      atualizadoEm: agora
    };
  };

  /* Evolução é só de acréscimo: não se edita nem apaga. Para corrigir,
     registra-se uma retificação que aponta para a original — é assim
     que um prontuário mantém sua história. */
  Cofre.novaEvolucao = function (texto, data, autoria, retificaId) {
    var t = String(texto || '').trim();
    if (!t) throw new Error('Escreva a evolução antes de registrar.');
    if (!autoria || !autoria.nome || !autoria.registro) {
      throw new Error('A evolução precisa do nome e do registro de quem registra.');
    }
    return {
      id: idNovo(),
      data: data || new Date().toISOString().slice(0, 10),
      texto: t,
      autora: autoria.nome,
      registro: autoria.registro,
      retificaId: retificaId || null,
      criadoEm: new Date().toISOString()
    };
  };

  Cofre.ultimoRegistro = function (p) {
    var datas = [p.atualizadoEm, p.criadoEm].concat((p.evolucoes || []).map(function (e) { return e.criadoEm; }));
    return datas.filter(Boolean).sort().pop() || p.criadoEm;
  };

  /* Resolução 414/2012, art. 6º, I: guarda mínima de 5 anos a contar do
     último registro. Antes disso a paciente só pode ser arquivada. */
  Cofre.podeExcluir = function (p, hoje) {
    var limite = new Date(Cofre.ultimoRegistro(p));
    limite.setFullYear(limite.getFullYear() + Cofre.ANOS_GUARDA);
    return (hoje || new Date()) >= limite;
  };

  Cofre.dataLiberacao = function (p) {
    var d = new Date(Cofre.ultimoRegistro(p));
    d.setFullYear(d.getFullYear() + Cofre.ANOS_GUARDA);
    return d;
  };

  Cofre.buscar = function (banco, termo, incluirArquivadas) {
    var t = String(termo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return banco.pacientes.filter(function (p) {
      if (!incluirArquivadas && p.arquivada) return false;
      if (!t) return true;
      return p.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().indexOf(t) !== -1;
    }).sort(function (a, b) {
      /* primeiro quem tem próxima ação com data, pela data; depois alfabético */
      var da = a.proximaAcao && a.proximaAcao.data, db = b.proximaAcao && b.proximaAcao.data;
      if (da && db && da !== db) return da < db ? -1 : 1;
      if (da && !db) return -1;
      if (!da && db) return 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  };

  /* ── armazenamento no navegador (IndexedDB) ───────────────────── */
  var NOME_BD = 'vf-prontuario', LOJA = 'cofre';
  function abrirBD() {
    return new Promise(function (ok, falha) {
      var r = raiz.indexedDB.open(NOME_BD, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(LOJA); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { falha(r.error); };
    });
  }
  function operar(modo, fn) {
    return abrirBD().then(function (bd) {
      return new Promise(function (ok, falha) {
        var tx = bd.transaction(LOJA, modo);
        var req = fn(tx.objectStore(LOJA));
        tx.oncomplete = function () { ok(req && req.result); bd.close(); };
        tx.onerror = function () { falha(tx.error); bd.close(); };
      });
    });
  }
  Cofre.Armazem = {
    ler: function (chave) { return operar('readonly', function (s) { return s.get(chave); }); },
    gravar: function (chave, valor) { return operar('readwrite', function (s) { return s.put(valor, chave); }); }
  };

  raiz.Cofre = Cofre;
  if (typeof module !== 'undefined') module.exports = Cofre;

})(typeof window !== 'undefined' ? window : globalThis);
