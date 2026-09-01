/* ════════════════════════════════════════════════════════════════
   js/app.js — Render, reatividade e navegação.

   Único arquivo que toca o DOM. Consome:
     window.Scores    → cálculo e classificação
     window.Ficha     → estrutura da ficha
     window.Storage   → persistência e backup
     window.Adherence → templates de vínculo e cartilhas

   Distribuição dos dados no schema:
     dadosComuns     → identificação, Wexner, exame físico
     dadosFemininos  → S1 a S11 e prolapsos (Baden & Walker)
     dadosMasculinos → histórico urológico, IPSS, IIEF-5, NIH-CPSI
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var S = window.Scores, F = window.Ficha, St = window.Storage;

  /* Documento de trabalho em memória. */
  var doc = St.novoDocumento();

  /* Mapeia cada campo renderizado ao seu balde no schema. */
  var baldeDoCampo = {};

  /* ──────────────────────────────────────────────────────────────
     UTILITÁRIOS
     ────────────────────────────────────────────────────────────── */
  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'texto') n.textContent = attrs[k];
      else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    }
    if (filhos) filhos.forEach(function (f) { if (f) n.appendChild(f); });
    return n;
  }

  function escapar(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
  }

  function hojeLocal() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  var temporizadorStatus;
  function status(msg) {
    var n = document.getElementById('vf-status');
    if (!n) return;
    n.textContent = msg;
    clearTimeout(temporizadorStatus);
    temporizadorStatus = setTimeout(function () { n.textContent = ''; }, 3000);
  }

  /* Leitura e escrita no balde correto do documento. */
  function ler(id) {
    var b = baldeDoCampo[id] || 'dadosComuns';
    return doc[b] ? doc[b][id] : undefined;
  }
  function escrever(id, valor) {
    var b = baldeDoCampo[id] || 'dadosComuns';
    if (!doc[b]) doc[b] = {};
    if (valor === '' || valor === null || valor === undefined) delete doc[b][id];
    else doc[b][id] = valor;
  }

  /* ──────────────────────────────────────────────────────────────
     RENDER DE CAMPOS
     ────────────────────────────────────────────────────────────── */

  function envolver(campo, conteudo) {
    var classe = 'vf-campo-wrap' + (campo.larguraTotal ? ' vf-col-total' : '');
    var wrap = el('div', { class: classe });
    if (campo.label) wrap.appendChild(el('label', { class: 'vf-rotulo', for: campo.id, texto: campo.label }));
    wrap.appendChild(conteudo);
    if (campo.ajuda) wrap.appendChild(el('div', {
      class: 'vf-ajuda', texto: campo.ajuda,
      style: 'font-size:var(--t-xs);color:var(--cafe-tenue);margin-top:3px'
    }));
    return wrap;
  }

  function renderCampo(campo, balde) {
    if (campo.tipo === 'titulo') {
      return el('h4', { class: 'vf-col-total', texto: campo.texto,
                        style: 'margin:var(--e-3) 0 0;font-size:var(--t-base);color:var(--terracota-deep)' });
    }
    if (campo.tipo === 'nota') {
      return el('p', { class: 'vf-col-total', texto: campo.texto,
                       style: 'font-size:var(--t-sm);color:var(--cafe-suave);margin:0' });
    }

    baldeDoCampo[campo.id] = balde;
    var valor = ler(campo.id);

    /* --- Texto, data, área --- */
    if (campo.tipo === 'texto' || campo.tipo === 'data') {
      var inp = el('input', {
        class: 'vf-campo', id: campo.id, name: campo.id,
        type: campo.tipo === 'data' ? 'date' : 'text',
        value: valor === undefined ? '' : valor
      });
      return envolver(campo, inp);
    }

    if (campo.tipo === 'area') {
      var ta = el('textarea', { class: 'vf-campo', id: campo.id, name: campo.id,
                                rows: campo.linhas || 3 });
      ta.value = valor === undefined ? '' : valor;
      return envolver(campo, ta);
    }

    /* --- Numérico com clamp na faixa clínica --- */
    if (campo.tipo === 'numero') {
      var n = el('input', {
        class: 'vf-campo', id: campo.id, name: campo.id, type: 'number',
        min: campo.min, max: campo.max, step: campo.step || 1,
        value: valor === undefined ? '' : valor
      });
      n.addEventListener('blur', function () {
        if (this.value === '') return;
        var v = S.limitar(this.value, campo.min, campo.max);
        if (String(v) !== this.value) {
          this.value = v;
          escrever(campo.id, String(v));
          status('Valor ajustado para a faixa ' + campo.min + '–' + campo.max);
        }
      });
      return envolver(campo, n);
    }

    if (campo.tipo === 'calculado') {
      var c = el('input', { class: 'vf-campo', id: campo.id, name: campo.id, readonly: 'readonly' });
      c.value = valor === undefined ? '' : valor;
      return envolver(campo, c);
    }

    /* --- Select --- */
    if (campo.tipo === 'select') {
      var sl = el('select', { class: 'vf-campo', id: campo.id, name: campo.id });
      sl.appendChild(el('option', { value: '', texto: '—' }));
      campo.opcoes.forEach(function (o) {
        var op = el('option', { value: o, texto: o });
        if (valor === o) op.selected = true;
        sl.appendChild(op);
      });
      return envolver(campo, sl);
    }

    /* --- Radio --- */
    if (campo.tipo === 'radio') {
      var gr = el('div', { class: 'vf-opcoes', role: 'radiogroup', 'aria-label': campo.label });
      campo.opcoes.forEach(function (o, i) {
        var lb = el('label');
        var ip = el('input', { type: 'radio', name: campo.id, value: o,
                               id: campo.id + '_' + i });
        if (valor === o) ip.checked = true;
        lb.appendChild(ip);
        lb.appendChild(el('span', { texto: o }));
        gr.appendChild(lb);
      });
      return envolver(campo, gr);
    }

    /* --- Checkboxes --- */
    if (campo.tipo === 'checks') {
      var marcados = Array.isArray(valor) ? valor : [];
      var gc = el('div', { class: 'vf-opcoes', role: 'group', 'aria-label': campo.label });
      campo.opcoes.forEach(function (o, i) {
        var lb = el('label');
        var ip = el('input', { type: 'checkbox', name: campo.id, value: o,
                               id: campo.id + '_' + i });
        if (marcados.indexOf(o) !== -1) ip.checked = true;
        lb.appendChild(ip);
        lb.appendChild(el('span', { texto: o }));
        gc.appendChild(lb);
      });
      return envolver(campo, gc);
    }

    /* --- Régua EVA --- */
    if (campo.tipo === 'eva') {
      var v0 = (valor === undefined || valor === '') ? 0 : Number(valor);
      var box = el('div', { class: 'vf-eva' });
      var rg = el('input', { type: 'range', id: campo.id, name: campo.id,
                             min: 0, max: 10, step: 1, value: v0 });
      var out = el('span', { class: 'vf-eva-valor', id: campo.id + '_valor', texto: String(v0) });
      var bd = el('span', { class: 'vf-badge', id: campo.id + '_badge' });
      box.appendChild(rg); box.appendChild(out); box.appendChild(bd);
      var wrap = envolver(campo, box);
      atualizarBadgeEVA(campo.id, v0, bd, out);
      rg.addEventListener('input', function () {
        atualizarBadgeEVA(campo.id, this.value, bd, out);
      });
      return wrap;
    }

    /* --- Escala descritiva (Oxford / ICS), redação verbatim --- */
    if (campo.tipo === 'escala') {
      var lista = S[campo.fonte];
      var gsel = el('div', { class: 'vf-opcoes vf-escala-descritiva',
                             role: 'radiogroup', 'aria-label': campo.label,
                             style: 'flex-direction:column;align-items:stretch;gap:4px' });
      lista.forEach(function (nivel, i) {
        var lb = el('label', { style: 'border-radius:var(--raio-sm);align-items:flex-start;line-height:1.45;padding:7px 11px' });
        var ip = el('input', { type: 'radio', name: campo.id, value: String(nivel.valor),
                               id: campo.id + '_' + i, style: 'margin-top:3px' });
        if (String(valor) === String(nivel.valor)) ip.checked = true;
        lb.appendChild(ip);
        lb.appendChild(el('span', {
          html: '<strong>' + nivel.valor + '</strong> &nbsp;' + escapar(nivel.texto)
        }));
        gsel.appendChild(lb);
      });
      return envolver(campo, gsel);
    }

    return el('div');
  }

  function atualizarBadgeEVA(id, valor, badge, saida) {
    var v = S.limitar(valor, 0, 10);
    if (saida) saida.textContent = v;
    escrever(id, String(v));
    try {
      var r = S.classificarEVA(v);
      badge.textContent = r.rotulo;
      badge.setAttribute('data-sev', r.severidade);
    } catch (e) {
      badge.textContent = '';
      badge.setAttribute('data-sev', 'neutro');
    }
  }

  /* ──────────────────────────────────────────────────────────────
     RENDER DE SEÇÃO
     ────────────────────────────────────────────────────────────── */
  function renderSecao(secao, balde) {
    var card = el('div', { class: 'vf-card quebra-evitar', id: 'card-' + secao.id });

    var cab = el('div', { class: 'vf-card-cab' });
    if (secao.numero) cab.appendChild(el('div', { class: 'vf-card-num', texto: secao.numero }));
    cab.appendChild(el('h2', { texto: secao.titulo }));
    card.appendChild(cab);

    var corpo = el('div', { class: 'vf-card-corpo' });

    if (secao.tipoEspecial === 'wexner')      corpo.appendChild(renderWexner());
    else if (secao.tipoEspecial === 'ipss')   corpo.appendChild(renderInstrumento('IPSS', S.IPSS_ITENS, 'ipss', S.calcularIPSS, [S.IPSS_QV]));
    else if (secao.tipoEspecial === 'iief5')  corpo.appendChild(renderInstrumento('IIEF-5', S.IIEF5_ITENS, 'iief5', S.calcularIIEF5));
    else if (secao.tipoEspecial === 'cpsi')   corpo.appendChild(renderCPSI());
    else {
      var grade = el('div', { class: 'vf-grade vf-grade-2' });
      secao.campos.forEach(function (c) { grade.appendChild(renderCampo(c, balde)); });
      corpo.appendChild(grade);
    }

    card.appendChild(corpo);
    return card;
  }

  /* ──────────────────────────────────────────────────────────────
     WEXNER — matriz 5×5 com âncoras de frequência
     ────────────────────────────────────────────────────────────── */
  function renderWexner() {
    var box = el('div');

    /* Legenda das âncoras — visível, conforme a ficha. */
    var legenda = el('div', { class: 'vf-aviso no-print', style: 'margin:0 0 var(--e-4)' });
    legenda.appendChild(el('span', { class: 'vf-aviso-titulo', texto: 'Âncoras de frequência' }));
    var ul = el('ul', { style: 'margin:0;padding-left:18px' });
    S.WEXNER_COLUNAS.forEach(function (c) {
      ul.appendChild(el('li', {
        html: '<strong>' + c.pontos + '</strong> — ' + escapar(c.rotulo) +
              (c.ancora ? ' <span style="color:var(--cafe-tenue)">(' + escapar(c.ancora) + ')</span>' : '')
      }));
    });
    legenda.appendChild(ul);
    box.appendChild(legenda);

    /* Matriz */
    var tabelaWrap = el('div', { class: 'vf-tabela-wrap', style: 'overflow-x:auto' });
    var t = el('table', { class: 'vf-wexner' });

    var thead = el('thead');
    var trh = el('tr');
    trh.appendChild(el('th', { texto: '', scope: 'col' }));
    S.WEXNER_COLUNAS.forEach(function (c) {
      trh.appendChild(el('th', { scope: 'col', title: c.ancora || '',
        html: escapar(c.rotulo) + '<br><span class="vf-wexner-pt">' + c.pontos + '</span>' }));
    });
    thead.appendChild(trh); t.appendChild(thead);

    var tb = el('tbody');
    S.WEXNER_ITENS.forEach(function (item) {
      baldeDoCampo[item.id] = 'dadosComuns';
      var tr = el('tr');
      tr.appendChild(el('th', { scope: 'row', texto: item.label }));
      S.WEXNER_COLUNAS.forEach(function (c) {
        var td = el('td');
        var lb = el('label', { class: 'vf-wexner-cel', 'aria-label': item.label + ' — ' + c.rotulo });
        var ip = el('input', { type: 'radio', name: item.id, value: String(c.pontos) });
        if (String(ler(item.id)) === String(c.pontos)) ip.checked = true;
        ip.addEventListener('change', function () { escrever(item.id, this.value); calcularWexner(); });
        lb.appendChild(ip);
        td.appendChild(lb);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    tabelaWrap.appendChild(t);
    box.appendChild(tabelaWrap);

    /* Painel do somatório */
    var painel = el('div', { class: 'vf-escore', style: 'margin-top:var(--e-4)' });
    painel.appendChild(el('span', { class: 'vf-escore-valor', id: 'wexner-total', texto: '—' }));
    painel.appendChild(el('span', { class: 'vf-escore-max', texto: '/ 20 pontos' }));
    painel.appendChild(el('span', { class: 'vf-badge', id: 'wexner-badge', 'data-sev': 'neutro',
                                    texto: 'Aguardando preenchimento' }));
    box.appendChild(painel);

    return box;
  }

  function calcularWexner() {
    var alvo = document.getElementById('wexner-total');
    var badge = document.getElementById('wexner-badge');
    if (!alvo || !badge) return;

    var respostas = {};
    S.WEXNER_ITENS.forEach(function (i) { respostas[i.id] = ler(i.id); });

    if (!S.completo(respostas, S.WEXNER_ITENS)) {
      alvo.textContent = '—';
      badge.textContent = 'Aguardando preenchimento';
      badge.setAttribute('data-sev', 'neutro');
      return;
    }
    try {
      var r = S.calcularWexner(respostas);
      alvo.textContent = r.total;
      badge.textContent = r.rotulo;
      badge.setAttribute('data-sev', r.severidade);
    } catch (e) {
      alvo.textContent = '—';
      badge.textContent = 'Valor inválido';
      badge.setAttribute('data-sev', 'grave');
    }
  }

  /* ──────────────────────────────────────────────────────────────
     INSTRUMENTOS MASCULINOS — IPSS e IIEF-5
     Renderizam placeholders declarados; o cálculo já funciona.
     ────────────────────────────────────────────────────────────── */
  function renderInstrumento(nome, itens, prefixo, calcular, extras) {
    var box = el('div');

    var av = el('div', { class: 'vf-aviso no-print', 'data-tom': 'atencao', style: 'margin:0 0 var(--e-4)' });
    av.appendChild(el('span', { class: 'vf-aviso-titulo', texto: 'Redação oficial pendente' }));
    av.appendChild(el('p', { style: 'margin:0', texto:
      'O texto validado em pt-BR dos itens do ' + nome + ' não foi fornecido e não pode ser ' +
      'reconstruído de memória. A pontuação e a classificação já funcionam: basta substituir os ' +
      'rótulos em js/scores.js. Ver "Pendências clínicas" no README.' }));
    box.appendChild(av);

    var lista = itens.concat(extras || []);
    var grade = el('div', { class: 'vf-grade' });

    lista.forEach(function (item) {
      baldeDoCampo[item.id] = 'dadosMasculinos';
      var wrap = el('div', { class: 'vf-campo-wrap' });
      wrap.appendChild(el('label', { class: 'vf-rotulo', texto: item.label }));

      var opcoes = el('div', { class: 'vf-opcoes' });
      for (var v = item.min; v <= item.max; v++) {
        (function (valor) {
          var lb = el('label');
          var ip = el('input', { type: 'radio', name: item.id, value: String(valor) });
          if (String(ler(item.id)) === String(valor)) ip.checked = true;
          ip.addEventListener('change', function () {
            escrever(item.id, this.value);
            recalcularInstrumento(prefixo, itens, calcular);
          });
          lb.appendChild(ip);
          lb.appendChild(el('span', { texto: String(valor) }));
          opcoes.appendChild(lb);
        })(v);
      }
      wrap.appendChild(opcoes);
      grade.appendChild(wrap);
    });
    box.appendChild(grade);

    var maxTotal = itens.reduce(function (a, i) { return a + i.max; }, 0);
    var painel = el('div', { class: 'vf-escore', style: 'margin-top:var(--e-4)' });
    painel.appendChild(el('span', { class: 'vf-escore-valor', id: prefixo + '-total', texto: '—' }));
    painel.appendChild(el('span', { class: 'vf-escore-max', texto: '/ ' + maxTotal + ' pontos' }));
    painel.appendChild(el('span', { class: 'vf-badge', id: prefixo + '-badge', 'data-sev': 'neutro',
                                    texto: 'Aguardando preenchimento' }));
    box.appendChild(painel);

    return box;
  }

  function recalcularInstrumento(prefixo, itens, calcular) {
    var alvo = document.getElementById(prefixo + '-total');
    var badge = document.getElementById(prefixo + '-badge');
    if (!alvo || !badge) return;

    var respostas = {};
    itens.forEach(function (i) { respostas[i.id] = ler(i.id); });

    if (!S.completo(respostas, itens)) {
      alvo.textContent = '—';
      badge.textContent = 'Aguardando preenchimento';
      badge.setAttribute('data-sev', 'neutro');
      return;
    }
    try {
      var r = calcular(respostas);
      alvo.textContent = r.total;
      badge.textContent = r.rotulo;
      badge.setAttribute('data-sev', r.severidade);
    } catch (e) {
      alvo.textContent = '—';
      badge.textContent = 'Valor inválido';
      badge.setAttribute('data-sev', 'grave');
    }
  }

  /* NIH-CPSI: estrutura declarada, faixas oficiais ausentes. */
  function renderCPSI() {
    var box = el('div');
    var av = el('div', { class: 'vf-aviso', 'data-tom': 'atencao', style: 'margin:0' });
    av.appendChild(el('span', { class: 'vf-aviso-titulo', texto: 'Contexto insuficiente' }));
    av.appendChild(el('p', { style: 'margin:0 0 var(--e-2)', texto:
      '[CONTEXTO INSUFICIENTE: NIH-CPSI — texto oficial dos itens, faixa de pontos por item e ' +
      'pontos de corte de gravidade]' }));
    av.appendChild(el('p', { style: 'margin:0', texto:
      'A arquitetura dos 9 itens e dos três domínios (dor, urinário, qualidade de vida) está ' +
      'implementada em js/scores.js. O instrumento passa a funcionar assim que as faixas oficiais ' +
      'forem preenchidas. Nenhum limiar foi presumido.' }));
    box.appendChild(av);
    return box;
  }

  /* ──────────────────────────────────────────────────────────────
     EXAME FÍSICO — inclui o gate de consentimento
     ────────────────────────────────────────────────────────────── */
  function renderExameFisico() {
    var frag = document.createDocumentFragment();
    var EF = F.EXAME_FISICO;

    frag.appendChild(renderSecao(Object.assign({ numero: 'C' }, EF.consentimento), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.geral), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.inspecao), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.prolapsos), 'dadosFemininos'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.sensibilidade), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.reflexos), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'EF' }, EF.afa), 'dadosComuns'));
    frag.appendChild(renderSecao(Object.assign({ numero: 'DX' }, EF.diagnostico), 'dadosComuns'));

    return frag;
  }

  /* Habilita ou bloqueia o bloco interno conforme a autorização. */
  function aplicarGateConsentimento() {
    var autorizou = ler('ef_autorizou');
    var liberado = (autorizou === 'Sim');
    var card = document.getElementById('card-ef_afa');
    if (!card) return;

    card.querySelectorAll('input, select, textarea').forEach(function (n) {
      n.disabled = !liberado;
    });
    card.style.opacity = liberado ? '' : '.55';

    var marca = document.getElementById('aviso-consentimento');
    if (!liberado) {
      if (!marca) {
        marca = el('div', { class: 'vf-aviso', id: 'aviso-consentimento', 'data-tom': 'atencao',
                            style: 'margin:0 0 var(--e-4)' });
        marca.appendChild(el('span', { class: 'vf-aviso-titulo', texto: 'Exame interno bloqueado' }));
        marca.appendChild(el('p', { style: 'margin:0', texto:
          autorizou === 'Não'
            ? F.TEXTO_SEM_CONSENTIMENTO + ' O laudo registrará essa informação.'
            : 'Registre o esclarecimento e a autorização da paciente para liberar este bloco.' }));
        card.querySelector('.vf-card-corpo').prepend(marca);
      } else {
        marca.querySelector('p').textContent = autorizou === 'Não'
          ? F.TEXTO_SEM_CONSENTIMENTO + ' O laudo registrará essa informação.'
          : 'Registre o esclarecimento e a autorização da paciente para liberar este bloco.';
      }
    } else if (marca) {
      marca.remove();
    }
  }

  /* ──────────────────────────────────────────────────────────────
     IMC AUTOMÁTICO
     ────────────────────────────────────────────────────────────── */
  function calcularIMC() {
    var campo = document.getElementById('ef_imc');
    if (!campo) return;
    var peso = ler('ef_peso'), altura = ler('ef_estatura');
    if (!peso || !altura) { campo.value = ''; escrever('ef_imc', ''); return; }
    try {
      var r = S.calcularIMC(peso, altura);
      campo.value = r.valor.toFixed(1).replace('.', ',') + ' kg/m² — ' + r.rotulo;
      escrever('ef_imc', String(r.valor));
      escrever('ef_imc_classe', r.rotulo);
    } catch (e) {
      campo.value = '';
      escrever('ef_imc', '');
      escrever('ef_imc_classe', '');
    }
  }

  /* ──────────────────────────────────────────────────────────────
     RENDER DOS PAINÉIS
     ────────────────────────────────────────────────────────────── */
  function renderAvaliacao() {
    baldeDoCampo = {};

    var comum = document.getElementById('render-comum');
    comum.innerHTML = '';
    comum.appendChild(renderSecao(Object.assign({ numero: 'ID' }, F.IDENTIFICACAO), 'dadosComuns'));

    var fem = document.getElementById('render-feminino');
    fem.innerHTML = '';
    F.FEMININO.forEach(function (sec) { fem.appendChild(renderSecao(sec, 'dadosFemininos')); });
    fem.appendChild(renderExameFisico());

    var masc = document.getElementById('render-masculino');
    masc.innerHTML = '';
    F.MASCULINO.forEach(function (sec) { masc.appendChild(renderSecao(sec, 'dadosMasculinos')); });

    aplicarPerfil();
    calcularWexner();
    calcularIMC();
    aplicarGateConsentimento();
  }

  /* Alterna os blocos sem apagar nenhum dos dois estados. */
  function aplicarPerfil() {
    var fem = document.getElementById('render-feminino');
    var masc = document.getElementById('render-masculino');
    var ehFem = doc.perfil === 'feminino';
    fem.classList.toggle('vf-oculto', !ehFem);
    masc.classList.toggle('vf-oculto', ehFem);
    document.querySelectorAll('[name="perfil"]').forEach(function (r) {
      r.checked = (r.value === doc.perfil);
    });
  }

  /* ──────────────────────────────────────────────────────────────
     REATIVIDADE GLOBAL
     ────────────────────────────────────────────────────────────── */
  var temporizadorSalvar;

  function aoAlterar(ev) {
    var alvo = ev.target;
    if (!alvo || !alvo.name) return;

    if (alvo.name === 'perfil') {
      doc.perfil = alvo.value;
      aplicarPerfil();
      agendarSalvamento();
      return;
    }

    if (alvo.type === 'checkbox') {
      var marcados = [];
      document.querySelectorAll('input[type=checkbox][name="' + alvo.name + '"]:checked')
        .forEach(function (n) { marcados.push(n.value); });
      escrever(alvo.name, marcados.length ? marcados : '');
    } else if (alvo.type === 'radio') {
      escrever(alvo.name, alvo.value);
    } else {
      escrever(alvo.name, alvo.value);
    }

    if (alvo.name === 'ef_peso' || alvo.name === 'ef_estatura') calcularIMC();
    if (alvo.name === 'ef_autorizou' || alvo.name === 'ef_esclarecida') aplicarGateConsentimento();
    if (alvo.name.indexOf('wexner_') === 0) calcularWexner();

    agendarSalvamento();
  }

  function agendarSalvamento() {
    clearTimeout(temporizadorSalvar);
    temporizadorSalvar = setTimeout(function () {
      var r = St.salvar(doc);
      status(r.ok ? 'Rascunho salvo' : r.erro);
    }, 800);
  }

  /* ──────────────────────────────────────────────────────────────
     NAVEGAÇÃO ENTRE ABAS
     ────────────────────────────────────────────────────────────── */
  var TITULOS_IMPRESSAO = {
    avaliacao:   'Avaliação Clínica',
    prescricao:  'Prescrição de Treino',
    aderencia:   'Aderência e Vínculo',
    orientacoes: 'Orientações ao Paciente',
    laudo:       'Laudo Fisioterapêutico'
  };
  var abaAtual = 'avaliacao';

  function trocarAba(nome) {
    abaAtual = nome;
    document.querySelectorAll('[role=tabpanel]').forEach(function (p) {
      p.classList.toggle('vf-oculto', p.id !== 'painel-' + nome);
    });
    document.querySelectorAll('[role=tab]').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.painel === nome));
    });
    if (nome === 'laudo' && window.__renderLaudo) window.__renderLaudo();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.__trocarAba = trocarAba;
  window.__docAtual  = function () { return doc; };
  window.__lerCampo  = ler;

  /* ──────────────────────────────────────────────────────────────
     IMPRESSÃO
     ────────────────────────────────────────────────────────────── */
  function imprimir() {
    document.getElementById('timbre-doc-titulo').textContent = TITULOS_IMPRESSAO[abaAtual] || '';
    document.body.className = 'imp-' + abaAtual;
    St.salvar(doc);
    window.print();
  }
  window.addEventListener('afterprint', function () { document.body.className = ''; });

  /* ──────────────────────────────────────────────────────────────
     AÇÕES DE ARQUIVO
     ────────────────────────────────────────────────────────────── */
  function novoAtendimento() {
    if (!confirm('Iniciar novo atendimento? Os dados atuais serão apagados deste navegador.\n\n' +
                 'Se ainda não exportou o backup, cancele e use "Exportar JSON" antes.')) return;
    St.limpar();
    doc = St.novoDocumento();
    doc.dadosComuns.ident_data = hojeLocal();
    renderTudo();
    status('Novo atendimento iniciado');
  }

  function exportarJSON() {
    var texto = St.serializar(doc);
    var blob = new Blob([texto], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: St.nomeArquivo(doc) });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
    status('Backup exportado');
  }

  function importarJSON(arquivo) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var r = St.importar(String(leitor.result), doc);
      if (!r.ok) {
        alert('Importação recusada.\n\n' + r.erros.join('\n') +
              '\n\nOs dados em uso foram preservados.');
        status('Importação recusada');
        return;
      }
      doc = r.doc;
      St.salvar(doc);
      renderTudo();
      status(r.mensagem);
    };
    leitor.onerror = function () { alert('Não foi possível ler o arquivo.'); };
    leitor.readAsText(arquivo);
  }

  /* ──────────────────────────────────────────────────────────────
     INICIALIZAÇÃO
     ────────────────────────────────────────────────────────────── */
  function renderTudo() {
    renderAvaliacao();
    if (window.__renderPrescricao)  window.__renderPrescricao();
    if (window.__renderAderencia)   window.__renderAderencia();
    if (window.__renderOrientacoes) window.__renderOrientacoes();
    if (window.__renderLaudo)       window.__renderLaudo();
  }
  window.__renderTudo = renderTudo;

  document.addEventListener('DOMContentLoaded', function () {
    /* Rodapé legal — texto único vindo de js/ficha.js */
    var rodapeTela = document.getElementById('rodape-tela');
    var rodapeImpr = document.getElementById('rodape-texto-impressao');
    if (rodapeTela) rodapeTela.textContent = F.RODAPE_LEGAL;
    if (rodapeImpr) rodapeImpr.textContent = F.RODAPE_LEGAL;

    /* Rascunho anterior, se houver */
    var salvo = St.carregar();
    if (salvo) doc = salvo;
    if (!doc.dadosComuns.ident_data) doc.dadosComuns.ident_data = hojeLocal();

    if (!St.disponivel()) {
      status('Armazenamento local indisponível — use Exportar JSON');
    }

    renderTudo();

    /* Reatividade */
    document.addEventListener('input', aoAlterar);
    document.addEventListener('change', aoAlterar);

    /* Abas */
    document.querySelectorAll('[role=tab]').forEach(function (b) {
      b.addEventListener('click', function () { trocarAba(b.dataset.painel); });
    });

    /* Barra de ações */
    document.getElementById('btn-novo').addEventListener('click', novoAtendimento);
    document.getElementById('btn-salvar').addEventListener('click', function () {
      var r = St.salvar(doc);
      status(r.ok ? 'Rascunho salvo' : r.erro);
    });
    document.getElementById('btn-exportar').addEventListener('click', exportarJSON);
    document.getElementById('btn-importar').addEventListener('click', function () {
      document.getElementById('input-importar').click();
    });
    document.getElementById('input-importar').addEventListener('change', function () {
      if (this.files && this.files[0]) importarJSON(this.files[0]);
      this.value = '';
    });
    document.getElementById('btn-imprimir').addEventListener('click', imprimir);

    var fechar = document.getElementById('btn-fechar-aviso');
    if (fechar) fechar.addEventListener('click', function () {
      document.getElementById('aviso-privacidade').style.display = 'none';
    });
  });

})();
