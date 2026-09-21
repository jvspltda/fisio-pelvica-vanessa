/* ════════════════════════════════════════════════════════════════
   js/storage.js — Persistência local e backup em JSON.

   Princípio de segurança do arquivo: um payload inválido NUNCA
   sobrescreve os dados em uso. A validação acontece antes de
   qualquer escrita, e importar é sempre uma operação de duas etapas
   (validar → só então aplicar).

   Os dados vivem apenas no navegador do dispositivo (localStorage).
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var Storage = {};

  Storage.CHAVE = 'vf-pelvica-v1';
  Storage.VERSAO_SCHEMA = 1;

  /* Seções que compõem o documento de atendimento. */
  var SECOES = ['dadosComuns', 'dadosFemininos', 'dadosMasculinos', 'prescricao', 'aderencia'];
  var PERFIS = ['feminino', 'masculino'];

  /* ──────────────────────────────────────────────────────────────
     ESTADO EM BRANCO
     ────────────────────────────────────────────────────────────── */
  Storage.novoDocumento = function () {
    return {
      schemaVersion: Storage.VERSAO_SCHEMA,
      perfil: 'feminino',
      dadosComuns: {},
      dadosFemininos: {},
      dadosMasculinos: {},
      prescricao: {},
      aderencia: {},
      atualizadoEm: new Date().toISOString()
    };
  };

  /* ──────────────────────────────────────────────────────────────
     VALIDAÇÃO ESTRUTURAL
     Retorna { valido, erros[] } — nunca lança, para que a interface
     possa exibir a lista de problemas ao usuário.
     ────────────────────────────────────────────────────────────── */
  Storage.validar = function (doc) {
    var erros = [];

    if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
      return { valido: false, erros: ['O arquivo não contém um objeto de atendimento.'] };
    }

    if (doc.schemaVersion !== Storage.VERSAO_SCHEMA) {
      erros.push('Versão de esquema incompatível: esperado ' + Storage.VERSAO_SCHEMA +
                 ', recebido ' + JSON.stringify(doc.schemaVersion) + '.');
    }

    if (PERFIS.indexOf(doc.perfil) === -1) {
      erros.push('Perfil inválido: esperado "feminino" ou "masculino", recebido ' +
                 JSON.stringify(doc.perfil) + '.');
    }

    for (var i = 0; i < SECOES.length; i++) {
      var nome = SECOES[i];
      var secao = doc[nome];
      if (secao === null || typeof secao !== 'object' || Array.isArray(secao)) {
        erros.push('Seção "' + nome + '" ausente ou malformada (deve ser um objeto).');
      }
    }

    if (typeof doc.atualizadoEm !== 'string' || isNaN(Date.parse(doc.atualizadoEm))) {
      erros.push('Campo "atualizadoEm" ausente ou não é uma data ISO válida.');
    }

    return { valido: erros.length === 0, erros: erros };
  };

  /* ──────────────────────────────────────────────────────────────
     NORMALIZAÇÃO
     Completa seções faltantes de um documento já validado como
     estruturalmente aceitável, para tolerar backups antigos.
     ────────────────────────────────────────────────────────────── */
  Storage.normalizar = function (doc) {
    var base = Storage.novoDocumento();
    var saida = {
      schemaVersion: Storage.VERSAO_SCHEMA,
      perfil: PERFIS.indexOf(doc.perfil) !== -1 ? doc.perfil : base.perfil,
      atualizadoEm: (typeof doc.atualizadoEm === 'string' && !isNaN(Date.parse(doc.atualizadoEm)))
        ? doc.atualizadoEm : base.atualizadoEm
    };
    for (var i = 0; i < SECOES.length; i++) {
      var nome = SECOES[i];
      var s = doc[nome];
      saida[nome] = (s !== null && typeof s === 'object' && !Array.isArray(s)) ? s : {};
    }
    return saida;
  };

  /* ──────────────────────────────────────────────────────────────
     SERIALIZAÇÃO
     ────────────────────────────────────────────────────────────── */
  Storage.serializar = function (doc) {
    var copia = Storage.normalizar(doc);
    copia.atualizadoEm = new Date().toISOString();
    return JSON.stringify(copia, null, 2);
  };

  /* Desserializa texto JSON. Nunca lança: devolve o diagnóstico. */
  Storage.desserializar = function (texto) {
    var obj;
    try {
      obj = JSON.parse(texto);
    } catch (e) {
      return { valido: false, erros: ['Arquivo não é um JSON válido: ' + e.message], doc: null };
    }
    var v = Storage.validar(obj);
    if (!v.valido) return { valido: false, erros: v.erros, doc: null };
    return { valido: true, erros: [], doc: Storage.normalizar(obj) };
  };

  /* ──────────────────────────────────────────────────────────────
     ACESSO AO localStorage
     Todo acesso é defensivo: navegação privada e políticas de
     armazenamento podem lançar em qualquer chamada.
     ────────────────────────────────────────────────────────────── */
  function armazenamentoDisponivel() {
    try {
      var teste = '__vf_teste__';
      raiz.localStorage.setItem(teste, '1');
      raiz.localStorage.removeItem(teste);
      return true;
    } catch (e) { return false; }
  }
  Storage.disponivel = armazenamentoDisponivel;

  Storage.salvar = function (doc) {
    if (!armazenamentoDisponivel()) {
      return { ok: false, erro: 'Armazenamento local indisponível neste navegador. Use Exportar JSON.' };
    }
    try {
      raiz.localStorage.setItem(Storage.CHAVE, Storage.serializar(doc));
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: 'Falha ao salvar: ' + e.message };
    }
  };

  Storage.carregar = function () {
    if (!armazenamentoDisponivel()) return null;
    var bruto;
    try { bruto = raiz.localStorage.getItem(Storage.CHAVE); } catch (e) { return null; }
    if (!bruto) return null;
    var r = Storage.desserializar(bruto);
    /* Rascunho corrompido é descartado silenciosamente: melhor abrir
       em branco do que travar a suíte no início do atendimento. */
    return r.valido ? r.doc : null;
  };

  Storage.limpar = function () {
    if (!armazenamentoDisponivel()) return { ok: false, erro: 'Armazenamento indisponível.' };
    try { raiz.localStorage.removeItem(Storage.CHAVE); return { ok: true }; }
    catch (e) { return { ok: false, erro: e.message }; }
  };

  /* ──────────────────────────────────────────────────────────────
     IMPORTAÇÃO SEGURA
     Recebe o texto do arquivo e o documento atualmente em uso.
     Devolve o documento a aplicar OU o motivo da recusa — jamais
     devolve algo que sobrescreva os dados atuais sem validação.
     ────────────────────────────────────────────────────────────── */
  Storage.importar = function (texto, docAtual) {
    var r = Storage.desserializar(texto);
    if (!r.valido) {
      return {
        ok: false,
        erros: r.erros,
        doc: docAtual,          // devolve o atual, intacto
        mensagem: 'Importação recusada. Os dados em uso foram preservados.'
      };
    }
    return { ok: true, erros: [], doc: r.doc, mensagem: 'Atendimento importado com sucesso.' };
  };

  /* Nome de arquivo sugerido para o backup. */
  Storage.nomeArquivo = function (doc) {
    var nome = '';
    try { nome = (doc && doc.dadosComuns && doc.dadosComuns.ident_nome) || ''; } catch (e) { nome = ''; }
    var limpo = String(nome).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    var data = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    return 'vf-pelvica-' + (limpo || 'atendimento') + '-' + data + '.json';
  };

  raiz.Storage = Storage;
  if (typeof module !== "undefined") module.exports = Storage;

})(typeof window !== "undefined" ? window : globalThis);
