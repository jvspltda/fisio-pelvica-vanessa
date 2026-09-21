/* ════════════════════════════════════════════════════════════════
   js/adherence.js — Templates de vínculo, hábito e educação.

   Fonte única de todo texto voltado ao paciente. Nada aqui é
   duplicado em app.js: o render apenas consome estas estruturas.
   Placeholders aceitos: {nome}, {exercicio}, {data} e {hora}.

   Tom (padrao aprovado pela Vanessa em 2026-09-20): coloquial e
   acolhedor, sem jargao, sem citar estudo, sem numero sem fonte.
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
      .replace(/\{exercicio\}/g, d.exercicio || '[exercício]')
      .replace(/\{data\}/g, d.data || '[dia]')
      .replace(/\{hora\}/g, d.hora || '[horário]');
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
  /* Regras destas mensagens, todas vindas do tipo de dado em jogo:
     - Dado de saude e dado sensivel na LGPD. A notificacao do celular
       mostra o comeco da mensagem na tela bloqueada, para quem estiver
       perto. Por isso os LEMBRETES nao dizem "fisioterapia pelvica",
       nem o motivo da consulta: dizem so dia, hora e com quem.
     - Lembrete so para quem aceitou recebe-los (mensagem 'aceite').
     - Enviados pelo WhatsApp da clinica, em horario comercial. */
  Adherence.WHATSAPP = [
    {
      id: 'aceite',
      marco: 'Cadastro',
      titulo: 'Pedido de autorização',
      objetivo: 'Registrar que a paciente aceita receber mensagens — antes de qualquer lembrete.',
      texto:
        'Oi, {nome}! Aqui é da Clínica Veracis, do atendimento com a Vanessa.\n\n' +
        'Posso te mandar por aqui os lembretes dos seus horários e, de vez em quando, ' +
        'uma mensagem para saber como você está?\n\n' +
        'É só responder SIM. Se preferir não receber, responda NÃO — ' +
        'e está tudo certo do mesmo jeito.'
    },
    {
      id: 'lembrete',
      marco: 'D−1',
      titulo: 'Lembrete da sessão',
      objetivo: 'Reduzir falta e esquecimento. Discreto: não cita o motivo da consulta.',
      texto:
        'Oi, {nome}! Passando para lembrar do seu horário com a Vanessa ' +
        'amanhã, {data}, às {hora}, na Clínica Veracis (Bela Vista Mall).\n\n' +
        'Responda 1 para confirmar ou 2 se precisar remarcar. 😊'
    },
    {
      id: 'hoje',
      marco: 'Dia',
      titulo: 'Lembrete no dia',
      objetivo: 'Para quem não respondeu o lembrete da véspera.',
      texto:
        'Bom dia, {nome}! Seu horário com a Vanessa é hoje, às {hora}. ' +
        'Se aconteceu algum imprevisto, me avisa por aqui que a gente remarca.'
    },
    {
      id: 'falta',
      marco: 'Falta',
      titulo: 'Depois de uma falta',
      objetivo: 'Reabrir a porta sem cobrança — quem se sente cobrado some.',
      texto:
        'Oi, {nome}! Senti sua falta hoje. Espero que esteja tudo bem com você.\n\n' +
        'Imprevisto acontece, sem problema nenhum. Quer que eu veja um novo horário ' +
        'para você nesta semana?'
    },
    {
      id: 'd2',
      marco: 'D+2',
      titulo: 'Acolhimento',
      objetivo: 'Reduzir a insegurança das primeiras tentativas em casa.',
      texto:
        'Oi, {nome}! Aqui é a Vanessa.\n\n' +
        'Passando só para saber como você está depois da nossa primeira sessão. ' +
        'Estranhar no começo faz parte — achar essa musculatura leva um tempinho, ' +
        'e está tudo bem.\n\n' +
        'Conseguiu experimentar {exercicio}? Se ficou alguma dúvida, pode me escrever aqui. ' +
        'Não precisa esperar a próxima sessão.'
    },
    {
      id: 'd7',
      marco: 'D+7',
      titulo: 'Checagem de dúvidas',
      objetivo: 'Corrigir execução errada antes que ela vire hábito.',
      texto:
        'Oi, {nome}! Uma semana já — vamos conferir uma coisa importante.\n\n' +
        'Enquanto faz {exercicio}, você consegue deixar a respiração solta e o bumbum ' +
        'relaxado? Prender o ar sem perceber é o deslize mais comum que eu vejo.\n\n' +
        'Me conta: quantos dias você conseguiu fazer nesta semana? Pode responder só ' +
        'com um número. Se foram poucos, a gente ajusta o plano — sem problema.'
    },
    {
      id: 'd21',
      marco: 'D+21',
      titulo: 'Reforço de adesão',
      objetivo: 'Marcar o ponto em que o hábito se firma ou se perde.',
      texto:
        'Oi, {nome}! Três semanas! Costuma ser agora que o exercício ' +
        'vira rotina ou some da agenda.\n\n' +
        'Se está conseguindo manter: parabéns de verdade, essa é a parte mais difícil.\n\n' +
        'Se ficou pelo caminho: acontece, e não é falta de esforço. Normalmente é sinal ' +
        'de que o combinado ficou grande demais ou no horário errado. Me avisa que a ' +
        'gente diminui e encaixa num momento melhor do seu dia.'
    },
    {
      id: 'reavaliacao',
      marco: 'Reavaliação',
      titulo: 'Convite para reavaliar',
      objetivo: 'Mostrar a evolução com medida — é o que segura a paciente no tratamento.',
      texto:
        'Oi, {nome}! Chegou a hora da nossa reavaliação — é quando a gente compara ' +
        'como você chegou e como está agora, com as mesmas medidas do primeiro dia.\n\n' +
        'Posso te encaixar em {data}, às {hora}? Se não der, me fala um horário bom pra você.'
    },
    {
      id: 'posalta',
      marco: 'Pós-alta',
      titulo: 'Retorno depois da alta',
      objetivo: 'Manter o vínculo: a paciente de alta continua sendo paciente.',
      texto:
        'Oi, {nome}! Aqui é a Vanessa. Faz um tempinho desde a sua alta e eu queria ' +
        'saber como você está.\n\n' +
        'Está conseguindo manter os exercícios? Voltou algum sintoma? Se quiser, a gente ' +
        'marca uma consulta de revisão para conferir se está tudo em ordem.'
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
  /* Os ids das cinco cartilhas antigas nao mudam: atendimentos ja
     salvos guardam a selecao por id. 'gestacao' e 'posparto' sao novas.
     Revisadas em 2026-09-20: sem numero sem fonte, sem jargao tecnico,
     no mesmo tom coloquial dos Reels aprovados. */
  Adherence.CARTILHAS = [
    {
      id: 'gestacao',
      titulo: 'Cuidando do Corpo na Gestação',
      resumo: 'Postura, respiração, exercícios e quando procurar ajuda.',
      blocos: [
        {
          h: 'O seu corpo está trabalhando dobrado',
          p: 'A barriga cresce, o peso vai para a frente e a musculatura lá embaixo, que segura a bexiga e o intestino, passa a sustentar muito mais carga. Dor nas costas, peso na pelve e escape de xixi ao tossir podem aparecer. Nada disso é para você aguentar calada: tudo isso a gente avalia e cuida.'
        },
        {
          h: 'No dia a dia',
          l: ['Para levantar da cama, vire de lado primeiro e use os braços para subir',
              'Ao pegar peso, dobre os joelhos, traga o objeto perto do corpo e solte o ar enquanto levanta',
              'Sentada, apoie bem os pés no chão e as costas no encosto',
              'Evite ficar muito tempo na mesma posição: levante, caminhe um pouco, mude de lado']
        },
        {
          h: 'A respiração que ajuda',
          p: 'Puxe o ar pelo nariz deixando a barriga e as costelas se abrirem. Solte devagar pela boca, como quem sopra uma vela sem apagar. Faça algumas vezes ao dia, com calma. Essa respiração ajuda a soltar a tensão e é a base dos exercícios que combinamos.'
        },
        {
          h: 'Seus exercícios',
          p: 'Faça do jeito que conferimos juntas na sessão, no número e no ritmo combinados. Se ficar em dúvida se está fazendo certo, pare e me mande mensagem — fazer errado todo dia é pior do que não fazer.',
          nota: 'Procure sua obstetra ou o pronto atendimento se tiver sangramento, perda de líquido, contrações fortes e regulares antes da hora, dor forte, ou se o bebê mexer bem menos que o normal. Nesses casos, não faça os exercícios antes de ser avaliada.'
        }
      ]
    },
    {
      id: 'posparto',
      titulo: 'Os Primeiros Meses Depois do Parto',
      resumo: 'Recuperação, cuidados no dia a dia e o que observar.',
      blocos: [
        {
          h: 'Seu corpo acabou de fazer um trabalho enorme',
          p: 'Normal ou cesárea, o parto mexe com a barriga e com a musculatura lá embaixo. Escape de xixi, sensação de peso, dor na relação quando ela voltar: tudo isso pode acontecer e tudo isso tem cuidado. Não é "coisa de mãe" que você tenha que aceitar.'
        },
        {
          h: 'Cuidados que ajudam agora',
          l: ['Para levantar da cama, vire de lado e use os braços — principalmente depois da cesárea',
              'Ao pegar o bebê no colo, traga ele perto do corpo e solte o ar enquanto levanta',
              'Para evacuar, use um banquinho embaixo dos pés e não prenda a respiração para empurrar',
              'Beba água ao longo do dia e não segure a vontade de ir ao banheiro']
        },
        {
          h: 'Quando voltar aos exercícios',
          p: 'O retorno é no seu tempo e com liberação da sua médica. A gente começa pelo básico — respiração e a musculatura lá embaixo — e só depois avança para exercícios mais fortes. Abdominal pesado logo no começo pode piorar o escape e a sensação de peso.'
        },
        {
          h: 'Me avise se',
          l: ['o escape de xixi ou de gases não estiver melhorando',
              'sentir uma bola ou um peso na vagina, principalmente no fim do dia',
              'a relação doer quando vocês retomarem',
              'a cicatriz do parto ou da cesárea doer, ficar vermelha ou soltar secreção — nesse caso, procure também a sua médica']
        }
      ]
    },
    {
      id: 'incontinencia',
      titulo: 'Reeducação na Perda de Urina',
      resumo: 'Treino, hábitos e o que você bebe — tudo junto, no seu ritmo.',
      blocos: [
        {
          h: 'Você não está sozinha nisso',
          p: 'Escapar xixi mexe com a rotina, com a vergonha e com a vontade de sair de casa. Mas isso tem cuidado. A reeducação junta três coisas: treinar a musculatura que segura a bexiga, ajustar alguns hábitos do dia a dia e prestar atenção no que você bebe. Uma coisa ajuda a outra.'
        },
        {
          h: 'O treino da musculatura',
          l: ['Faça do jeito que conferimos juntas na sessão, com a respiração solta',
              'Não aperte a barriga nem o bumbum: o trabalho é lá embaixo, fechando e subindo — e soltando bem depois',
              'Pouco todo dia vale mais do que muito de vez em quando']
        },
        {
          h: 'Aperte antes do esforço',
          p: 'Antes de tossir, espirrar, rir, pegar peso ou levantar da cadeira, contraia a musculatura e segure durante o esforço. Com o tempo isso fica automático.'
        },
        {
          h: 'O que você bebe conta',
          p: 'Café, refrigerante, água com gás e frutas ou sucos cítricos (laranja, limão, tangerina) podem irritar a bexiga e aumentar a vontade e os escapes. Diminua um de cada vez e observe o que muda para você.'
        },
        {
          h: 'Água: no horário certo',
          p: 'Não é para beber menos água no dia — isso não resolve e ainda pode prender o intestino. O que ajuda é espalhar a água ao longo do dia e diminuir nas horas antes de dormir. Muita água à noite enche a bexiga justo na hora de descansar.',
          nota: 'Intestino preso e força para evacuar também sobrecarregam essa musculatura. Se for o seu caso, me conte: a gente cuida disso junto.'
        }
      ]
    },
    {
      id: 'evacuatoria',
      titulo: 'Como Ir ao Banheiro sem Fazer Força',
      resumo: 'Postura, respiração e rotina para o intestino.',
      blocos: [
        {
          h: 'A posição muda tudo',
          p: 'Sentar no vaso com os pés no chão deixa o caminho de saída "dobrado". Com os pés num banquinho, os joelhos ficam mais altos que o quadril e o caminho se abre — sai com muito menos força.',
          l: ['Pés apoiados num banquinho',
              'Joelhos mais altos que o quadril',
              'Corpo um pouco inclinado para a frente, cotovelos nos joelhos',
              'Ombros soltos']
        },
        {
          h: 'Não prenda o ar para empurrar',
          p: 'Prender a respiração e fazer força empurra tudo para baixo, inclusive o que não devia. Faça assim:',
          l: ['Puxe o ar pelo nariz, deixando a barriga encher',
              'Solte devagar, soprando como quem enche um balão',
              'Enquanto sopra, deixe a musculatura lá embaixo relaxar e abrir',
              'A barriga trabalha; lá embaixo, solta']
        },
        {
          h: 'Rotina',
          l: ['Tente ir sempre no mesmo horário, de preferência depois de uma refeição',
              'Quando a vontade vier, não deixe para depois',
              'Não fique muito tempo sentada no vaso',
              'Deixe o celular fora do banheiro — ele faz o tempo passar sem você perceber']
        }
      ]
    },
    {
      id: 'vesical',
      titulo: 'Reeducando a Bexiga',
      resumo: 'Intervalos, o "xixi por precaução" e o diário da bexiga.',
      blocos: [
        {
          h: 'O intervalo entre as idas ao banheiro',
          p: 'A gente vai aumentar aos poucos o tempo entre uma ida e outra, no ritmo combinado na sessão. Meu intervalo de hoje: ______ . Meu intervalo desta semana: ______ .'
        },
        {
          h: 'Chega de xixi "por precaução"',
          p: 'Ir ao banheiro sem vontade, só por garantia, ensina a bexiga a avisar cada vez mais cedo. Com o tempo ela passa a pedir para esvaziar com pouquinho dentro.',
          l: ['Vá quando sentir vontade, não quando lembrar',
              'Antes de sair de casa, pergunte: é vontade ou é medo de sentir vontade? (as exceções que combinamos continuam valendo)']
        },
        {
          h: 'Na hora de fazer xixi',
          p: 'Sente de verdade no vaso — não fique agachada no ar —, com os pés apoiados no chão, a barriga e os ombros soltos. Não empurre: deixe sair sozinho.'
        },
        {
          h: 'E à noite?',
          p: 'Se você acorda para fazer xixi, o segredo está no horário da água, não em passar sede. Beba ao longo do dia e diminua nas horas antes de dormir: muita água à noite enche a bexiga justo na hora de descansar. Evite também café, chá e refrigerante no fim do dia.'
        },
        {
          h: 'O diário da bexiga — 3 dias seguidos',
          p: 'Anote numa folha: a hora de cada xixi, o que bebeu e quanto, quando deu aquela vontade forte e quando escapou.',
          nota: 'O diário mostra coisas que nem você tinha percebido. Traga na próxima sessão, mesmo que esteja incompleto.'
        }
      ]
    },
    {
      id: 'urgencia',
      titulo: 'Quando a Vontade Aperta de Repente',
      resumo: 'O que fazer na hora em que dá aquela vontade forte.',
      blocos: [
        {
          h: 'Por que correr piora',
          p: 'Quando a vontade chega de repente e você sai correndo, a bexiga é sacudida e a vontade fica ainda mais forte. O caminho é o contrário: parar e deixar a onda passar.'
        },
        {
          h: 'Faça nesta ordem',
          l: ['PARE onde está — se puder, sente',
              'RESPIRE devagar: puxe o ar pelo nariz e solte bem devagar pela boca',
              'APERTE e solte a musculatura lá embaixo algumas vezes, rápido, do jeito que treinamos',
              'ESPERE a vontade diminuir',
              'CAMINHE com calma até o banheiro'],
          nota: 'A vontade vem em ondas e passa se você não entrar em pânico. Nas primeiras vezes é difícil; com a prática fica automático.'
        },
        {
          h: 'O que você bebe e come conta',
          p: 'Algumas bebidas e alimentos deixam a bexiga mais agitada e podem aumentar a vontade e os escapes, principalmente em quem já tem a bexiga sensível:',
          l: ['Café, chá preto, chá mate e chocolate (por causa da cafeína)',
              'Refrigerante e água com gás',
              'Frutas e sucos cítricos, como laranja, limão e tangerina',
              'Bebida alcoólica'],
          nota: 'Não precisa cortar tudo de uma vez. Diminua um de cada vez e observe o que muda para você — cada bexiga reage de um jeito.'
        }
      ]
    },
    {
      id: 'posprostatectomia',
      titulo: 'Depois da Cirurgia de Próstata',
      resumo: 'Recuperar o controle do xixi, com calma e na ordem certa.',
      blocos: [
        {
          h: 'O que esperar',
          p: 'A cirurgia mexe na estrutura que ajuda a segurar o xixi, e perder urina depois dela acontece bastante. A recuperação costuma levar meses, não dias. Cada pessoa tem o seu ritmo — por isso a gente acompanha e mede a sua evolução.'
        },
        {
          h: 'Deitado, sentado, em pé',
          p: 'Deitado quase não escapa; sentado, pouco; em pé é onde mais escapa. Por isso o treino segue essa ordem:',
          l: ['Comece deitado, onde é mais fácil sentir o músculo',
              'Quando estiver firme, passe para sentado',
              'Depois treine em pé, que é a posição do dia a dia']
        },
        {
          h: 'Aperte antes do esforço',
          p: 'Contraia a musculatura ANTES de levantar da cadeira, tossir, espirrar ou pegar peso — e segure durante. Antecipar ajuda mais do que tentar segurar depois que já começou.'
        },
        {
          h: 'Cuidado com o músculo errado',
          p: 'Muita gente aperta a barriga, o bumbum ou prende a respiração achando que está treinando — e o músculo que precisava trabalhar fica parado. Por isso a gente confere junto na sessão antes de virar rotina em casa.'
        }
      ]
    },
    {
      id: 'dor',
      titulo: 'Dor na Relação e Dor Pélvica',
      resumo: 'Quando a musculatura não relaxa e a dor aparece.',
      blocos: [
        {
          h: 'Aqui o exercício é soltar',
          p: 'Quando a musculatura está tensa demais, apertar mais piora. O nosso trabalho é ensinar essa musculatura a soltar — e soltar também se aprende.',
          l: ['Respiração lenta, com a barriga solta, algumas vezes ao dia',
              'Alongamentos e posições de abertura, como combinamos',
              'Calor no local, se foi orientado na sessão']
        },
        {
          h: 'Nunca insista na dor',
          p: 'Cada vez que você tenta com dor, o corpo aprende a se proteger ainda mais e trava mais na próxima. Parar não é desistir: é não ensinar o corpo a ter medo.'
        },
        {
          h: 'No seu tempo',
          p: 'Voltar é aos pouquinhos, com etapas que a gente combina junto. Não existe prazo certo, e comparar com outra pessoa não ajuda.',
          nota: 'Se a dor aumentar entre as sessões, me avise antes da próxima consulta. Ajustar cedo evita voltar atrás.'
        }
      ]
    }
  ];

  raiz.Adherence = Adherence;
  if (typeof module !== "undefined") module.exports = Adherence;

})(typeof window !== "undefined" ? window : globalThis);
