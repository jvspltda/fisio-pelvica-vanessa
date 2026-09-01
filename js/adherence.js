/* ════════════════════════════════════════════════════════════════
   js/adherence.js — Templates de vínculo, hábito e educação.

   Fonte única de todo texto voltado ao paciente. Nada aqui é
   duplicado em app.js: o render apenas consome estas estruturas.
   Placeholders aceitos: {nome} e {exercicio}.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var Adherence = {};

  /* ──────────────────────────────────────────────────────────────
     SUBSTITUIÇÃO DE PLACEHOLDERS
     ────────────────────────────────────────────────────────────── */
  Adherence.preencher = function (texto, dados) {
    var d = dados || {};
    return String(texto)
      .replace(/\{nome\}/g, d.nome || '[nome]')
      .replace(/\{exercicio\}/g, d.exercicio || '[exercício]');
  };

  /* ──────────────────────────────────────────────────────────────
     M3 · CONTRATO DE ALIANÇA TERAPÊUTICA
     ────────────────────────────────────────────────────────────── */
  Adherence.CONTRATO = {
    titulo: 'Contrato de Aliança Terapêutica',
    abertura:
      'Este acordo não é uma obrigação — é um combinado entre nós duas sobre o que cada uma ' +
      'faz para o tratamento dar certo. O resultado depende do que acontece entre as sessões, ' +
      'e é por isso que ele está escrito.',
    compromissoProfissional: [
      'Explicar cada etapa antes de realizá-la e respeitar o seu tempo.',
      'Ajustar o programa sempre que ele não couber na sua rotina.',
      'Registrar por escrito o que foi encontrado e o que foi proposto.',
      'Responder às suas dúvidas entre as sessões, nos horários combinados.'
    ],
    compromissoPaciente: [
      'Realizar o programa domiciliar combinado, no ritmo acordado.',
      'Avisar quando algo não estiver funcionando — em vez de abandonar em silêncio.',
      'Trazer o registro semanal preenchido, mesmo que incompleto.',
      'Comunicar faltas com antecedência sempre que possível.'
    ],
    /* Campos SMART preenchidos na sessão. */
    camposSmart: [
      { id: 'smart_especifica', label: 'S — Específica: o que exatamente será feito' },
      { id: 'smart_mensuravel', label: 'M — Mensurável: como saberemos que aconteceu' },
      { id: 'smart_atingivel',  label: 'A — Atingível: cabe na rotina atual' },
      { id: 'smart_relevante',  label: 'R — Relevante: por que isso importa para você' },
      { id: 'smart_temporal',   label: 'T — Temporal: até quando' }
    ]
  };

  /* ──────────────────────────────────────────────────────────────
     M3 · ÂNCORAS DE HÁBITO
     Estrutura "Sempre após [gatilho], eu realizarei [ação]".
     ────────────────────────────────────────────────────────────── */
  Adherence.ANCORA_MODELO = 'Sempre após {gatilho}, eu realizarei {acao}.';

  Adherence.GATILHOS_SUGERIDOS = [
    'escovar os dentes pela manhã',
    'sentar para o café da manhã',
    'estacionar o carro no trabalho',
    'desligar o computador no fim do expediente',
    'sentar no sofá após o jantar',
    'deitar na cama antes de dormir',
    'terminar de amamentar',
    'esperar a água do banho esquentar'
  ];

  Adherence.montarAncora = function (gatilho, acao) {
    return Adherence.ANCORA_MODELO
      .replace('{gatilho}', gatilho || '[situação da sua rotina]')
      .replace('{acao}', acao || '[o exercício combinado]');
  };

  /* ──────────────────────────────────────────────────────────────
     M3 · SCRIPTS DE WHATSAPP
     ────────────────────────────────────────────────────────────── */
  Adherence.WHATSAPP = [
    {
      id: 'd2',
      marco: 'D+2',
      titulo: 'Acolhimento',
      objetivo: 'Reduzir a insegurança das primeiras tentativas em casa.',
      texto:
        'Oi, {nome}! Aqui é a Vanessa.\n\n' +
        'Passando só para saber como você está se sentindo depois da nossa primeira sessão. ' +
        'É bem comum estranhar no começo — a maioria das pessoas demora alguns dias até ' +
        'sentir que "achou" a musculatura, e isso faz parte.\n\n' +
        'Conseguiu experimentar {exercicio}? Se ficou alguma dúvida, pode me escrever aqui. ' +
        'Não precisa esperar a próxima sessão.'
    },
    {
      id: 'd7',
      marco: 'D+7',
      titulo: 'Checagem de dúvidas',
      objetivo: 'Corrigir execução errada antes que ela vire hábito.',
      texto:
        'Oi, {nome}! Uma semana já, então vamos conferir uma coisa importante.\n\n' +
        'Enquanto faz {exercicio}, você consegue manter a respiração solta e as nádegas ' +
        'relaxadas? Esse é o detalhe que mais muda o resultado — e o erro mais comum é ' +
        'prender o ar sem perceber.\n\n' +
        'Me conta como está indo: quantos dias conseguiu fazer nesta semana? ' +
        'Pode responder com um número, sem cerimônia. Se foram poucos, a gente ajusta o plano.'
    },
    {
      id: 'd21',
      marco: 'D+21',
      titulo: 'Reforço de adesão',
      objetivo: 'Marcar o ponto em que o hábito se consolida ou se perde.',
      texto:
        'Oi, {nome}! Três semanas — esse costuma ser o momento em que o exercício ' +
        'ou vira rotina, ou some da agenda.\n\n' +
        'Se está conseguindo manter: parabéns de verdade, essa é a parte mais difícil ' +
        'e você passou por ela.\n\n' +
        'Se ficou pelo caminho: acontece, e não é falta de esforço. Normalmente significa ' +
        'que o combinado ficou grande demais ou preso no horário errado. Me avisa que a ' +
        'gente encolhe e reancora — funciona melhor assim do que tentar de novo igual.'
    }
  ];

  /* ──────────────────────────────────────────────────────────────
     M2 · INSTRUÇÕES SELECIONÁVEIS DA PRESCRIÇÃO
     ────────────────────────────────────────────────────────────── */
  Adherence.INSTRUCOES_RESPIRATORIAS = [
    'Expirar suavemente durante a subida do assoalho pélvico.',
    'Nunca prender a respiração durante a contração.',
    'Inspirar pelo nariz deixando a barriga expandir; expirar pela boca com os lábios entreabertos.',
    'Manter a respiração fluindo também durante o repouso entre as contrações.'
  ];

  Adherence.INSTRUCOES_PROPRIOCEPTIVAS = [
    'Manter glúteos e adutores relaxados durante toda a série.',
    'Sentir o movimento de fechar e subir, sem empurrar para baixo.',
    'Soltar completamente entre uma contração e outra — o relaxamento faz parte do exercício.',
    'Manter a mandíbula e os ombros soltos.',
    'Apoiar bem os pés no chão quando estiver sentada.',
    'Não contrair a barriga com força durante a contração.'
  ];

  Adherence.POSTURAS = [
    { id: 'supino',    rotulo: 'Supino',            icone: '▭', descricao: 'Deitada, joelhos dobrados, pés apoiados.' },
    { id: 'bola',      rotulo: 'Sentada na bola',   icone: '◯', descricao: 'Sentada sobre a bola, pés no chão, coluna alongada.' },
    { id: 'ortostase', rotulo: 'Em pé',             icone: '⌷', descricao: 'Em pé, peso distribuído nos dois pés.' },
    { id: 'esforco',   rotulo: 'Durante o esforço', icone: '⤒', descricao: 'Aplicando The Knack antes de tossir, rir ou levantar peso.' }
  ];

  Adherence.THE_KNACK =
    'The Knack — pré-contração ao esforço: contraia o assoalho pélvico ANTES e mantenha ' +
    'DURANTE o esforço (tossir, espirrar, rir, levantar peso, pegar a criança no colo). ' +
    'Solte depois que o esforço passar.';

  /* ──────────────────────────────────────────────────────────────
     M4 · CARTILHAS DE ORIENTAÇÃO DOMICILIAR
     ────────────────────────────────────────────────────────────── */
  Adherence.CARTILHAS = [
    {
      id: 'evacuatoria',
      titulo: 'Ergonomia Evacuatória',
      resumo: 'Postura, respiração e regularidade — sem esforço.',
      blocos: [
        {
          h: 'A postura muda tudo',
          p: 'Use um banquinho para apoiar os pés, elevando os joelhos acima do quadril. Essa posição aproxima o ângulo anorretal de cerca de 35°, alinha o canal de saída e reduz a necessidade de fazer força.',
          l: ['Pés apoiados no banquinho', 'Joelhos acima do quadril',
              'Tronco levemente inclinado à frente, cotovelos apoiados nos joelhos',
              'Coluna alongada e ombros soltos']
        },
        {
          h: 'Técnica do sopro — força sem Valsalva',
          p: 'Não prenda a respiração para empurrar. A manobra de Valsalva aumenta a pressão sobre os órgãos pélvicos e, repetida ao longo dos anos, favorece prolapso e hemorroidas.',
          l: ['Inspire pelo nariz, deixando a barriga expandir',
              'Expire soprando devagar, como se enchesse um balão ou soprasse uma vela sem apagá-la',
              'Deixe o assoalho pélvico relaxar e abrir enquanto sopra',
              'A barriga trabalha; o períneo relaxa']
        },
        {
          h: 'Rotina',
          l: ['Procure um horário fixo, de preferência após uma refeição',
              'Não adie quando a vontade aparecer',
              'Evite passar mais de 5 minutos sentada',
              'Não leve o celular ao banheiro — ele faz o tempo se perder']
        }
      ]
    },
    {
      id: 'vesical',
      titulo: 'Reprogramação Vesical e Diário Miccional',
      resumo: 'Intervalos, registro e o fim da micção por precaução.',
      blocos: [
        {
          h: 'Intervalos entre as idas ao banheiro',
          p: 'O intervalo desejado fica entre 2 horas e 3 horas e 30 minutos. Se hoje você vai com muito mais frequência, o alongamento é gradual: some 15 minutos por semana ao intervalo atual, conforme orientação.'
        },
        {
          h: 'Eliminar a micção profilática',
          p: 'Ir ao banheiro "por precaução", sem vontade, é o hábito que mais reduz a capacidade da bexiga. Cada vez que você urina sem necessidade, ensina a bexiga a avisar mais cedo.',
          l: ['Vá quando sentir vontade, não quando lembrar',
              'Antes de sair de casa, pergunte-se: é vontade ou é precaução?',
              'A exceção combinada em sessão continua valendo']
        },
        {
          h: 'Postura para urinar',
          l: ['Sente-se completamente no vaso — não fique agachada sobre ele',
              'Apoie bem os pés no chão', 'Solte a barriga e os ombros',
              'Não faça força para empurrar: deixe sair sozinha']
        },
        {
          h: 'Diário miccional — 3 dias seguidos',
          p: 'Anote em uma tabela simples: horário de cada micção, o que bebeu e quanto, episódios de urgência, episódios de perda e trocas de proteção.',
          nota: 'O diário costuma revelar padrões que nem você havia percebido. Traga preenchido na próxima consulta, mesmo que incompleto.'
        }
      ]
    },
    {
      id: 'urgencia',
      titulo: 'Acalmia de Urgência',
      resumo: 'O que fazer no momento em que a vontade aperta.',
      blocos: [
        {
          h: 'Por que correr piora',
          p: 'Quando a vontade aparece de repente e você corre, a pressão sobre a bexiga aumenta e a urgência fica mais forte. O caminho é o oposto: parar e deixar a onda passar.'
        },
        {
          h: 'A sequência',
          l: ['PARE o que está fazendo e fique imóvel — sente-se se puder',
              'RESPIRE devagar pelo diafragma: inspire pelo nariz, expire lentamente pela boca',
              'CONTRAIA 5 vezes, rápido e forte, o assoalho pélvico — são contrações fásicas que inibem o detrusor',
              'ESPERE a vontade diminuir',
              'CAMINHE calmamente até o banheiro'],
          nota: 'A urgência vem em ondas e cede sozinha se você não alimentar o susto. Nas primeiras vezes é difícil; com prática vira automático.'
        },
        {
          h: 'Irritantes da bexiga',
          p: 'Algumas substâncias aumentam a urgência em parte das pessoas: cafeína, refrigerantes, bebidas alcoólicas, adoçantes artificiais, frutas cítricas e alimentos muito condimentados. Não é preciso cortar tudo — teste um por vez, conforme orientação, e observe.'
        }
      ]
    },
    {
      id: 'posprostatectomia',
      titulo: 'Após a Cirurgia de Próstata',
      resumo: 'Controle das perdas, com atenção especial à posição em pé.',
      blocos: [
        {
          h: 'O que esperar',
          p: 'A cirurgia mexe no mecanismo que segura a urina. Perder urina no pós-operatório é comum. O que não é comum — e quase ninguém explica — é que isso não precisa ser aceito como definitivo.'
        },
        {
          h: 'A posição em pé é a mais difícil',
          p: 'Deitado quase não há perda; sentado, pouca; em pé, a gravidade soma-se à pressão abdominal. Por isso o treino progride nessa ordem, e a maior parte do ganho aparece justamente quando você domina a posição ortostática.',
          l: ['Comece o treino deitado, onde o controle é mais fácil',
              'Progrida para sentado quando a contração estiver consistente',
              'Só então treine em pé, que é onde o ganho conta no dia a dia']
        },
        {
          h: 'The Knack no cotidiano',
          p: 'Contraia ANTES de levantar da cadeira, antes de tossir, antes de pegar peso. Antecipar o esforço vale mais que reagir a ele.'
        },
        {
          h: 'O erro mais comum',
          p: 'A maioria dos homens contrai a musculatura errada: aperta a barriga, aperta o glúteo, prende a respiração. Se esforça todos os dias e o músculo que precisava trabalhar continua parado. Por isso a execução é conferida em sessão antes de virar rotina.'
        }
      ]
    },
    {
      id: 'dor',
      titulo: 'Manejo de Dor e Dispareunia',
      resumo: 'Quando a musculatura não relaxa e a dor se instala.',
      blocos: [
        {
          h: 'Aqui o exercício é o contrário',
          p: 'Quando a musculatura está em excesso de tensão, contrair mais piora. O trabalho é de soltar — e soltar também se aprende.',
          l: ['Respiração diafragmática lenta, várias vezes ao dia',
              'Alongamentos e posições de abertura conforme orientação',
              'Calor local, se indicado em sessão']
        },
        {
          h: 'Nunca insista na dor',
          p: 'Cada tentativa dolorosa reforça o reflexo de proteção e torna a próxima mais difícil. Interromper não é desistir: é evitar que o corpo aprenda a se defender ainda mais.'
        },
        {
          h: 'Progressão respeitosa',
          p: 'A retomada é gradual e no seu tempo, com etapas combinadas em sessão. Não existe prazo certo, e comparar-se com outra pessoa não ajuda.',
          nota: 'Se a dor aumentar entre as sessões, avise antes da próxima consulta. Ajustar cedo evita retrocesso.'
        }
      ]
    }
  ];

  raiz.Adherence = Adherence;
  if (typeof module !== "undefined") module.exports = Adherence;

})(typeof window !== "undefined" ? window : globalThis);
