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

  /* Modo de exibição da ficha: 'essencial' (o que se preenche com a
     paciente na sala) ou 'completo' (a ficha inteira). Só afeta a tela —
     a impressão sempre leva a ficha completa, porque o papel é o registro. */
  var modoFicha = 'essencial';

  /* Seções recolhidas. Começar tudo fechado evita a parede de campos. */
  var secoesAbertas = {};

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

  function envolver(campo, conteudo, recolhido) {
    var classe = 'vf-campo-wrap' + (campo.larguraTotal ? ' vf-col-total' : '') +
                 (recolhido ? ' vf-fora-do-essencial' : '');
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

    /* No modo essencial o campo não é removido — é recolhido.
       A classe é distinta de .vf-oculto porque a impressão a ignora. */
    var recolhido = (modoFicha === 'essencial' && !F.ehEssencial(campo.id));

    /* --- Texto, data, área --- */
    if (campo.tipo === 'texto' || campo.tipo === 'data') {
      var inp = el('input', {
        class: 'vf-campo', id: campo.id, name: campo.id,
        type: campo.tipo === 'data' ? 'date' : 'text',
        value: valor === undefined ? '' : valor
      });
      return envolver(campo, inp, recolhido);
    }

    if (campo.tipo === 'area') {
      var ta = el('textarea', { class: 'vf-campo', id: campo.id, name: campo.id,
                                rows: campo.linhas || 3 });
      ta.value = valor === undefined ? '' : valor;
      return envolver(campo, ta, recolhido);
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
      return envolver(campo, n, recolhido);
    }

    if (campo.tipo === 'calculado') {
      var c = el('input', { class: 'vf-campo', id: campo.id, name: campo.id, readonly: 'readonly' });
      c.value = valor === undefined ? '' : valor;
      return envolver(campo, c, recolhido);
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
      return envolver(campo, sl, recolhido);
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
      return envolver(campo, gr, recolhido);
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
      return envolver(campo, gc, recolhido);
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
      var wrap = envolver(campo, box, recolhido);
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
      return envolver(campo, gsel, recolhido);
    }

    return el('div');
  }

  /* Abre ou fecha uma seção. */
  function alternarSecao(id) {
    secoesAbertas[id] = !secoesAbertas[id];
    var card = document.getElementById('card-' + id);
    if (!card) return;
    card.setAttribute('data-aberto', secoesAbertas[id] ? 'sim' : 'nao');
    var cab = card.querySelector('.vf-card-cab');
    if (cab) cab.setAttribute('aria-expanded', String(!!secoesAbertas[id]));
  }

  /* Conta campos preenchidos na seção, para o indicador do cabeçalho.
     Serve para saber o que falta sem precisar abrir tudo. */
  function atualizarProgresso() {
    document.querySelectorAll('.vf-card').forEach(function (card) {
      var id = card.id.replace('card-', '');
      var alvo = document.getElementById('prog-' + id);
      if (!alvo) return;

      var visiveis = card.querySelectorAll(
        '.vf-card-corpo [name]:not([type=radio]):not([type=checkbox]), ' +
        '.vf-card-corpo [name][type=radio], .vf-card-corpo [name][type=checkbox]');

      var nomes = {}, preenchidos = 0, total = 0;
      visiveis.forEach(function (campo) {
        var wrap = campo.closest('.vf-campo-wrap, .vf-wexner, td');
        if (wrap && wrap.classList.contains('vf-fora-do-essencial')) return;
        if (nomes[campo.name]) return;
        nomes[campo.name] = true;
        total++;
        if (campo.type === 'radio' || campo.type === 'checkbox') {
          if (card.querySelector('[name="' + campo.name + '"]:checked')) preenchidos++;
        } else if (campo.type === 'range') {
          var v = ler(campo.name);
          if (v !== undefined && v !== '' && Number(v) > 0) preenchidos++;
        } else if (String(campo.value).trim() !== '') preenchidos++;
      });

      if (!total) { alvo.textContent = ''; return; }
      alvo.textContent = preenchidos + '/' + total;
      alvo.setAttribute('data-estado',
        preenchidos === 0 ? 'vazio' : (preenchidos === total ? 'completo' : 'parcial'));
    });
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

    /* No modo essencial, seções sem nada de essencial somem da tela
       (continuam na impressão e no documento salvo). */
    if (modoFicha === 'essencial' && F.SECOES_ESSENCIAIS.indexOf(secao.id) === -1) {
      card.classList.add('vf-fora-do-essencial');
    }

    /* Cabeçalho clicável: recolher é o que permite olhar para a paciente
       em vez de rolar uma parede de campos. */
    var aberto = !!secoesAbertas[secao.id];
    var cab = el('button', {
      class: 'vf-card-cab', type: 'button',
      'aria-expanded': String(aberto), 'aria-controls': 'corpo-' + secao.id
    });
    if (secao.numero) cab.appendChild(el('div', { class: 'vf-card-num', texto: secao.numero }));
    cab.appendChild(el('h2', { texto: secao.titulo }));
    cab.appendChild(el('span', { class: 'vf-progresso', id: 'prog-' + secao.id }));
    cab.appendChild(el('span', { class: 'vf-chevron', 'aria-hidden': 'true', texto: '⌄' }));
    cab.addEventListener('click', function () { alternarSecao(secao.id); });
    card.appendChild(cab);
    card.setAttribute('data-aberto', aberto ? 'sim' : 'nao');

    var corpo = el('div', { class: 'vf-card-corpo', id: 'corpo-' + secao.id });

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
    atualizarProgresso();
  }

  /* Barra de modo — fica acima das seções, na aba de avaliação. */
  function renderBarraModo() {
    var alvo = document.getElementById('barra-modo');
    if (!alvo) return;
    alvo.innerHTML = '';

    var grupo = el('div', { class: 'vf-opcoes', role: 'radiogroup', 'aria-label': 'Modo de exibição da ficha' });
    [['essencial', 'Essencial', 'O que se preenche com a paciente na sala'],
     ['completo',  'Ficha completa', 'Todos os campos, para completar depois']
    ].forEach(function (m) {
      var lb = el('label', { title: m[2] });
      var ip = el('input', { type: 'radio', name: 'modo_ficha', value: m[0] });
      if (modoFicha === m[0]) ip.checked = true;
      ip.addEventListener('change', function () {
        modoFicha = m[0];
        renderAvaliacao();
        renderBarraModo();
      });
      lb.appendChild(ip);
      lb.appendChild(el('span', { texto: m[1] }));
      grupo.appendChild(lb);
    });
    alvo.appendChild(grupo);

    var botoes = el('div', { style: 'display:flex;gap:var(--e-2);margin-left:auto' });
    var abrir = el('button', { class: 'vf-btn', type: 'button', texto: 'Abrir todas' });
    abrir.addEventListener('click', function () {
      document.querySelectorAll('#painel-avaliacao .vf-card').forEach(function (c) {
        secoesAbertas[c.id.replace('card-', '')] = true;
        c.setAttribute('data-aberto', 'sim');
        var cab = c.querySelector('.vf-card-cab'); if (cab) cab.setAttribute('aria-expanded', 'true');
      });
    });
    var fechar = el('button', { class: 'vf-btn', type: 'button', texto: 'Fechar todas' });
    fechar.addEventListener('click', function () {
      document.querySelectorAll('#painel-avaliacao .vf-card').forEach(function (c) {
        secoesAbertas[c.id.replace('card-', '')] = false;
        c.setAttribute('data-aberto', 'nao');
        var cab = c.querySelector('.vf-card-cab'); if (cab) cab.setAttribute('aria-expanded', 'false');
      });
    });
    botoes.appendChild(abrir); botoes.appendChild(fechar);
    alvo.appendChild(botoes);
  }
  window.__renderBarraModo = renderBarraModo;

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

    /* Instrumentos masculinos recalculam a cada resposta. */
    if (alvo.name.indexOf('ipss_q') === 0)  recalcularInstrumento('ipss',  S.IPSS_ITENS,  S.calcularIPSS);
    if (alvo.name.indexOf('iief5_q') === 0) recalcularInstrumento('iief5', S.IIEF5_ITENS, S.calcularIIEF5);

    /* Prescrição: repouso sugerido, descrição da postura e cartão. */
    if (alvo.name.indexOf('presc_') === 0) {
      if (alvo.name === 'presc_sustentacao') sugerirRepouso();
      if (alvo.name === 'presc_postura') {
        var d = document.getElementById('presc_postura_desc');
        var p = window.Adherence.POSTURAS.filter(function (x) { return x.rotulo === alvo.value; })[0];
        if (d) d.textContent = p ? p.descricao : '';
      }
      renderCartaoTreino();
    }

    /* Âncora de hábito, kit de orientações e condutas do laudo.
       Centralizado aqui para que o valor já esteja gravado no documento
       antes de qualquer re-render — evita corrida com listeners inline. */
    if (alvo.name === 'orient_sel')     renderOrientacoes();
    if (alvo.name === 'laudo_condutas') renderLaudo();
    if (alvo.name === 'anc_gatilho' || alvo.name === 'anc_acao') montarAncoraNaTela();
    if (alvo.name === 'orient_obs') { var k = document.querySelector('.vf-kit-obs'); if (k) k.textContent = alvo.value; }

    atualizarProgresso();
    agendarSalvamento();
  }

  function agendarSalvamento() {
    clearTimeout(temporizadorSalvar);
    temporizadorSalvar = setTimeout(function () {
      temporizadorSalvar = null;
      var r = St.salvar(doc);
      status(r.ok ? 'Rascunho salvo' : r.erro);
    }, 800);
  }

  /* Saída da página (link "Início", fechar a aba, trocar de app no
     celular): o que ainda esperava os 0,8 s é gravado agora. O
     localStorage é síncrono, então a gravação termina antes de a
     página sair. */
  function salvarPendente() {
    if (!temporizadorSalvar) return;
    clearTimeout(temporizadorSalvar);
    temporizadorSalvar = null;
    St.salvar(doc);
  }
  window.addEventListener('pagehide', salvarPendente);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') salvarPendente();
  });

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
    /* O papel é o registro: imprime sempre a ficha inteira, independente
       do modo de tela, para não omitir campo preenchido do documento. */
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

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 2 · PRESCRIÇÃO TMFAP — construtor FITT
     ══════════════════════════════════════════════════════════════ */
  function campoPrescricao(id, label, min, max, extra) {
    baldeDoCampo[id] = 'prescricao';
    var v = ler(id);
    var wrap = el('div', { class: 'vf-campo-wrap' });
    wrap.appendChild(el('label', { class: 'vf-rotulo', for: id, texto: label }));
    var inp = el('input', { class: 'vf-campo', id: id, name: id, type: 'number',
                            min: min, max: max, step: 1, value: v === undefined ? '' : v });
    inp.addEventListener('blur', function () {
      if (this.value === '') return;
      this.value = S.limitar(this.value, min, max);
      escrever(id, this.value);
      if (id === 'presc_sustentacao') sugerirRepouso();
    });
    wrap.appendChild(inp);
    if (extra) wrap.appendChild(el('div', { texto: extra,
      style: 'font-size:var(--t-xs);color:var(--cafe-tenue);margin-top:3px' }));
    return wrap;
  }

  /* Repouso na relação 1:2 sobre o tempo de sustentação — sugerido e editável. */
  function sugerirRepouso() {
    var campo = document.getElementById('presc_repouso');
    if (!campo) return;
    var sust = ler('presc_sustentacao');
    if (sust === undefined || sust === '') return;
    if (doc.prescricao.presc_repouso_editado === 'sim') return;
    try {
      var r = S.repousoSugerido(Number(sust));
      campo.value = r;
      escrever('presc_repouso', String(r));
    } catch (e) { /* fora de faixa: mantém o que está */ }
  }

  function renderPrescricao() {
    var alvo = document.getElementById('render-prescricao');
    if (!alvo) return;
    alvo.innerHTML = '';
    var A = window.Adherence;

    /* --- FITT --- */
    var c1 = el('div', { class: 'vf-card quebra-evitar' });
    var cab1 = el('div', { class: 'vf-card-cab' });
    cab1.appendChild(el('div', { class: 'vf-card-num', texto: 'F' }));
    cab1.appendChild(el('h2', { texto: 'Parâmetros FITT' }));
    c1.appendChild(cab1);

    var corpo1 = el('div', { class: 'vf-card-corpo' });
    var g1 = el('div', { class: 'vf-grade vf-grade-3' });
    g1.appendChild(campoPrescricao('presc_series', 'Séries', 1, 10));
    g1.appendChild(campoPrescricao('presc_sustentacao', 'Sustentação — fibras I (s)', 0, 60,
      'Contração lenta, mantida.'));
    g1.appendChild(campoPrescricao('presc_repeticoes', 'Repetições lentas', 1, 30));
    g1.appendChild(campoPrescricao('presc_rapidas', 'Contrações rápidas — fibras II', 0, 30,
      'Contração e soltura, sem sustentar.'));

    /* Repouso sugerido 1:2, sobrescrevível */
    baldeDoCampo['presc_repouso'] = 'prescricao';
    var wr = el('div', { class: 'vf-campo-wrap' });
    wr.appendChild(el('label', { class: 'vf-rotulo', for: 'presc_repouso', texto: 'Repouso entre contrações (s)' }));
    var inpR = el('input', { class: 'vf-campo', id: 'presc_repouso', name: 'presc_repouso',
                             type: 'number', min: 0, max: 120, step: 1,
                             value: ler('presc_repouso') === undefined ? '' : ler('presc_repouso') });
    inpR.addEventListener('input', function () {
      escrever('presc_repouso_editado', 'sim');
    });
    wr.appendChild(inpR);
    wr.appendChild(el('div', { texto: 'Sugerido na relação 1:2 sobre a sustentação. Editável.',
      style: 'font-size:var(--t-xs);color:var(--cafe-tenue);margin-top:3px' }));
    g1.appendChild(wr);

    g1.appendChild(campoPrescricao('presc_frequencia', 'Frequência diária (×/dia)', 1, 10));
    corpo1.appendChild(g1);
    c1.appendChild(corpo1);
    alvo.appendChild(c1);

    /* --- Postura da semana --- */
    var c2 = el('div', { class: 'vf-card quebra-evitar' });
    var cab2 = el('div', { class: 'vf-card-cab' });
    cab2.appendChild(el('div', { class: 'vf-card-num', texto: 'P' }));
    cab2.appendChild(el('h2', { texto: 'Postura da semana' }));
    c2.appendChild(cab2);

    var corpo2 = el('div', { class: 'vf-card-corpo' });
    corpo2.appendChild(el('p', { class: 'no-print',
      style: 'font-size:var(--t-sm);color:var(--cafe-suave);margin:0 0 var(--e-3)',
      texto: 'Progressão postural: ' + S.PROGRESSAO_POSTURAL.join(' → ') + '.' }));

    baldeDoCampo['presc_postura'] = 'prescricao';
    var gp = el('div', { class: 'vf-opcoes' });
    A.POSTURAS.forEach(function (p) {
      var lb = el('label', { title: p.descricao, style: 'padding:8px 14px' });
      var ip = el('input', { type: 'radio', name: 'presc_postura', value: p.rotulo });
      if (ler('presc_postura') === p.rotulo) ip.checked = true;
      lb.appendChild(ip);
      lb.appendChild(el('span', { html: '<span style="font-size:16px;margin-right:5px">' + p.icone + '</span>' + escapar(p.rotulo) }));
      gp.appendChild(lb);
    });
    corpo2.appendChild(gp);

    var descPostura = el('p', { id: 'presc_postura_desc',
      style: 'font-size:var(--t-sm);color:var(--cafe-suave);margin:var(--e-3) 0 0' });
    var sel = A.POSTURAS.filter(function (p) { return p.rotulo === ler('presc_postura'); })[0];
    descPostura.textContent = sel ? sel.descricao : '';
    corpo2.appendChild(descPostura);
    c2.appendChild(corpo2);
    alvo.appendChild(c2);

    /* --- Instruções selecionáveis --- */
    var c3 = el('div', { class: 'vf-card quebra-evitar' });
    var cab3 = el('div', { class: 'vf-card-cab' });
    cab3.appendChild(el('div', { class: 'vf-card-num', texto: 'I' }));
    cab3.appendChild(el('h2', { texto: 'Instruções para o cartão' }));
    c3.appendChild(cab3);

    var corpo3 = el('div', { class: 'vf-card-corpo' });
    corpo3.appendChild(blocoInstrucoes('presc_instr_resp', 'Respiratórias', A.INSTRUCOES_RESPIRATORIAS));
    corpo3.appendChild(blocoInstrucoes('presc_instr_prop', 'Proprioceptivas', A.INSTRUCOES_PROPRIOCEPTIVAS));

    baldeDoCampo['presc_knack'] = 'prescricao';
    var lbK = el('label', { class: 'vf-opcoes', style: 'display:block;margin-top:var(--e-4)' });
    var wrapK = el('label', { style: 'display:inline-flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:var(--t-sm);line-height:1.5' });
    var ipK = el('input', { type: 'checkbox', name: 'presc_knack', value: 'sim',
                            style: 'accent-color:var(--terracota);margin-top:3px' });
    if (ler('presc_knack') === 'sim' || (Array.isArray(ler('presc_knack')) && ler('presc_knack').length)) ipK.checked = true;
    wrapK.appendChild(ipK);
    wrapK.appendChild(el('span', { texto: 'Incluir The Knack no cartão' }));
    lbK.appendChild(wrapK);
    corpo3.appendChild(lbK);

    baldeDoCampo['presc_obs'] = 'prescricao';
    var wo = el('div', { style: 'margin-top:var(--e-4)' });
    wo.appendChild(el('label', { class: 'vf-rotulo', for: 'presc_obs', texto: 'Observação personalizada' }));
    var tao = el('textarea', { class: 'vf-campo', id: 'presc_obs', name: 'presc_obs', rows: 2 });
    tao.value = ler('presc_obs') || '';
    wo.appendChild(tao);
    corpo3.appendChild(wo);
    c3.appendChild(corpo3);
    alvo.appendChild(c3);

    /* --- Cartão VIP de Treino --- */
    alvo.appendChild(el('div', { id: 'cartao-treino' }));
    renderCartaoTreino();
  }

  function blocoInstrucoes(id, titulo, lista) {
    baldeDoCampo[id] = 'prescricao';
    var marcadas = Array.isArray(ler(id)) ? ler(id) : [];
    var box = el('div', { style: 'margin-bottom:var(--e-4)' });
    box.appendChild(el('label', { class: 'vf-rotulo', texto: titulo }));
    var g = el('div', { class: 'vf-opcoes', style: 'flex-direction:column;align-items:stretch;gap:4px' });
    lista.forEach(function (txtItem, i) {
      var lb = el('label', { style: 'align-items:flex-start;line-height:1.45;padding:6px 11px' });
      var ip = el('input', { type: 'checkbox', name: id, value: txtItem, style: 'margin-top:3px' });
      if (marcadas.indexOf(txtItem) !== -1) ip.checked = true;
      lb.appendChild(ip);
      lb.appendChild(el('span', { texto: txtItem }));
      g.appendChild(lb);
    });
    box.appendChild(g);
    return box;
  }

  function renderCartaoTreino() {
    var alvo = document.getElementById('cartao-treino');
    if (!alvo) return;
    var A = window.Adherence;
    var p = doc.prescricao || {};
    var nome = ler('ident_nome') || '';

    var linhas = [];
    if (p.presc_series)      linhas.push(['Séries', p.presc_series]);
    if (p.presc_sustentacao) linhas.push(['Sustentar', p.presc_sustentacao + ' segundos']);
    if (p.presc_repeticoes)  linhas.push(['Repetições lentas', p.presc_repeticoes]);
    if (p.presc_rapidas)     linhas.push(['Contrações rápidas', p.presc_rapidas]);
    if (p.presc_repouso)     linhas.push(['Repouso entre elas', p.presc_repouso + ' segundos']);
    if (p.presc_frequencia)  linhas.push(['Vezes por dia', p.presc_frequencia]);
    if (p.presc_postura)     linhas.push(['Posição desta semana', p.presc_postura]);

    var html = '<div class="vf-cartao-treino">' +
      '<div class="cartao-cab">' +
        '<span class="cartao-etiqueta">Seu treino</span>' +
        '<h2>' + (nome ? escapar(nome) : 'Programa domiciliar') + '</h2>' +
      '</div>';

    if (!linhas.length) {
      html += '<p class="no-print" style="color:var(--cafe-suave);margin:0">' +
              'Preencha os parâmetros acima para gerar o cartão.</p>';
    } else {
      html += '<dl class="cartao-lista">';
      linhas.forEach(function (l) {
        html += '<div><dt>' + escapar(l[0]) + '</dt><dd>' + escapar(l[1]) + '</dd></div>';
      });
      html += '</dl>';

      var instr = [].concat(
        Array.isArray(p.presc_instr_resp) ? p.presc_instr_resp : [],
        Array.isArray(p.presc_instr_prop) ? p.presc_instr_prop : []
      );
      if (instr.length) {
        html += '<div class="cartao-bloco"><h3>Como fazer</h3><ul>';
        instr.forEach(function (i) { html += '<li>' + escapar(i) + '</li>'; });
        html += '</ul></div>';
      }
      if (p.presc_knack === 'sim' || (Array.isArray(p.presc_knack) && p.presc_knack.length)) {
        html += '<div class="cartao-nota">' + escapar(A.THE_KNACK) + '</div>';
      }
      if (p.presc_obs) {
        html += '<div class="cartao-bloco"><h3>Observação</h3><p>' + escapar(p.presc_obs) + '</p></div>';
      }
    }

    html += '<div class="cartao-rodape">' + escapar(F.RODAPE_LEGAL) + '</div></div>';
    alvo.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 3 · ADERÊNCIA E VÍNCULO
     ══════════════════════════════════════════════════════════════ */
  var DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  function renderAderencia() {
    var alvo = document.getElementById('render-aderencia');
    if (!alvo) return;
    alvo.innerHTML = '';
    var A = window.Adherence;

    /* --- Contrato de aliança terapêutica --- */
    var c1 = el('div', { class: 'vf-card quebra-evitar' });
    var cab1 = el('div', { class: 'vf-card-cab' });
    cab1.appendChild(el('div', { class: 'vf-card-num', texto: 'A' }));
    cab1.appendChild(el('h2', { texto: A.CONTRATO.titulo }));
    c1.appendChild(cab1);

    var b1 = el('div', { class: 'vf-card-corpo' });
    b1.appendChild(el('p', { texto: A.CONTRATO.abertura, style: 'margin-bottom:var(--e-4)' }));

    var duas = el('div', { class: 'vf-grade vf-grade-2' });
    duas.appendChild(listaCompromisso('Compromisso da fisioterapeuta', A.CONTRATO.compromissoProfissional));
    duas.appendChild(listaCompromisso('Compromisso da paciente', A.CONTRATO.compromissoPaciente));
    b1.appendChild(duas);

    b1.appendChild(el('h3', { texto: 'Meta SMART desta etapa' }));
    var gs = el('div', { class: 'vf-grade' });
    A.CONTRATO.camposSmart.forEach(function (c) {
      baldeDoCampo[c.id] = 'aderencia';
      var w = el('div', { class: 'vf-campo-wrap' });
      w.appendChild(el('label', { class: 'vf-rotulo', for: c.id, texto: c.label }));
      var inp = el('input', { class: 'vf-campo', id: c.id, name: c.id,
                              value: ler(c.id) === undefined ? '' : ler(c.id) });
      w.appendChild(inp);
      gs.appendChild(w);
    });
    b1.appendChild(gs);

    var assin = el('div', { class: 'vf-so-impr bloco-assinaturas' });
    assin.innerHTML = '<div><div class="linha-assin"></div><span>Paciente</span></div>' +
                      '<div><div class="linha-assin"></div><span>Vanessa Fernandes — ' + escapar(F.CREFITO) + '</span></div>';
    b1.appendChild(assin);

    c1.appendChild(b1);
    alvo.appendChild(c1);

    /* --- Habit tracker 7 × N --- */
    var c2 = el('div', { class: 'vf-card quebra-evitar' });
    var cab2 = el('div', { class: 'vf-card-cab' });
    cab2.appendChild(el('div', { class: 'vf-card-num', texto: 'H' }));
    cab2.appendChild(el('h2', { texto: 'Registro semanal' }));
    c2.appendChild(cab2);

    var b2 = el('div', { class: 'vf-card-corpo' });
    b2.appendChild(el('p', { class: 'no-print',
      style: 'font-size:var(--t-sm);color:var(--cafe-suave)',
      texto: 'Nomeie as linhas conforme o combinado com a paciente. A matriz vai impressa para ela marcar à caneta.' }));

    var tw = el('div', { style: 'overflow-x:auto' });
    var t = el('table', { class: 'vf-tracker' });
    var th = el('thead'); var trh = el('tr');
    trh.appendChild(el('th', { texto: 'Hábito', scope: 'col' }));
    DIAS.forEach(function (d) { trh.appendChild(el('th', { texto: d, scope: 'col' })); });
    th.appendChild(trh); t.appendChild(th);

    var tb = el('tbody');
    for (var linha = 1; linha <= 4; linha++) {
      (function (n) {
        var idRot = 'hab_rotulo_' + n;
        baldeDoCampo[idRot] = 'aderencia';
        var tr = el('tr');
        var tdR = el('td');
        var inp = el('input', { class: 'vf-campo vf-tracker-rotulo', id: idRot, name: idRot,
                                placeholder: 'Ex.: treino da manhã',
                                value: ler(idRot) === undefined ? '' : ler(idRot) });
        tdR.appendChild(inp);
        tr.appendChild(tdR);
        DIAS.forEach(function (d, di) {
          var idCel = 'hab_' + n + '_' + di;
          baldeDoCampo[idCel] = 'aderencia';
          var td = el('td');
          var lb = el('label', { class: 'vf-tracker-cel' });
          var cb = el('input', { type: 'checkbox', name: idCel, value: 'sim' });
          if (Array.isArray(ler(idCel)) && ler(idCel).length) cb.checked = true;
          lb.appendChild(cb);
          td.appendChild(lb);
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      })(linha);
    }
    t.appendChild(tb); tw.appendChild(t); b2.appendChild(tw);
    c2.appendChild(b2);
    alvo.appendChild(c2);

    /* --- Gerador de âncoras --- */
    var c3 = el('div', { class: 'vf-card quebra-evitar' });
    var cab3 = el('div', { class: 'vf-card-cab' });
    cab3.appendChild(el('div', { class: 'vf-card-num', texto: 'Â' }));
    cab3.appendChild(el('h2', { texto: 'Âncora de hábito' }));
    c3.appendChild(cab3);

    var b3 = el('div', { class: 'vf-card-corpo' });
    b3.appendChild(el('p', { class: 'no-print',
      style: 'font-size:var(--t-sm);color:var(--cafe-suave)',
      texto: 'Ancorar o exercício a algo que já acontece todo dia funciona melhor que marcar horário.' }));

    var gA = el('div', { class: 'vf-grade vf-grade-2' });
    ['anc_gatilho', 'anc_acao'].forEach(function (id, i) {
      baldeDoCampo[id] = 'aderencia';
      var w = el('div', { class: 'vf-campo-wrap' });
      w.appendChild(el('label', { class: 'vf-rotulo', for: id,
        texto: i === 0 ? 'Gatilho — algo que já faz todo dia' : 'Ação — o exercício combinado' }));
      var inp = el('input', { class: 'vf-campo', id: id, name: id,
                              list: i === 0 ? 'lista-gatilhos' : null,
                              value: ler(id) === undefined ? '' : ler(id) });
      inp.addEventListener('input', montarAncoraNaTela);
      w.appendChild(inp);
      gA.appendChild(w);
    });
    b3.appendChild(gA);

    var dl = el('datalist', { id: 'lista-gatilhos' });
    A.GATILHOS_SUGERIDOS.forEach(function (g) { dl.appendChild(el('option', { value: g })); });
    b3.appendChild(dl);

    b3.appendChild(el('div', { class: 'vf-ancora-saida', id: 'ancora-saida' }));
    c3.appendChild(b3);
    alvo.appendChild(c3);
    montarAncoraNaTela();

    /* --- Scripts de WhatsApp --- */
    var c4 = el('div', { class: 'vf-card no-print' });
    var cab4 = el('div', { class: 'vf-card-cab' });
    cab4.appendChild(el('div', { class: 'vf-card-num', texto: 'W' }));
    cab4.appendChild(el('h2', { texto: 'Mensagens de acompanhamento' }));
    c4.appendChild(cab4);

    var b4 = el('div', { class: 'vf-card-corpo' });
    var dados = { nome: primeiroNome(ler('ident_nome')), exercicio: descricaoExercicio() };
    A.WHATSAPP.forEach(function (m) {
      var bloco = el('div', { class: 'vf-msg' });
      var topo = el('div', { class: 'vf-msg-cab' });
      topo.appendChild(el('span', { class: 'vf-badge', 'data-sev': 'neutro', texto: m.marco }));
      topo.appendChild(el('strong', { texto: m.titulo }));
      topo.appendChild(el('span', { class: 'vf-msg-obj', texto: m.objetivo }));
      var btn = el('button', { class: 'vf-btn', texto: 'Copiar' });
      var corpoMsg = A.preencher(m.texto, dados);
      btn.addEventListener('click', function () {
        copiar(corpoMsg, btn);
      });
      topo.appendChild(btn);
      bloco.appendChild(topo);
      bloco.appendChild(el('pre', { class: 'vf-msg-texto', texto: corpoMsg }));
      b4.appendChild(bloco);
    });
    c4.appendChild(b4);
    alvo.appendChild(c4);
  }

  function listaCompromisso(titulo, itens) {
    var box = el('div');
    box.appendChild(el('h4', { texto: titulo, style: 'margin-top:0' }));
    var ul = el('ul', { style: 'margin:0;padding-left:18px;font-size:var(--t-sm);line-height:1.55' });
    itens.forEach(function (i) { ul.appendChild(el('li', { texto: i })); });
    box.appendChild(ul);
    return box;
  }

  function montarAncoraNaTela() {
    var saida = document.getElementById('ancora-saida');
    if (!saida) return;
    saida.textContent = window.Adherence.montarAncora(ler('anc_gatilho'), ler('anc_acao'));
  }

  function primeiroNome(nome) {
    if (!nome) return '';
    return String(nome).trim().split(/\s+/)[0];
  }

  function descricaoExercicio() {
    var p = doc.prescricao || {};
    if (p.presc_sustentacao && p.presc_repeticoes) {
      return p.presc_repeticoes + ' contrações de ' + p.presc_sustentacao + ' segundos' +
             (p.presc_frequencia ? ', ' + p.presc_frequencia + '× ao dia' : '');
    }
    return '';
  }

  function copiar(texto, botao) {
    var rotuloOriginal = botao.textContent;
    var feito = function () {
      botao.textContent = 'Copiado';
      setTimeout(function () { botao.textContent = rotuloOriginal; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(feito).catch(function () { copiarFallback(texto, feito); });
    } else { copiarFallback(texto, feito); }
  }

  function copiarFallback(texto, feito) {
    try {
      var ta = document.createElement('textarea');
      ta.value = texto; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); feito();
    } catch (e) { status('Não foi possível copiar automaticamente'); }
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 4 · ORIENTAÇÕES AO PACIENTE
     ══════════════════════════════════════════════════════════════ */
  function renderOrientacoes() {
    var alvo = document.getElementById('render-orientacoes');
    if (!alvo) return;
    alvo.innerHTML = '';
    var A = window.Adherence;

    /* Seletor */
    var c1 = el('div', { class: 'vf-card no-print' });
    var cab1 = el('div', { class: 'vf-card-cab' });
    cab1.appendChild(el('div', { class: 'vf-card-num', texto: 'K' }));
    cab1.appendChild(el('h2', { texto: 'Montar o kit' }));
    c1.appendChild(cab1);

    var b1 = el('div', { class: 'vf-card-corpo' });
    baldeDoCampo['orient_sel'] = 'aderencia';
    var marcadas = Array.isArray(ler('orient_sel')) ? ler('orient_sel') : [];

    var grade = el('div', { class: 'vf-grade vf-grade-2' });
    A.CARTILHAS.forEach(function (c) {
      var lb = el('label', { class: 'vf-cartilha-op' + (marcadas.indexOf(c.id) !== -1 ? ' sel' : '') });
      var ip = el('input', { type: 'checkbox', name: 'orient_sel', value: c.id,
                             style: 'accent-color:var(--terracota);margin-top:3px' });
      if (marcadas.indexOf(c.id) !== -1) ip.checked = true;
      var txtBox = el('div');
      txtBox.appendChild(el('div', { class: 'vf-cartilha-titulo', texto: c.titulo }));
      txtBox.appendChild(el('div', { class: 'vf-cartilha-resumo', texto: c.resumo }));
      lb.appendChild(ip); lb.appendChild(txtBox);
      grade.appendChild(lb);
    });
    b1.appendChild(grade);

    baldeDoCampo['orient_obs'] = 'aderencia';
    var wo = el('div', { style: 'margin-top:var(--e-4)' });
    wo.appendChild(el('label', { class: 'vf-rotulo', for: 'orient_obs',
                                 texto: 'Observação personalizada para a paciente' }));
    var ta = el('textarea', { class: 'vf-campo', id: 'orient_obs', name: 'orient_obs', rows: 2 });
    ta.value = ler('orient_obs') || '';
    wo.appendChild(ta);
    b1.appendChild(wo);
    c1.appendChild(b1);
    alvo.appendChild(c1);

    /* Kit renderizado */
    if (!marcadas.length) {
      alvo.appendChild(el('div', { class: 'no-print vf-vazio',
        texto: 'Selecione ao menos uma cartilha para compor o kit.' }));
      return;
    }

    var kit = el('div', { class: 'vf-kit' });
    var cabKit = el('div', { class: 'vf-kit-cab' });
    var nome = ler('ident_nome');
    cabKit.innerHTML =
      '<span class="cartao-etiqueta">Orientações domiciliares</span>' +
      '<h2>' + (nome ? 'Para ' + escapar(nome) : 'Orientações ao paciente') + '</h2>';
    kit.appendChild(cabKit);

    var obs = ler('orient_obs');
    if (obs) kit.appendChild(el('div', { class: 'vf-kit-obs', texto: obs }));

    A.CARTILHAS.filter(function (c) { return marcadas.indexOf(c.id) !== -1; })
      .forEach(function (c) {
        var art = el('article', { class: 'vf-cartilha quebra-evitar' });
        art.appendChild(el('h3', { texto: c.titulo }));
        c.blocos.forEach(function (b) {
          var bl = el('div', { class: 'vf-cartilha-bloco' });
          if (b.h) bl.appendChild(el('h4', { texto: b.h }));
          if (b.p) bl.appendChild(el('p', { texto: b.p }));
          if (b.l) {
            var ul = el('ul');
            b.l.forEach(function (i) { ul.appendChild(el('li', { texto: i })); });
            bl.appendChild(ul);
          }
          if (b.nota) bl.appendChild(el('p', { class: 'vf-cartilha-nota', texto: b.nota }));
          art.appendChild(bl);
        });
        kit.appendChild(art);
      });

    kit.appendChild(el('div', { class: 'cartao-rodape', texto: F.RODAPE_LEGAL }));
    alvo.appendChild(kit);
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 5 · LAUDO
     ══════════════════════════════════════════════════════════════ */
  function coletarEscores() {
    var linhas = [];

    /* Wexner */
    var rw = {};
    S.WEXNER_ITENS.forEach(function (i) { rw[i.id] = ler(i.id); });
    if (S.completo(rw, S.WEXNER_ITENS)) {
      try {
        var w = S.calcularWexner(rw);
        linhas.push({ nome: 'Wexner (continência anal)', valor: w.total + ' / 20', classe: w.rotulo, sev: w.severidade });
      } catch (e) { /* ignora */ }
    }

    /* IMC */
    var peso = ler('ef_peso'), alt = ler('ef_estatura');
    if (peso && alt) {
      try {
        var im = S.calcularIMC(peso, alt);
        linhas.push({ nome: 'IMC', valor: String(im.valor).replace('.', ',') + ' kg/m²', classe: im.rotulo, sev: im.severidade });
      } catch (e) { /* ignora */ }
    }

    /* EVA */
    [['s3_eva_queixa', 'EVA — incômodo da queixa'], ['afa_eva_desconforto', 'EVA — desconforto ao exame']]
      .forEach(function (par) {
        var v = ler(par[0]);
        if (v !== undefined && v !== '') {
          try {
            var e = S.classificarEVA(Number(v));
            linhas.push({ nome: par[1], valor: e.valor + ' / 10', classe: e.rotulo, sev: e.severidade });
          } catch (er) { /* ignora */ }
        }
      });

    /* Oxford e ICS */
    var ox = ler('afa_oxford');
    if (ox !== undefined && ox !== '') {
      try { linhas.push({ nome: 'Oxford Modificada', valor: ox + ' / 5', classe: S.textoOxford(Number(ox)), sev: 'neutro' }); }
      catch (e) { /* ignora */ }
    }
    var ics = ler('afa_ics');
    if (ics !== undefined && ics !== '') {
      try { linhas.push({ nome: 'ICS — contração voluntária', valor: ics + ' / 3', classe: S.textoICS(Number(ics)), sev: 'neutro' }); }
      catch (e) { /* ignora */ }
    }

    /* Instrumentos masculinos */
    if (doc.perfil === 'masculino') {
      var ri = {};
      S.IPSS_ITENS.forEach(function (i) { ri[i.id] = ler(i.id); });
      if (S.completo(ri, S.IPSS_ITENS)) {
        try { var p = S.calcularIPSS(ri); linhas.push({ nome: 'IPSS', valor: p.total + ' / 35', classe: p.rotulo, sev: p.severidade }); }
        catch (e) { /* ignora */ }
      }
      var rf = {};
      S.IIEF5_ITENS.forEach(function (i) { rf[i.id] = ler(i.id); });
      if (S.completo(rf, S.IIEF5_ITENS)) {
        try { var q = S.calcularIIEF5(rf); linhas.push({ nome: 'IIEF-5', valor: q.total + ' / 25', classe: q.rotulo, sev: q.severidade }); }
        catch (e) { /* ignora */ }
      }
    }

    return linhas;
  }

  var CONDUTAS = [
    'Cinesioterapia do assoalho pélvico (TMFAP)',
    'Biofeedback eletromiográfico',
    'Eletroestimulação',
    'Terapia manual e liberação miofascial',
    'Treinamento vesical e reprogramação miccional',
    'Reeducação evacuatória',
    'Dessensibilização progressiva',
    'Treino de pré-contração ao esforço (The Knack)',
    'Educação em dor',
    'Orientações domiciliares e cartilhas'
  ];

  function renderLaudo() {
    var alvo = document.getElementById('render-laudo');
    if (!alvo) return;
    alvo.innerHTML = '';

    /* Cabeçalho do laudo */
    var c1 = el('div', { class: 'vf-card quebra-evitar' });
    var cab1 = el('div', { class: 'vf-card-cab' });
    cab1.appendChild(el('div', { class: 'vf-card-num', texto: 'L' }));
    cab1.appendChild(el('h2', { texto: 'Identificação e encaminhamento' }));
    c1.appendChild(cab1);

    var b1 = el('div', { class: 'vf-card-corpo' });
    var g1 = el('div', { class: 'vf-grade vf-grade-2' });
    [['laudo_destinatario', 'Destinatário (Obstetrícia / Ginecologia / Urologia / Coloproctologia / Clínica / UBS)'],
     ['laudo_data', 'Data de emissão'],
     ['laudo_sessoes', 'Nº de sessões realizadas']].forEach(function (par) {
      baldeDoCampo[par[0]] = 'aderencia';
      var w = el('div', { class: 'vf-campo-wrap' });
      w.appendChild(el('label', { class: 'vf-rotulo', for: par[0], texto: par[1] }));
      var inp = el('input', { class: 'vf-campo', id: par[0], name: par[0],
                              type: par[0] === 'laudo_data' ? 'date' : 'text',
                              value: ler(par[0]) === undefined ? '' : ler(par[0]) });
      w.appendChild(inp);
      g1.appendChild(w);
    });
    b1.appendChild(g1);

    var resumo = el('dl', { class: 'vf-laudo-ident' });
    [['Paciente', ler('ident_nome')], ['Idade', ler('ident_idade')],
     ['Data do atendimento', ler('ident_data')],
     ['Perfil', doc.perfil === 'feminino' ? 'Saúde da Mulher' : 'Saúde do Homem'],
     ['Diagnóstico médico', ler('ident_diagnostico_med')]].forEach(function (par) {
      if (!par[1]) return;
      var d = el('div');
      d.appendChild(el('dt', { texto: par[0] }));
      d.appendChild(el('dd', { texto: par[1] }));
      resumo.appendChild(d);
    });
    b1.appendChild(resumo);
    c1.appendChild(b1);
    alvo.appendChild(c1);

    /* Diagnóstico cinético-funcional */
    var c2 = el('div', { class: 'vf-card quebra-evitar' });
    var cab2 = el('div', { class: 'vf-card-cab' });
    cab2.appendChild(el('div', { class: 'vf-card-num', texto: 'D' }));
    cab2.appendChild(el('h2', { texto: 'Diagnóstico cinético-funcional' }));
    c2.appendChild(cab2);
    var b2 = el('div', { class: 'vf-card-corpo' });

    if (ler('ef_autorizou') === 'Não') {
      b2.appendChild(el('div', { class: 'vf-aviso', 'data-tom': 'atencao',
        style: 'margin:0 0 var(--e-3)', texto: F.TEXTO_SEM_CONSENTIMENTO }));
    }

    baldeDoCampo['laudo_diagnostico'] = 'aderencia';
    var ta2 = el('textarea', { class: 'vf-campo', id: 'laudo_diagnostico',
                               name: 'laudo_diagnostico', rows: 5 });
    ta2.value = ler('laudo_diagnostico') || ler('ef_diagnostico_ap') || '';
    b2.appendChild(ta2);
    b2.appendChild(el('p', { class: 'no-print',
      style: 'font-size:var(--t-xs);color:var(--cafe-tenue);margin:var(--e-2) 0 0',
      texto: 'Herda o diagnóstico registrado no exame físico. Editável antes da emissão.' }));
    c2.appendChild(b2);
    alvo.appendChild(c2);

    /* Tabela de escores */
    var c3 = el('div', { class: 'vf-card quebra-evitar' });
    var cab3 = el('div', { class: 'vf-card-cab' });
    cab3.appendChild(el('div', { class: 'vf-card-num', texto: 'E' }));
    cab3.appendChild(el('h2', { texto: 'Escores e classificação' }));
    c3.appendChild(cab3);
    var b3 = el('div', { class: 'vf-card-corpo' });

    var linhas = coletarEscores();
    if (!linhas.length) {
      b3.appendChild(el('p', { style: 'color:var(--cafe-suave);margin:0',
        texto: 'Nenhum escore completo até o momento. Preencha a avaliação para compor esta tabela.' }));
    } else {
      var tw = el('div', { style: 'overflow-x:auto' });
      var t = el('table', { class: 'vf-tabela-escores' });
      var th = el('thead');
      th.innerHTML = '<tr><th scope="col">Instrumento</th><th scope="col">Avaliação inicial</th>' +
                     '<th scope="col">Classificação</th><th scope="col">Reavaliação</th></tr>';
      t.appendChild(th);
      var tb = el('tbody');
      linhas.forEach(function (l, i) {
        var idRe = 'laudo_reav_' + i;
        baldeDoCampo[idRe] = 'aderencia';
        var tr = el('tr');
        tr.appendChild(el('th', { scope: 'row', texto: l.nome }));
        tr.appendChild(el('td', { texto: l.valor }));
        var tdC = el('td');
        tdC.appendChild(el('span', { class: 'vf-badge', 'data-sev': l.sev, texto: l.classe }));
        tr.appendChild(tdC);
        var tdR = el('td');
        var inp = el('input', { class: 'vf-campo', id: idRe, name: idRe,
                                placeholder: '—', value: ler(idRe) === undefined ? '' : ler(idRe) });
        tdR.appendChild(inp);
        tr.appendChild(tdR);
        tb.appendChild(tr);
      });
      t.appendChild(tb); tw.appendChild(t); b3.appendChild(tw);
    }
    c3.appendChild(b3);
    alvo.appendChild(c3);

    /* Condutas */
    var c4 = el('div', { class: 'vf-card quebra-evitar' });
    var cab4 = el('div', { class: 'vf-card-cab' });
    cab4.appendChild(el('div', { class: 'vf-card-num', texto: 'C' }));
    cab4.appendChild(el('h2', { texto: 'Condutas propostas' }));
    c4.appendChild(cab4);
    var b4 = el('div', { class: 'vf-card-corpo' });

    baldeDoCampo['laudo_condutas'] = 'aderencia';
    var marcadas = Array.isArray(ler('laudo_condutas')) ? ler('laudo_condutas') : [];
    var gc = el('div', { class: 'vf-opcoes no-print', style: 'flex-direction:column;align-items:stretch;gap:4px' });
    CONDUTAS.forEach(function (cond) {
      var lb = el('label', { style: 'align-items:flex-start;padding:6px 11px' });
      var ip = el('input', { type: 'checkbox', name: 'laudo_condutas', value: cond, style: 'margin-top:3px' });
      if (marcadas.indexOf(cond) !== -1) ip.checked = true;
      lb.appendChild(ip); lb.appendChild(el('span', { texto: cond }));
      gc.appendChild(lb);
    });
    b4.appendChild(gc);

    if (marcadas.length) {
      var ulC = el('ul', { class: 'vf-so-impr vf-lista-condutas' });
      marcadas.forEach(function (m) { ulC.appendChild(el('li', { texto: m })); });
      b4.appendChild(ulC);
    }

    [['laudo_plano', 'Plano terapêutico', 4],
     ['laudo_frequencia', 'Frequência e duração previstas', 1],
     ['laudo_consideracoes', 'Considerações ao profissional solicitante', 3]].forEach(function (par) {
      baldeDoCampo[par[0]] = 'aderencia';
      var w = el('div', { style: 'margin-top:var(--e-3)' });
      w.appendChild(el('label', { class: 'vf-rotulo', for: par[0], texto: par[1] }));
      var ta = el('textarea', { class: 'vf-campo', id: par[0], name: par[0], rows: par[2] });
      ta.value = ler(par[0]) || '';
      w.appendChild(ta);
      b4.appendChild(w);
    });
    c4.appendChild(b4);
    alvo.appendChild(c4);

    /* Assinatura, só no papel */
    var assin = el('div', { class: 'vf-so-impr bloco-assinatura-laudo' });
    assin.innerHTML = '<div class="linha-assin"></div>' +
      '<div class="assin-nome">Vanessa Fernandes</div>' +
      '<div class="assin-reg">Fisioterapeuta — ' + escapar(F.CREFITO) + '</div>' +
      /* Contato para o colega responder ou encaminhar de volta. */
      (F.CONTATO ? '<div class="assin-reg">' + escapar(F.CONTATO) + '</div>' : '');
    alvo.appendChild(assin);
  }

  window.__renderPrescricao  = renderPrescricao;
  window.__renderAderencia   = renderAderencia;
  window.__renderOrientacoes = renderOrientacoes;
  window.__renderLaudo       = renderLaudo;

  /* ──────────────────────────────────────────────────────────────
     INICIALIZAÇÃO
     ────────────────────────────────────────────────────────────── */
  function renderTudo() {
    renderAvaliacao();
    renderBarraModo();
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

    /* Começa com a identificação aberta e o resto recolhido. */
    secoesAbertas['identificacao'] = true;

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
