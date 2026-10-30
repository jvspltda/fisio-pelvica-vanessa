/* js/inicio.js — Página inicial: saudação, carta de boas-vindas (só na
   primeira visita), novidades com "Novo" e o andamento das aprovações.
   Tudo o que guarda fica neste aparelho e nada é sobre paciente. Sem
   JavaScript, a página continua com o nome e os atalhos de sempre. */
(function () {
  'use strict';
  var N = window.Novidades, AP = window.Aprovar;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function ler(chave, padrao) { try { var v = JSON.parse(localStorage.getItem(chave)); return v == null ? padrao : v; } catch (e) { return padrao; } }
  function gravar(chave, v) { try { localStorage.setItem(chave, JSON.stringify(v)); } catch (e) { /* aba anônima */ } }

  /* saudação */
  var agora = new Date();
  $('i-ola').textContent = N.saudacao(agora.getHours()) + ', Vanessa';
  $('i-hoje').textContent = 'Fisioterapia Pélvica · ' + N.dataLonga(agora);

  /* carta: só até ela fechar */
  var carta = $('i-carta');
  if (!ler('vf-boas-vindas', false)) {
    carta.hidden = false;
    $('i-carta-fechar').addEventListener('click', function () {
      gravar('vf-boas-vindas', true);
      carta.classList.add('saindo');
      setTimeout(function () { carta.hidden = true; }, 260);
    });
  }

  /* novidades: "Novo" no que ela ainda não viu; ficam vistas ao abrir a página */
  var vistas = ler('vf-novidades-vistas', []);
  var novas = N.novas(vistas);
  var lista = $('i-novidades-lista');
  N.LISTA.slice(0, N.MOSTRAR).forEach(function (n) {
    var a = el('a', 'novidade');
    a.href = n.href;
    var cab = el('span', 'novidade-cab');
    if (novas.indexOf(n.id) !== -1) cab.appendChild(el('span', 'novo', 'Novo'));
    cab.appendChild(el('span', 'quando', N.dataCurta(n.data)));
    a.appendChild(cab);
    a.appendChild(el('b', null, n.titulo));
    a.appendChild(el('span', 'texto', n.texto));
    a.appendChild(el('span', 'seta', n.link + ' →'));
    lista.appendChild(a);
  });
  var sec = $('i-novidades');
  sec.hidden = false;
  /* já viu tudo: as novidades descem para o fim e o dia a dia volta para o topo */
  if (!novas.length) sec.parentNode.appendChild(sec);
  if (novas.length) $('i-novidades-conta').textContent = novas.length === 1 ? '1 novidade desde a sua última visita' : novas.length + ' novidades desde a sua última visita';
  gravar('vf-novidades-vistas', vistas.concat(novas));

  /* aprovações: quantas ela já respondeu neste aparelho */
  if (AP) {
    var resp = ler('vf-aprovacoes', {});
    var total = AP.LISTA.length;
    var feitas = AP.LISTA.filter(function (it) { return resp[it.id] && resp[it.id].voto; }).length;
    var t = $('i-aprovar-texto'), selo = $('i-aprovar-selo');
    if (!total) { $('i-aprovar').hidden = true; return; }
    selo.textContent = total - feitas || '✓';
    if (feitas === 0) t.textContent = total + ' mudanças esperando o seu aval, com o texto de cada uma. Dá para fazer aos poucos.';
    else if (feitas < total) t.textContent = 'Você já respondeu ' + feitas + ' de ' + total + '. Faltam ' + (total - feitas) + (total - feitas === 1 ? '.' : ', quando der.');
    else { t.textContent = 'Tudo respondido! Só falta tocar em "Enviar pelo WhatsApp".'; $('i-aprovar').classList.add('feito'); }
  }
})();
