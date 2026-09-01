/* ════════════════════════════════════════════════════════════════
   js/scores.js — Motor de cálculo clínico, puro e sem DOM.

   Regra de ouro deste arquivo: nenhuma função toca o documento nem
   o armazenamento. Recebe números, devolve números e classificações.
   Isso é o que permite testar tudo no Node sem navegador.

   Toda entrada fora da faixa clínica lança RangeError com mensagem
   em pt-BR. A interface deve usar Scores.limitar() antes de exibir.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var Scores = {};

  /* ──────────────────────────────────────────────────────────────
     UTILITÁRIOS DE VALIDAÇÃO
     ────────────────────────────────────────────────────────────── */

  /* Converte para inteiro e recusa qualquer coisa fora da faixa. */
  function inteiroNaFaixa(valor, min, max, nome) {
    var n = Number(valor);
    if (valor === null || valor === undefined || valor === '' || !isFinite(n)) {
      throw new RangeError(nome + ': valor ausente ou não numérico.');
    }
    if (!Number.isInteger(n)) {
      throw new RangeError(nome + ': deve ser um número inteiro (recebido ' + valor + ').');
    }
    if (n < min || n > max) {
      throw new RangeError(nome + ': fora da faixa clínica ' + min + '–' + max + ' (recebido ' + n + ').');
    }
    return n;
  }

  /* Prende um valor dentro da faixa, sem lançar. Uso exclusivo da UI. */
  Scores.limitar = function (valor, min, max) {
    var n = Number(valor);
    if (!isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  };

  /* Soma um conjunto de itens já validados individualmente. */
  function somarItens(respostas, itens, rotuloInstrumento) {
    if (!respostas || typeof respostas !== 'object') {
      throw new RangeError(rotuloInstrumento + ': respostas devem ser um objeto.');
    }
    var total = 0;
    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      total += inteiroNaFaixa(respostas[it.id], it.min, it.max, rotuloInstrumento + ' · ' + it.id);
    }
    return total;
  }

  /* Verifica se todos os itens de um instrumento foram respondidos. */
  function completo(respostas, itens) {
    if (!respostas || typeof respostas !== 'object') return false;
    for (var i = 0; i < itens.length; i++) {
      var v = respostas[itens[i].id];
      if (v === null || v === undefined || v === '' || !isFinite(Number(v))) return false;
    }
    return true;
  }

  Scores.completo = completo;

  /* ──────────────────────────────────────────────────────────────
     WEXNER — Continence Grading Scale
     Estrutura e âncoras verbatim da ficha da Dra. Vanessa.
     ────────────────────────────────────────────────────────────── */

  /* Colunas de frequência — redação da ficha, sem paráfrase. */
  Scores.WEXNER_COLUNAS = [
    { pontos: 0, rotulo: 'Nunca' },
    { pontos: 1, rotulo: 'Raramente', ancora: '<1×/mês' },
    { pontos: 2, rotulo: 'Às vezes', ancora: '<1×/semana e ≥1×/mês' },
    { pontos: 3, rotulo: 'Frequentemente', ancora: '<1×/dia e ≥1×/semana' },
    { pontos: 4, rotulo: 'Sempre', ancora: '≥1×/dia' }
  ];

  /* Linhas — redação da ficha. */
  Scores.WEXNER_ITENS = [
    { id: 'wexner_solido',   label: 'Sólido',                          min: 0, max: 4 },
    { id: 'wexner_liquido',  label: 'Líquido',                         min: 0, max: 4 },
    { id: 'wexner_gases',    label: 'Gases',                           min: 0, max: 4 },
    { id: 'wexner_protecao', label: 'Uso de fraldas/absorventes',      min: 0, max: 4 },
    { id: 'wexner_estilo',   label: 'Alteração no estilo de vida',     min: 0, max: 4 }
  ];

  /* Faixas de cor do badge.
     ATENÇÃO: esta é convenção interna de UI para leitura rápida,
     NÃO é classificação clínica validada da escala. A escala define
     apenas 0 = continência perfeita e 20 = incontinência completa. */
  Scores.classificarWexner = function (total) {
    var t = inteiroNaFaixa(total, 0, 20, 'Wexner (total)');
    if (t === 0)  return { total: t, severidade: 'ok',      rotulo: 'Continência perfeita' };
    if (t <= 8)   return { total: t, severidade: 'atencao', rotulo: 'Incontinência leve' };
    if (t <= 14)  return { total: t, severidade: 'alerta',  rotulo: 'Incontinência moderada' };
    return          { total: t, severidade: 'grave',   rotulo: 'Incontinência acentuada' };
  };

  Scores.calcularWexner = function (respostas) {
    var total = somarItens(respostas, Scores.WEXNER_ITENS, 'Wexner');
    return Scores.classificarWexner(total);
  };

  /* ──────────────────────────────────────────────────────────────
     IPSS — International Prostate Symptom Score
     ⚠ Texto oficial dos itens NÃO fornecido. Placeholders declarados.
     A pontuação e a classificação vêm do contrato clínico.
     ────────────────────────────────────────────────────────────── */
  Scores.IPSS_ITENS = (function () {
    var itens = [];
    for (var i = 1; i <= 7; i++) {
      itens.push({
        id: 'ipss_q' + i,
        label: '[INSERIR TEXTO OFICIAL — IPSS item ' + i + ']',
        min: 0, max: 5
      });
    }
    return itens;
  })();

  /* Item de qualidade de vida do IPSS (0–6), pontuado à parte do total. */
  Scores.IPSS_QV = {
    id: 'ipss_qv',
    label: '[INSERIR TEXTO OFICIAL — IPSS qualidade de vida]',
    min: 0, max: 6
  };

  Scores.classificarIPSS = function (total) {
    var t = inteiroNaFaixa(total, 0, 35, 'IPSS (total)');
    if (t <= 7)  return { total: t, severidade: 'ok',     rotulo: 'Sintomas leves' };
    if (t <= 19) return { total: t, severidade: 'alerta', rotulo: 'Sintomas moderados' };
    return         { total: t, severidade: 'grave',  rotulo: 'Sintomas graves' };
  };

  Scores.calcularIPSS = function (respostas) {
    var total = somarItens(respostas, Scores.IPSS_ITENS, 'IPSS');
    return Scores.classificarIPSS(total);
  };

  /* ──────────────────────────────────────────────────────────────
     IIEF-5 — Índice Internacional de Função Erétil, versão curta
     ⚠ Texto oficial dos itens NÃO fornecido. Placeholders declarados.
     Faixa 1–25: cada item vale de 1 a 5 e todos são obrigatórios.
     ────────────────────────────────────────────────────────────── */
  Scores.IIEF5_ITENS = (function () {
    var itens = [];
    for (var i = 1; i <= 5; i++) {
      itens.push({
        id: 'iief5_q' + i,
        label: '[INSERIR TEXTO OFICIAL — IIEF-5 item ' + i + ']',
        min: 1, max: 5
      });
    }
    return itens;
  })();

  Scores.classificarIIEF5 = function (total) {
    var t = inteiroNaFaixa(total, 1, 25, 'IIEF-5 (total)');
    if (t <= 7)  return { total: t, severidade: 'grave',   rotulo: 'Disfunção grave' };
    if (t <= 11) return { total: t, severidade: 'alerta',  rotulo: 'Disfunção moderada' };
    if (t <= 16) return { total: t, severidade: 'alerta',  rotulo: 'Disfunção leve a moderada' };
    if (t <= 21) return { total: t, severidade: 'atencao', rotulo: 'Disfunção leve' };
    return         { total: t, severidade: 'ok',      rotulo: 'Sem disfunção erétil' };
  };

  Scores.calcularIIEF5 = function (respostas) {
    var total = somarItens(respostas, Scores.IIEF5_ITENS, 'IIEF-5');
    return Scores.classificarIIEF5(total);
  };

  /* ──────────────────────────────────────────────────────────────
     NIH-CPSI — Chronic Prostatitis Symptom Index

     [CONTEXTO INSUFICIENTE: NIH-CPSI — texto oficial dos itens,
      faixa de pontos por item e pontos de corte de gravidade]

     O contrato clínico não forneceu nem a redação nem os limiares de
     classificação deste instrumento. Implementamos a ARQUITETURA de
     domínios e o somatório genérico, que passam a funcionar assim que
     as faixas oficiais forem preenchidas em NIH_CPSI_ITENS. Nenhum
     limiar de gravidade é sugerido aqui — isso seria palpite.
     ────────────────────────────────────────────────────────────── */
  Scores.NIH_CPSI_ITENS = [
    { id: 'cpsi_q1', dominio: 'dor',      label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 1]', min: 0, max: 0 },
    { id: 'cpsi_q2', dominio: 'dor',      label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 2]', min: 0, max: 0 },
    { id: 'cpsi_q3', dominio: 'dor',      label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 3]', min: 0, max: 0 },
    { id: 'cpsi_q4', dominio: 'dor',      label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 4]', min: 0, max: 0 },
    { id: 'cpsi_q5', dominio: 'urinario', label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 5]', min: 0, max: 0 },
    { id: 'cpsi_q6', dominio: 'urinario', label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 6]', min: 0, max: 0 },
    { id: 'cpsi_q7', dominio: 'qv',       label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 7]', min: 0, max: 0 },
    { id: 'cpsi_q8', dominio: 'qv',       label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 8]', min: 0, max: 0 },
    { id: 'cpsi_q9', dominio: 'qv',       label: '[INSERIR TEXTO OFICIAL — NIH-CPSI item 9]', min: 0, max: 0 }
  ];

  /* Marca explicitamente que o instrumento ainda não é utilizável. */
  Scores.NIH_CPSI_PENDENTE = true;

  Scores.calcularNihCpsi = function (respostas) {
    var dominios = { dor: 0, urinario: 0, qv: 0 };
    var itens = Scores.NIH_CPSI_ITENS;
    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      dominios[it.dominio] += inteiroNaFaixa(respostas[it.id], it.min, it.max, 'NIH-CPSI · ' + it.id);
    }
    return {
      dominios: dominios,
      total: dominios.dor + dominios.urinario + dominios.qv,
      severidade: 'neutro',
      rotulo: '[CONTEXTO INSUFICIENTE: pontos de corte de gravidade do NIH-CPSI]',
      pendente: true
    };
  };

  /* ──────────────────────────────────────────────────────────────
     IMC — classificação OMS padrão adulto
     ────────────────────────────────────────────────────────────── */
  Scores.calcularIMC = function (pesoKg, alturaM) {
    var p = Number(pesoKg), a = Number(alturaM);
    if (!isFinite(p) || !isFinite(a)) throw new RangeError('IMC: peso e altura devem ser numéricos.');
    if (p < 20 || p > 400)   throw new RangeError('IMC: peso fora da faixa plausível 20–400 kg (recebido ' + p + ').');
    if (a < 0.9 || a > 2.5)  throw new RangeError('IMC: altura fora da faixa plausível 0,90–2,50 m (recebido ' + a + ').');

    var imc = p / (a * a);

    /* Arredonda para uma casa ANTES de classificar.
       Sem isso, 1.60 × 1.60 = 2.5600000000000005 em ponto flutuante faz
       um IMC de exatamente 18,5 cair em 18,4999… e ser rotulado como
       baixo peso — enquanto a tela exibiria "18,5". A classificação
       precisa concordar com o número que a paciente vê. */
    var valor = Math.round(imc * 10) / 10;

    var c;
    if (valor < 18.5)      c = { severidade: 'atencao', rotulo: 'Baixo peso' };
    else if (valor < 25)   c = { severidade: 'ok',      rotulo: 'Eutrofia' };
    else if (valor < 30)   c = { severidade: 'atencao', rotulo: 'Sobrepeso' };
    else if (valor < 35)   c = { severidade: 'alerta',  rotulo: 'Obesidade grau I' };
    else if (valor < 40)   c = { severidade: 'alerta',  rotulo: 'Obesidade grau II' };
    else                   c = { severidade: 'grave',   rotulo: 'Obesidade grau III' };

    return { valor: valor, severidade: c.severidade, rotulo: c.rotulo };
  };

  /* ──────────────────────────────────────────────────────────────
     EVA — Escala Visual Analógica de dor / desconforto
     ────────────────────────────────────────────────────────────── */
  Scores.classificarEVA = function (valor) {
    var v = inteiroNaFaixa(valor, 0, 10, 'EVA');
    if (v === 0)  return { valor: v, severidade: 'ok',      rotulo: 'Sem dor' };
    if (v <= 2)   return { valor: v, severidade: 'ok',      rotulo: 'Dor leve' };
    if (v <= 7)   return { valor: v, severidade: 'alerta',  rotulo: 'Dor moderada' };
    return          { valor: v, severidade: 'grave',   rotulo: 'Dor intensa' };
  };

  /* ──────────────────────────────────────────────────────────────
     ESCALAS DESCRITIVAS DO EXAME FÍSICO — redação verbatim da ficha
     Não há cálculo aqui: são tabelas de consulta para o render e
     para a montagem do laudo.
     ────────────────────────────────────────────────────────────── */
  Scores.OXFORD_MODIFICADA = [
    { valor: 0, texto: 'Ausência de contração dos músculos perineais' },
    { valor: 1, texto: 'Esboço de contração muscular não sustentada' },
    { valor: 2, texto: 'Presença de contração de pequena intensidade, mas que se sustenta' },
    { valor: 3, texto: 'Contração sentida com um aumento da pressão intravaginal que comprime os dedos do examinador com pequena elevação da parede vaginal posterior' },
    { valor: 4, texto: 'Contração satisfatória que aperta os dedos do examinador com elevação da parede vaginal posterior em direção à sínfise púbica' },
    { valor: 5, texto: 'Contração forte, compressão firme dos dedos do examinador com movimento positivo em relação à sínfise púbica' }
  ];

  Scores.ICS_CONTRACAO_VOLUNTARIA = [
    { valor: 3, texto: 'Forte (forte força de oclusão e elevação palpável)' },
    { valor: 2, texto: 'Normal (oclusão e elevação palpáveis)' },
    { valor: 1, texto: 'Fraca (contração curta sem oclusão palpável)' },
    { valor: 0, texto: 'Ausente (sem contração)' }
  ];

  /* Oxford e ICS não têm classificação de severidade no contrato:
     são descritivos. As funções abaixo apenas recuperam a redação. */
  Scores.textoOxford = function (valor) {
    var v = inteiroNaFaixa(valor, 0, 5, 'Oxford Modificada');
    return Scores.OXFORD_MODIFICADA[v].texto;
  };

  Scores.textoICS = function (valor) {
    var v = inteiroNaFaixa(valor, 0, 3, 'ICS contração voluntária');
    for (var i = 0; i < Scores.ICS_CONTRACAO_VOLUNTARIA.length; i++) {
      if (Scores.ICS_CONTRACAO_VOLUNTARIA[i].valor === v) return Scores.ICS_CONTRACAO_VOLUNTARIA[i].texto;
    }
    throw new RangeError('ICS: valor não mapeado.');
  };

  /* ──────────────────────────────────────────────────────────────
     TMFAP — apoio à prescrição
     Fibras I: sustentação em segundos. Fibras II: repetições rápidas.
     Repouso sugerido na relação 1:2 sobre o tempo de sustentação.
     ────────────────────────────────────────────────────────────── */
  Scores.repousoSugerido = function (segundosSustentacao) {
    var s = inteiroNaFaixa(segundosSustentacao, 0, 60, 'Sustentação (fibras I)');
    return s * 2;
  };

  Scores.PROGRESSAO_POSTURAL = ['supino', 'sentado', 'ortostático', 'dinâmico'];

  /* ──────────────────────────────────────────────────────────────
     EXPORTAÇÃO
     ────────────────────────────────────────────────────────────── */
  raiz.Scores = Scores;
  if (typeof module !== "undefined") module.exports = Scores;

})(typeof window !== "undefined" ? window : globalThis);
