/* ════════════════════════════════════════════════════════════════
   js/prontuario.js — Interface do prontuário local cifrado.

   Depende de window.Ficha (CREFITO) e window.Cofre (núcleo).
   Tudo que a Vanessa digita entra na tela por textContent — nunca por
   innerHTML —, então nenhum texto de paciente vira código na página.
   A chave de criptografia vive só em memória: bloquear, recarregar ou
   ficar 15 minutos parado apaga a chave, e é preciso a senha de novo.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.Cofre, F = window.Ficha;
  var AUTORIA = { nome: 'Vanessa Fernandes', registro: F.CREFITO };
  var MINUTOS_BLOQUEIO = 15;
  var DIAS_BACKUP = 7;

  var estado = { sessao: null, banco: null, atual: null, retificaId: null, modo: null };
  var $ = function (id) { return document.getElementById(id); };

  /* ── utilidades ───────────────────────────────────────────────── */
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function hojeISO() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function dataBR(iso) {
    if (!iso) return '';
    var d = String(iso).slice(0, 10).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : iso;
  }
  function horaBR(d) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  var toast = el('div');
  toast.setAttribute('role', 'status');
  toast.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);max-width:92vw;' +
    'background:#3D2E28;color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;z-index:20;display:none;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.2)';
  document.body.appendChild(toast);
  var toastTimer;
  function avisar(msg, erro) {
    toast.textContent = msg;
    toast.style.background = erro ? '#A33A2E' : '#3D2E28';
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.style.display = 'none'; }, erro ? 7000 : 3500);
  }

  function mostrar(tela) {
    ['tela-cofre', 'tela-lista', 'tela-paciente'].forEach(function (t) { $(t).hidden = t !== tela; });
    $('acoes-topo').hidden = !estado.sessao;
    window.scrollTo(0, 0);
  }

  /* ── persistência: toda alteração é cifrada e gravada ────────── */
  var fila = Promise.resolve();
  var gravando = 0;
  function salvar() {
    gravando++;
    fila = fila.then(async function () {
      var env = await C.cifrar(estado.sessao, estado.banco);
      await C.Armazem.gravar('envelope', env);
      $('status-salvo').textContent = 'Salvo às ' + horaBR(new Date());
    }).catch(function (e) {
      avisar('Não foi possível salvar: ' + e.message, true);
    }).finally(function () { gravando--; });
    return fila;
  }

  /* ── diálogo genérico ─────────────────────────────────────────── */
  function perguntar(op) {
    return new Promise(function (resolve) {
      var d = $('dialogo'), form = $('form-dialogo'), caixa = $('dlg-campos');
      $('dlg-titulo').textContent = op.titulo;
      $('dlg-texto').textContent = op.texto || '';
      caixa.textContent = '';
      (op.campos || []).forEach(function (c) {
        var l = el('label', null, c.rotulo);
        var i = document.createElement('input');
        i.type = c.tipo || 'text';
        i.name = c.nome;
        i.autocomplete = c.auto || 'off';
        l.appendChild(i);
        caixa.appendChild(l);
      });
      $('dlg-erro').textContent = '';
      $('dlg-ok').textContent = op.ok || 'Confirmar';
      $('dlg-ok').className = op.perigo ? 'perigo' : 'pri';
      function fechar(v) {
        form.removeEventListener('submit', enviar);
        $('dlg-cancelar').removeEventListener('click', cancelar);
        d.removeEventListener('cancel', aoEsc);
        if (d.open) d.close();
        resolve(v);
      }
      async function enviar(e) {
        e.preventDefault();
        var vals = {};
        caixa.querySelectorAll('input').forEach(function (i) { vals[i.name] = i.value; });
        $('dlg-ok').disabled = true;
        try {
          var r = op.validar ? await op.validar(vals) : vals;
          fechar(r === undefined ? vals : r);
        } catch (err) {
          $('dlg-erro').textContent = err.message;
        } finally {
          $('dlg-ok').disabled = false;
        }
      }
      function cancelar() { fechar(null); }
      function aoEsc(ev) { ev.preventDefault(); cancelar(); }
      form.addEventListener('submit', enviar);
      $('dlg-cancelar').addEventListener('click', cancelar);
      d.addEventListener('cancel', aoEsc);
      d.showModal();
      var primeiro = caixa.querySelector('input');
      (primeiro || $('dlg-ok')).focus();
    });
  }

  /* ── cofre: criar, abrir, bloquear ────────────────────────────── */
  function modoCofre(modo) {
    estado.modo = modo;
    var criar = modo === 'criar';
    $('cofre-titulo').textContent = criar ? 'Criar o prontuário' : 'Abrir o prontuário';
    $('cofre-texto').textContent = criar
      ? 'Escolha uma senha forte, com pelo menos 8 caracteres. Ela protege os dados das pacientes.'
      : 'Digite a sua senha.';
    $('rotulo-senha2').hidden = !criar;
    $('senha2').required = criar;
    $('aviso-criar').hidden = !criar;
    $('bt-cofre').textContent = criar ? 'Criar prontuário' : 'Entrar';
    $('senha').autocomplete = criar ? 'new-password' : 'current-password';
    $('erro-cofre').textContent = '';
    $('senha').value = '';
    $('senha2').value = '';
    mostrar('tela-cofre');
    $('senha').focus();
  }

  $('form-cofre').addEventListener('submit', async function (e) {
    e.preventDefault();
    var senha = $('senha').value;
    var bt = $('bt-cofre');
    bt.disabled = true;
    var rotulo = bt.textContent;
    bt.textContent = 'Aguarde…';
    $('erro-cofre').textContent = '';
    try {
      if (estado.modo === 'criar') {
        if (senha !== $('senha2').value) throw new Error('As duas senhas não são iguais.');
        var r = await C.criar(senha);
        await C.Armazem.gravar('envelope', r.envelope);
        try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (x) {}
        entrar(r.sessao, r.banco);
      } else {
        var env = await C.Armazem.ler('envelope');
        var a = await C.abrir(senha, env);
        entrar(a.sessao, a.banco);
      }
    } catch (err) {
      $('erro-cofre').textContent = err.message;
    } finally {
      bt.disabled = false;
      bt.textContent = rotulo;
      $('senha').value = '';
      $('senha2').value = '';
    }
  });

  function entrar(sessao, banco) {
    estado.sessao = sessao;
    estado.banco = banco;
    estado.atual = null;
    marcarAtividade();
    renderLista();
    mostrar('tela-lista');
    $('busca').focus();
  }

  function bloquear(motivo) {
    if (document.activeElement) document.activeElement.blur();
    gravarFormularioPendente();
    return fila.then(function () {
      estado.sessao = null;
      estado.banco = null;
      estado.atual = null;
      estado.retificaId = null;
      $('lista').textContent = '';
      $('evolucoes').textContent = '';
      $('form-paciente').reset();
      $('form-evolucao').reset();
      $('impressao').textContent = '';
      $('busca').value = '';
      modoCofre('abrir');
      if (motivo) avisar(motivo);
    });
  }
  $('bt-bloquear').addEventListener('click', function () { bloquear('Prontuário bloqueado.'); });

  /* Bloqueio automático por inatividade */
  var ultimaAtividade = Date.now();
  function marcarAtividade() { ultimaAtividade = Date.now(); }
  ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) {
    document.addEventListener(ev, marcarAtividade, { passive: true });
  });
  setInterval(function () {
    if (estado.sessao && Date.now() - ultimaAtividade > MINUTOS_BLOQUEIO * 60000) {
      bloquear('Bloqueado após ' + MINUTOS_BLOQUEIO + ' minutos sem uso.');
    }
  }, 30000);

  /* ── lista ────────────────────────────────────────────────────── */
  function renderLista() {
    var ul = $('lista');
    ul.textContent = '';
    var res = C.buscar(estado.banco, $('busca').value, $('ver-arquivadas').checked);
    $('lista-vazia').hidden = res.length > 0;
    $('lista-vazia').textContent = estado.banco.pacientes.length
      ? 'Nenhuma paciente encontrada.'
      : 'Nenhuma paciente cadastrada ainda. Comece em "Nova paciente".';
    var hoje = hojeISO();
    res.forEach(function (p) {
      var li = el('li');
      var b = el('button');
      b.type = 'button';
      b.appendChild(el('span', 'n', p.nome + (p.arquivada ? ' (arquivada)' : '')));
      b.appendChild(el('span', 'e', p.etapa));
      var info;
      if (p.proximaAcao && p.proximaAcao.data) {
        var vencida = p.proximaAcao.data < hoje;
        info = el('span', 'p' + (vencida ? ' vencida' : ''),
          (vencida ? 'Atrasada · ' : 'Próxima ação · ') + dataBR(p.proximaAcao.data) +
          (p.proximaAcao.texto ? ' — ' + p.proximaAcao.texto : ''));
      } else {
        info = el('span', 'p', 'Último registro em ' + dataBR(C.ultimoRegistro(p)));
      }
      b.appendChild(info);
      b.addEventListener('click', function () { abrirPaciente(p.id); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    alertaBackup();
  }
  $('busca').addEventListener('input', renderLista);
  $('ver-arquivadas').addEventListener('change', renderLista);

  async function alertaBackup() {
    var meta = (await C.Armazem.ler('meta')) || {};
    var alerta = $('alerta-backup');
    if (!estado.banco || !estado.banco.pacientes.length) { alerta.hidden = true; return; }
    var dias = meta.ultimoBackup ? Math.floor((Date.now() - new Date(meta.ultimoBackup)) / 86400000) : null;
    if (dias === null || dias >= DIAS_BACKUP) {
      alerta.textContent = dias === null
        ? 'Você ainda não fez nenhum backup. Se este computador der problema, os registros se perdem — clique em "Fazer backup".'
        : 'Seu último backup foi há ' + dias + ' dias. Faça um novo em "Fazer backup".';
      alerta.hidden = false;
    } else {
      alerta.hidden = true;
    }
  }

  $('bt-nova').addEventListener('click', async function () {
    var r = await perguntar({
      titulo: 'Nova paciente', ok: 'Criar',
      campos: [{ nome: 'nome', rotulo: 'Nome completo' }],
      validar: function (v) { return C.novaPaciente({ nome: v.nome }); }
    });
    if (!r) return;
    estado.banco.pacientes.push(r);
    await salvar();
    abrirPaciente(r.id);
  });

  /* ── paciente ─────────────────────────────────────────────────── */
  var sel = $('sel-etapa');
  C.ETAPAS.forEach(function (et) { var o = el('option', null, et); o.value = et; sel.appendChild(o); });
  $('autoria').textContent = 'Registrado por ' + AUTORIA.nome + ' — ' + AUTORIA.registro;

  var CAMPOS_TEXTO = ['historia', 'exameFisico', 'examesComplementares', 'diagnostico', 'prognostico', 'plano'];

  function abrirPaciente(id) {
    var p = estado.banco.pacientes.find(function (x) { return x.id === id; });
    if (!p) return;
    estado.atual = p;
    var f = $('form-paciente');
    f.nome.value = p.nome;
    f.nascimento.value = p.nascimento || '';
    f.telefone.value = p.telefone || '';
    f.origem.value = p.origem || '';
    f.encaminhadoPor.value = p.encaminhadoPor || '';
    f.etapa.value = p.etapa || C.ETAPAS[0];
    f.proximaTexto.value = (p.proximaAcao && p.proximaAcao.texto) || '';
    f.proximaData.value = (p.proximaAcao && p.proximaAcao.data) || '';
    f.consentimentoRegistro.checked = !!p.consentimentoRegistro;
    f.consentimentoWhatsapp.checked = !!p.consentimentoWhatsapp;
    CAMPOS_TEXTO.forEach(function (c) { f[c].value = p[c] || ''; });
    $('form-evolucao').data.value = hojeISO();
    $('form-evolucao').texto.value = '';
    cancelarRetifica();
    renderEvolucoes();
    atualizarAcoes();
    $('status-salvo').textContent = '';
    mostrar('tela-paciente');
  }

  var temporizadorForm = null;
  $('form-paciente').addEventListener('input', function () {
    clearTimeout(temporizadorForm);
    temporizadorForm = setTimeout(aplicarFormulario, 1000);
  });
  $('form-paciente').addEventListener('change', aplicarFormulario);
  function gravarFormularioPendente() {
    if (!temporizadorForm) return;
    clearTimeout(temporizadorForm);
    aplicarFormulario();
  }
  async function aplicarFormulario() {
    clearTimeout(temporizadorForm);
    temporizadorForm = null;
    var p = estado.atual, f = $('form-paciente');
    if (!p) return;
    var nome = f.nome.value.trim();
    if (!nome) { f.nome.value = p.nome; avisar('O nome não pode ficar em branco.', true); return; }
    p.nome = nome;
    p.nascimento = f.nascimento.value;
    p.telefone = f.telefone.value.trim();
    p.origem = f.origem.value;
    p.encaminhadoPor = f.encaminhadoPor.value.trim();
    p.etapa = f.etapa.value;
    p.proximaAcao = { texto: f.proximaTexto.value.trim(), data: f.proximaData.value };
    p.consentimentoRegistro = f.consentimentoRegistro.checked;
    p.consentimentoWhatsapp = f.consentimentoWhatsapp.checked;
    CAMPOS_TEXTO.forEach(function (c) { p[c] = f[c].value; });
    p.atualizadoEm = new Date().toISOString();
    await salvar();
    atualizarAcoes();
  }
  $('form-paciente').addEventListener('submit', function (e) { e.preventDefault(); });

  function atualizarAcoes() {
    var p = estado.atual;
    $('bt-arquivar').textContent = p.arquivada ? 'Reativar' : 'Arquivar';
    var pode = C.podeExcluir(p);
    $('bt-excluir').disabled = !pode;
    $('guarda-info').textContent = pode
      ? 'O prazo mínimo de guarda deste prontuário já terminou.'
      : 'Guarda obrigatória até ' + dataBR(C.dataLiberacao(p).toISOString()) +
        ' (5 anos após o último registro — Resolução COFFITO nº 414/2012). Até lá, é possível arquivar, não excluir.';
  }

  $('bt-voltar').addEventListener('click', async function () {
    if (document.activeElement) document.activeElement.blur();
    await fila;
    estado.atual = null;
    renderLista();
    mostrar('tela-lista');
  });

  $('bt-arquivar').addEventListener('click', async function () {
    var p = estado.atual;
    p.arquivada = !p.arquivada;
    p.atualizadoEm = new Date().toISOString();
    await salvar();
    atualizarAcoes();
    avisar(p.arquivada ? 'Paciente arquivada. Ela some da lista, mas o prontuário continua guardado.' : 'Paciente reativada.');
  });

  $('bt-excluir').addEventListener('click', async function () {
    var p = estado.atual;
    if (!C.podeExcluir(p)) return;
    var r = await perguntar({
      titulo: 'Excluir prontuário', ok: 'Excluir definitivamente', perigo: true,
      texto: 'Esta ação apaga o prontuário de ' + p.nome + ' deste aparelho e não pode ser desfeita. Para confirmar, digite o nome completo.',
      campos: [{ nome: 'nome', rotulo: 'Nome completo' }],
      validar: function (v) { if (v.nome.trim() !== p.nome) throw new Error('O nome digitado não confere.'); }
    });
    if (!r) return;
    estado.banco.pacientes = estado.banco.pacientes.filter(function (x) { return x.id !== p.id; });
    estado.atual = null;
    await salvar();
    renderLista();
    mostrar('tela-lista');
    avisar('Prontuário excluído.');
  });

  /* ── evoluções ────────────────────────────────────────────────── */
  function renderEvolucoes() {
    var ol = $('evolucoes');
    ol.textContent = '';
    var evs = estado.atual.evolucoes.slice().sort(function (a, b) {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      return a.criadoEm < b.criadoEm ? 1 : -1;
    });
    if (!evs.length) {
      ol.appendChild(el('li', 'vazio', 'Nenhuma evolução registrada.'));
      return;
    }
    var retificadas = {};
    evs.forEach(function (e) { if (e.retificaId) retificadas[e.retificaId] = true; });
    evs.forEach(function (e) {
      var li = el('li', retificadas[e.id] ? 'retificada' : '');
      var cab = el('div', 'cab');
      cab.appendChild(el('b', null, dataBR(e.data)));
      cab.appendChild(el('span', null, e.autora + ' — ' + e.registro));
      if (e.retificaId) {
        var orig = estado.atual.evolucoes.find(function (x) { return x.id === e.retificaId; });
        cab.appendChild(el('span', 'tag', 'Retificação' + (orig ? ' da evolução de ' + dataBR(orig.data) : '')));
      }
      if (retificadas[e.id]) cab.appendChild(el('span', 'tag', 'Retificada'));
      li.appendChild(cab);
      li.appendChild(el('div', 'txt', e.texto));
      var acoes = el('div', 'acoes');
      var bt = el('button', null, 'Retificar');
      bt.type = 'button';
      bt.addEventListener('click', function () { iniciarRetifica(e); });
      acoes.appendChild(bt);
      li.appendChild(acoes);
      ol.appendChild(li);
    });
  }

  function iniciarRetifica(e) {
    estado.retificaId = e.id;
    $('retifica-info').textContent = 'Retificando a evolução de ' + dataBR(e.data) +
      '. A original continua registrada; a correção fica ligada a ela.';
    $('retifica-info').hidden = false;
    $('bt-cancela-retifica').hidden = false;
    $('form-evolucao').texto.focus();
  }
  function cancelarRetifica() {
    estado.retificaId = null;
    $('retifica-info').hidden = true;
    $('bt-cancela-retifica').hidden = true;
  }
  $('bt-cancela-retifica').addEventListener('click', cancelarRetifica);

  $('form-evolucao').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, ev;
    try {
      ev = C.novaEvolucao(f.texto.value, f.data.value, AUTORIA, estado.retificaId);
    } catch (err) { avisar(err.message, true); return; }
    estado.atual.evolucoes.push(ev);
    f.texto.value = '';
    f.data.value = hojeISO();
    cancelarRetifica();
    await salvar();
    renderEvolucoes();
    atualizarAcoes();
    avisar('Evolução registrada.');
  });

  /* ── impressão do prontuário ──────────────────────────────────── */
  $('bt-imprimir').addEventListener('click', async function () {
    if (document.activeElement) document.activeElement.blur();
    await fila;
    var p = estado.atual, im = $('impressao');
    im.textContent = '';

    var cab = el('div', 'cab');
    var m = el('div');
    m.appendChild(el('div', 'nome', 'Vanessa Fernandes'));
    m.appendChild(el('div', 'esp', 'Fisioterapia Pélvica'));
    cab.appendChild(m);
    cab.appendChild(el('div', 'tit', 'Prontuário fisioterapêutico'));
    im.appendChild(cab);

    im.appendChild(el('h3', null, 'Identificação'));
    var dl = el('dl');
    [['Nome', p.nome], ['Nascimento', dataBR(p.nascimento)], ['Telefone', p.telefone],
     ['Como chegou', p.origem], ['Encaminhada por', p.encaminhadoPor], ['Etapa', p.etapa],
     ['Registro eletrônico', p.consentimentoRegistro ? 'Paciente ciente e de acordo' : 'Não registrado'],
     ['WhatsApp', p.consentimentoWhatsapp ? 'Autorizou mensagens' : 'Sem autorização registrada']
    ].forEach(function (par) {
      dl.appendChild(el('dt', null, par[0]));
      dl.appendChild(el('dd', null, par[1] || '—'));
    });
    im.appendChild(dl);

    [['História clínica', 'historia'], ['Exame físico', 'exameFisico'],
     ['Exames complementares', 'examesComplementares'], ['Diagnóstico fisioterapêutico', 'diagnostico'],
     ['Prognóstico', 'prognostico'], ['Plano terapêutico', 'plano']
    ].forEach(function (par) {
      im.appendChild(el('h3', null, par[0]));
      var t = (p[par[1]] || '').trim();
      im.appendChild(el('div', 'bloco' + (t ? '' : ' vazio-imp'), t || 'Não registrado.'));
    });

    im.appendChild(el('h3', null, 'Evolução'));
    if (!p.evolucoes.length) {
      im.appendChild(el('div', 'bloco vazio-imp', 'Nenhuma evolução registrada.'));
    } else {
      var tb = el('table'), th = el('tr');
      ['Data', 'Registro', 'Profissional'].forEach(function (h) { th.appendChild(el('th', null, h)); });
      tb.appendChild(th);
      p.evolucoes.slice().sort(function (a, b) { return a.data === b.data ? (a.criadoEm < b.criadoEm ? -1 : 1) : (a.data < b.data ? -1 : 1); })
        .forEach(function (e) {
          var tr = el('tr');
          tr.appendChild(el('td', null, dataBR(e.data)));
          var orig = e.retificaId && p.evolucoes.find(function (x) { return x.id === e.retificaId; });
          tr.appendChild(el('td', 'bloco', (orig ? '[Retificação da evolução de ' + dataBR(orig.data) + '] ' : '') + e.texto));
          tr.appendChild(el('td', null, e.autora + ' — ' + e.registro));
          tb.appendChild(tr);
        });
      im.appendChild(tb);
    }

    var ass = el('div', 'ass');
    ass.appendChild(el('div', null, AUTORIA.nome));
    ass.appendChild(el('div', null, 'Fisioterapeuta — ' + AUTORIA.registro));
    im.appendChild(ass);
    var agora = new Date();
    im.appendChild(el('div', 'rod', 'Impresso em ' + dataBR(hojeISO()) + ' às ' + horaBR(agora) +
      ' · Documento sigiloso — Resolução COFFITO nº 414/2012.'));
    window.print();
  });
  window.addEventListener('afterprint', function () { $('impressao').textContent = ''; });

  /* ── backup, restauração, troca de senha ──────────────────────── */
  function baixar(nome, texto) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 8000);
  }

  $('bt-backup').addEventListener('click', async function () {
    await fila;
    var env = await C.cifrar(estado.sessao, estado.banco);
    baixar('prontuario-vanessa-' + hojeISO() + '.vfcofre', JSON.stringify(env));
    await C.Armazem.gravar('meta', { ultimoBackup: new Date().toISOString() });
    alertaBackup();
    avisar('Backup salvo. Ele abre com a sua senha atual — guarde o arquivo em lugar seguro.');
  });

  var restaurandoDoInicio = false;
  $('bt-importar').addEventListener('click', function () { restaurandoDoInicio = false; $('arquivo-backup').click(); });
  $('bt-restaurar-inicio').addEventListener('click', function () { restaurandoDoInicio = true; $('arquivo-backup').click(); });

  $('arquivo-backup').addEventListener('change', async function (e) {
    var arq = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!arq) return;
    var env;
    try {
      env = JSON.parse(await arq.text());
      C.validarEnvelope(env);
    } catch (err) { avisar('Este arquivo não é um backup do prontuário.', true); return; }

    var aberto = await perguntar({
      titulo: 'Restaurar backup', ok: 'Abrir backup',
      texto: 'Digite a senha que estava em uso quando este backup foi feito.',
      campos: [{ nome: 'senha', rotulo: 'Senha do backup', tipo: 'password', auto: 'current-password' }],
      validar: function (v) { return C.abrir(v.senha, env); }
    });
    if (!aberto) return;

    var atual = estado.banco ? estado.banco.pacientes.length : null;
    var confirma = await perguntar({
      titulo: 'Substituir o prontuário?', ok: 'Substituir', perigo: true,
      texto: 'O backup tem ' + aberto.banco.pacientes.length + ' paciente(s). ' +
        (atual !== null ? 'O prontuário aberto agora tem ' + atual + ' e será substituído.' :
          'Se já houver um prontuário neste navegador, ele será substituído.')
    });
    if (!confirma) return;

    if (estado.sessao && !restaurandoDoInicio) {
      /* mantém a senha atual: o conteúdo do backup passa a ser cifrado com ela */
      estado.banco = aberto.banco;
      await salvar();
      renderLista();
      mostrar('tela-lista');
    } else {
      /* restauração pela tela de entrada: vale a senha do backup */
      await C.Armazem.gravar('envelope', await C.cifrar(aberto.sessao, aberto.banco));
      entrar(aberto.sessao, aberto.banco);
    }
    avisar('Backup restaurado.');
  });

  $('bt-senha').addEventListener('click', async function () {
    var r = await perguntar({
      titulo: 'Trocar senha', ok: 'Trocar senha',
      texto: 'Backups antigos continuam abrindo com a senha antiga.',
      campos: [
        { nome: 'atual', rotulo: 'Senha atual', tipo: 'password', auto: 'current-password' },
        { nome: 'nova', rotulo: 'Nova senha', tipo: 'password', auto: 'new-password' },
        { nome: 'nova2', rotulo: 'Repita a nova senha', tipo: 'password', auto: 'new-password' }
      ],
      validar: async function (v) {
        if (v.nova !== v.nova2) throw new Error('As duas senhas novas não são iguais.');
        await C.abrir(v.atual, await C.Armazem.ler('envelope'));
        return C.trocarSenha(estado.banco, v.nova);
      }
    });
    if (!r) return;
    await fila;
    estado.sessao = r.sessao;
    await C.Armazem.gravar('envelope', r.envelope);
    avisar('Senha trocada.');
  });

  /* ── saída da página ──────────────────────────────────────────── */
  function evolucaoDigitada() {
    return !!(estado.atual && $('form-evolucao').texto.value.trim());
  }
  $('link-inicio').addEventListener('click', async function (e) {
    e.preventDefault();
    var destino = this.href;
    if (document.activeElement) document.activeElement.blur();
    if (estado.sessao) {
      gravarFormularioPendente();
      await fila;
      if (evolucaoDigitada()) {
        var ok = await perguntar({
          titulo: 'Evolução não registrada', ok: 'Sair sem registrar', perigo: true,
          texto: 'Há uma evolução digitada que ainda não foi registrada. Se sair agora, esse texto se perde.'
        });
        if (!ok) { $('form-evolucao').texto.focus(); return; }
      }
    }
    window.location.href = destino;
  });
  /* Fechar a aba ou recarregar: grava o formulário na hora e só pede
     confirmação se ainda houver gravação em andamento ou evolução
     digitada sem registrar. */
  window.addEventListener('beforeunload', function (e) {
    if (!estado.sessao) return;
    gravarFormularioPendente();
    if (gravando > 0 || evolucaoDigitada()) { e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && estado.sessao) gravarFormularioPendente();
  });

  /* ── início ───────────────────────────────────────────────────── */
  (async function iniciar() {
    try {
      var env = await C.Armazem.ler('envelope');
      modoCofre(env ? 'abrir' : 'criar');
    } catch (e) {
      mostrar('tela-cofre');
      $('cofre-titulo').textContent = 'Prontuário indisponível';
      $('cofre-texto').textContent = 'Este navegador não permitiu guardar dados (' + e.message +
        '). Abra em uma janela normal, não anônima, do Chrome ou do Edge.';
      $('form-cofre').hidden = true;
    }
  })();
})();
