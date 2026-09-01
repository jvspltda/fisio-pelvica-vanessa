/* ════════════════════════════════════════════════════════════════
   js/ficha.js — Estrutura de dados da ficha de avaliação.

   Este arquivo é a transcrição fiel da "Ficha de Avaliação das
   Disfunções dos Músculos do Assoalho Pélvico Feminino" em uso pela
   Dra. Vanessa. A ordem das seções, o agrupamento dos campos e a
   redação das escalas reproduzem o documento original — o render
   apenas consome o que está declarado aqui.

   Nenhuma lógica de interface neste arquivo: só dados.

   Tipos de campo suportados pelo render (js/app.js):
     texto · area · numero · data · select · radio · checks · eva
     wexner · escala (Oxford/ICS) · titulo · nota
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var Ficha = {};

  /* Atalhos de construção — mantêm a transcrição enxuta e legível. */
  function txt(id, label, extra)  { return Object.assign({ tipo: 'texto',  id: id, label: label }, extra || {}); }
  function area(id, label, extra) { return Object.assign({ tipo: 'area',   id: id, label: label }, extra || {}); }
  function num(id, label, min, max, extra) {
    return Object.assign({ tipo: 'numero', id: id, label: label, min: min, max: max, step: 1 }, extra || {});
  }
  function data(id, label)        { return { tipo: 'data', id: id, label: label }; }
  function radio(id, label, ops)  { return { tipo: 'radio', id: id, label: label, opcoes: ops }; }
  function checks(id, label, ops) { return { tipo: 'checks', id: id, label: label, opcoes: ops }; }
  function sel(id, label, ops)    { return { tipo: 'select', id: id, label: label, opcoes: ops }; }
  function eva(id, label)         { return { tipo: 'eva', id: id, label: label, min: 0, max: 10, step: 1 }; }
  function nota(texto)            { return { tipo: 'nota', texto: texto }; }
  function sub(texto)             { return { tipo: 'titulo', texto: texto }; }

  var SIM_NAO = ['Sim', 'Não'];

  /* ══════════════════════════════════════════════════════════════
     IDENTIFICAÇÃO — comum aos dois perfis
     ══════════════════════════════════════════════════════════════ */
  Ficha.IDENTIFICACAO = {
    id: 'identificacao',
    titulo: 'Identificação',
    campos: [
      data('ident_data',            'Data do atendimento'),
      txt('ident_nome',             'Nome', { larguraTotal: true }),
      num('ident_idade',            'Idade', 0, 120),
      data('ident_nascimento',      'Data de nascimento'),
      txt('ident_estado_civil',     'Estado civil'),
      txt('ident_profissao',        'Profissão'),
      txt('ident_endereco',         'Endereço', { larguraTotal: true }),
      txt('ident_escolaridade',     'Escolaridade'),
      txt('ident_telefones',        'Telefones'),
      txt('ident_clinica',          'Clínica solicitante'),
      area('ident_diagnostico_med', 'Diagnóstico médico', { larguraTotal: true })
    ]
  };

  /* ══════════════════════════════════════════════════════════════
     PERFIL FEMININO — S1 a S11 + Exame Físico
     ══════════════════════════════════════════════════════════════ */
  Ficha.FEMININO = [

    /* ---- S1 ---- */
    {
      id: 's1', numero: 'S1', titulo: 'Antecedentes Ginecológicos',
      campos: [
        radio('s1_estado_reprodutivo', 'Estado reprodutivo', ['Menacme', 'Climatério', 'Pós-menopausa']),
        txt('s1_menarca',  'Menarca'),
        data('s1_dum',     'DUM — data da última menstruação'),
        radio('s1_th',     'Terapia hormonal (TH)', SIM_NAO),
        txt('s1_th_tempo', 'TH — há quanto tempo'),
        sub('Ciclos menstruais'),
        txt('s1_ciclo_intervalo', 'Intervalo'),
        txt('s1_ciclo_duracao',   'Duração'),
        txt('s1_ciclo_quantidade','Quantidade'),
        sub('Dismenorreia'),
        radio('s1_dismenorreia', 'Dismenorreia', SIM_NAO),
        txt('s1_dismenorreia_med', 'Medicação utilizada'),
        sub('Contraceptivos'),
        radio('s1_contraceptivo', 'Uso de contraceptivos', SIM_NAO),
        txt('s1_contraceptivo_qual', 'Qual')
      ]
    },

    /* ---- S2 ---- */
    {
      id: 's2', numero: 'S2', titulo: 'Antecedentes Obstétricos',
      campos: [
        num('s2_g', 'G — gestações', 0, 30),
        num('s2_p', 'P — partos',    0, 30),
        num('s2_a', 'A — abortos',   0, 30),
        num('s2_c', 'C — cesáreas',  0, 30),
        radio('s2_forceps', 'Uso de fórceps', SIM_NAO),
        data('s2_dup',      'DUP — data do último parto'),
        txt('s2_peso_rn',   'Peso do maior recém-nascido'),
        area('s2_complicacoes', 'Complicações no puerpério', { larguraTotal: true })
      ]
    },

    /* ---- S3 ---- */
    {
      id: 's3', numero: 'S3', titulo: 'História da Moléstia Atual',
      campos: [
        area('s3_queixa',   'Queixa principal', { larguraTotal: true }),
        txt('s3_inicio',    'Início'),
        txt('s3_duracao',   'Duração'),
        txt('s3_evolucao',  'Evolução'),
        area('s3_limitacoes', 'Limitações funcionais e de participação social', { larguraTotal: true }),
        eva('s3_eva_queixa', 'EVA — incômodo causado pela queixa')
      ]
    },

    /* ---- S4 ---- */
    {
      id: 's4', numero: 'S4', titulo: 'Hábitos de Vida e Antecedentes',
      campos: [
        area('s4_familiares', 'Antecedentes familiares', { larguraTotal: true }),
        area('s4_pessoais',   'Antecedentes pessoais', { larguraTotal: true }),
        area('s4_medicamentos','Medicamentos em uso', { larguraTotal: true }),
        sub('Hábitos'),
        radio('s4_tabagismo', 'Tabagismo', SIM_NAO),
        txt('s4_tabagismo_tempo', 'Tabagismo — há quanto tempo'),
        radio('s4_etilismo', 'Etilismo', SIM_NAO),
        txt('s4_etilismo_tempo', 'Etilismo — há quanto tempo'),
        radio('s4_obesidade', 'Obesidade', SIM_NAO),
        radio('s4_atividade_fisica', 'Atividade física', SIM_NAO),
        txt('s4_af_qual', 'Atividade física — qual'),
        txt('s4_af_frequencia', 'Atividade física — frequência'),
        sub('Antecedentes clínicos e cirúrgicos'),
        radio('s4_snc', 'Doenças do sistema nervoso central', SIM_NAO),
        txt('s4_snc_qual', 'SNC — qual'),
        radio('s4_radioterapia', 'Radioterapia pélvica', SIM_NAO),
        txt('s4_radio_quando', 'Radioterapia — quando'),
        num('s4_radio_sessoes', 'Radioterapia — nº de sessões', 0, 200),
        area('s4_cirurgias_pelvicas', 'Cirurgias pélvicas prévias', { larguraTotal: true }),
        radio('s4_htv_hta', 'HTV / HTA', ['HTV', 'HTA', 'Não']),
        data('s4_htv_hta_data', 'HTV / HTA — data'),
        radio('s4_cirurgia_iu', 'Cirurgia para incontinência urinária', SIM_NAO),
        data('s4_cirurgia_iu_data', 'Cirurgia para IU — data')
      ]
    },

    /* ---- S5 ---- */
    {
      id: 's5', numero: 'S5', titulo: 'Sintomas do Trato Urinário Inferior (TUI)',
      campos: [
        radio('s5_iu', 'Incontinência urinária', SIM_NAO),
        radio('s5_iu_frequencia', 'Perdas', ['Frequentes', 'Ocasionais']),
        radio('s5_urgencia', 'Urgência', SIM_NAO),
        radio('s5_retardo', 'Tempo de retardo miccional', ['Não', "1'", "3'", "5'", 'Mais']),
        radio('s5_freq_aumentada', 'Frequência diária aumentada', SIM_NAO),
        num('s5_freq_num', 'Frequência diária — nº de micções', 0, 60),
        radio('s5_nocturia', 'Noctúria', SIM_NAO),
        num('s5_nocturia_num', 'Noctúria — nº de episódios', 0, 30),
        radio('s5_enurese', 'Enurese noturna', SIM_NAO),
        txt('s5_enurese_ultimo', 'Enurese — último episódio'),
        radio('s5_dificuldade_iniciar', 'Dificuldade para iniciar a micção', SIM_NAO),
        radio('s5_esvaziamento_incompleto', 'Sensação de esvaziamento incompleto', SIM_NAO),
        radio('s5_esforco_miccional', 'Esforço miccional', SIM_NAO),
        radio('s5_novas_posturas', 'Novas posturas para urinar', SIM_NAO),
        checks('s5_desencadeantes', 'Situações desencadeantes da perda',
          ['Tossir', 'Espirrar', 'Rir', 'Lavar as mãos', 'Andar', 'Correr', 'Levantar-se', 'Pegar peso', 'Outros']),
        txt('s5_desencadeantes_outros', 'Outros desencadeantes — especificar'),
        radio('s5_quantidade', 'Quantidade perdida', ['Pequena', 'Moderada', 'Grande']),
        radio('s5_forma', 'Forma da perda', ['Jatos', 'Gotas']),
        radio('s5_pos_parto', 'Início ou agravamento após o parto', SIM_NAO),
        txt('s5_pos_parto_tempo', 'Pós-parto — há quanto tempo'),
        radio('s5_miccao_profilatica', 'Micção profilática', SIM_NAO),
        radio('s5_iu_insensivel', 'Incontinência urinária insensível', SIM_NAO),
        sub('Proteção'),
        radio('s5_protecao', 'Uso de proteção', SIM_NAO),
        radio('s5_protecao_tipo', 'Tipo de proteção', ['Papel', 'Absorvente', 'Fralda']),
        num('s5_protecao_trocas', 'Nº de trocas por dia', 0, 40),
        radio('s5_protecao_estado', 'Estado da proteção', ['Secos', 'Úmidos', 'Molhados']),
        sub('Acesso e antecedentes'),
        radio('s5_mobilidade', 'Mobilidade ou acesso ao banheiro limitados', SIM_NAO),
        txt('s5_mobilidade_motivo', 'Limitação — motivo'),
        radio('s5_itu', 'Infecção do trato urinário (ITU)', SIM_NAO),
        txt('s5_itu_ultimo', 'ITU — último episódio'),
        area('s5_outros', 'Outros sintomas do TUI', { larguraTotal: true })
      ]
    },

    /* ---- S6 ---- */
    {
      id: 's6', numero: 'S6', titulo: 'Sintomas Intestinais',
      campos: [
        radio('s6_manobras', 'Manobras para completar a evacuação', SIM_NAO),
        txt('s6_manobras_quais', 'Manobras — quais'),
        radio('s6_novas_posturas', 'Novas posturas para evacuar', SIM_NAO),
        radio('s6_enemas', 'Enemas, lavagens ou supositórios', SIM_NAO),
        txt('s6_enemas_quantidade', 'Enemas — quantidade'),
        radio('s6_esvaziamento_incompleto', 'Sensação de esvaziamento incompleto', SIM_NAO),
        radio('s6_perda_insensivel', 'Perda insensível de fezes', SIM_NAO),
        radio('s6_urgencia', 'Urgência', SIM_NAO),
        txt('s6_urgencia_aviso', 'Urgência — tempo de aviso'),
        radio('s6_incont_urgencia', 'Incontinência por urgência', SIM_NAO),
        checks('s6_esforcos', 'Perda de fezes ou flatos aos esforços',
          ['Tosse', 'Espirro', 'Rir', 'Andar', 'Correr', 'Levantar-se', 'Pegar peso', 'Mudança de posição', 'Outros']),
        txt('s6_esforcos_outros', 'Outros esforços — especificar'),
        radio('s6_quantidade', 'Quantidade perdida', ['Pequena', 'Moderada', 'Grande']),
        sub('Proteção'),
        txt('s6_protecao_tipo', 'Tipo de proteção'),
        num('s6_protecao_trocas', 'Nº de trocas por dia', 0, 40),
        radio('s6_protecao_estado', 'Estado da proteção', ['Limpos', 'Sujos']),
        sub('Características'),
        radio('s6_consistencia', 'Consistência das fezes', ['Líquidas', 'Pastosas', 'Sólidas']),
        radio('s6_percepcao_desejo', 'Percebe o desejo de evacuar', SIM_NAO),
        radio('s6_distingue', 'Distingue fezes de gases', SIM_NAO),
        txt('s6_cronologia', 'Cronologia em relação às refeições'),
        checks('s6_associados', 'Sintomas associados',
          ['Dor', 'Esforço', 'Diarreia', 'Fecaloma', 'Sangramento', 'Flatulência', 'Urgência', 'Soiling', 'Constipação'])
      ]
    },

    /* ---- WEXNER ---- */
    {
      id: 'wexner', numero: 'W', titulo: 'Wexner — Continence Grading Scale',
      tipoEspecial: 'wexner',
      campos: []
    },

    /* ---- S7 ---- */
    {
      id: 's7', numero: 'S7', titulo: 'Sintomas Vaginais',
      campos: [
        radio('s7_percepcao_prolapso', 'Percepção de prolapso', SIM_NAO),
        area('s7_outros', 'Outros sintomas e observações', { larguraTotal: true })
      ]
    },

    /* ---- S8 ---- */
    {
      id: 's8', numero: 'S8', titulo: 'Função Sexual',
      campos: [
        radio('s8_atividade', 'Atividade sexual', ['Sim', 'Não', 'Não se aplica']),
        txt('s8_frequencia', 'Frequência do coito'),
        txt('s8_libido',     'Libido'),
        txt('s8_orgasmo',    'Orgasmo'),
        radio('s8_dispareunia', 'Dispareunia', SIM_NAO),
        txt('s8_dispareunia_momento', 'Dispareunia — em que momento'),
        area('s8_parceiro', 'Problemas relacionados ao parceiro', { larguraTotal: true }),
        area('s8_observacoes', 'Observações', { larguraTotal: true })
      ]
    },

    /* ---- S9 ---- */
    {
      id: 's9', numero: 'S9', titulo: 'Dor',
      campos: [
        radio('s9_dor_pelvica', 'Dor pélvica crônica', SIM_NAO),
        area('s9_sintomas', 'Sintomas', { larguraTotal: true }),
        area('s9_agravamento', 'Horário de agravamento, limitações e fatores que agravam ou diminuem', { larguraTotal: true }),
        area('s9_exames', 'Exames complementares e testes especiais', { larguraTotal: true })
      ]
    },

    /* ---- S10 ---- */
    {
      id: 's10', numero: 'S10', titulo: 'Exames — Urologia / Uroginecologia',
      campos: [
        area('s10_urodinamico', 'Diagnóstico urodinâmico', { larguraTotal: true }),
        area('s10_urodinamico_consid', 'Considerações', { larguraTotal: true }),
        data('s10_urodinamico_data', 'Data'),
        txt('s10_cistoscopia', 'Cistoscopia'),
        data('s10_cistoscopia_data', 'Cistoscopia — data'),
        area('s10_outros', 'Outros exames', { larguraTotal: true })
      ]
    },

    /* ---- S11 ---- */
    {
      id: 's11', numero: 'S11', titulo: 'Exames — Proctologia',
      campos: [
        area('s11_manometria', 'Manometria anorretal', { larguraTotal: true }),
        area('s11_manometria_consid', 'Considerações', { larguraTotal: true }),
        data('s11_manometria_data', 'Data'),
        area('s11_outros', 'Outros exames', { larguraTotal: true })
      ]
    }
  ];

  /* ══════════════════════════════════════════════════════════════
     EXAME FÍSICO — feminino
     O bloco interno só é liberado pelo gate de consentimento.
     ══════════════════════════════════════════════════════════════ */
  Ficha.EXAME_FISICO = {

    /* Gate: as duas perguntas obrigatórias antes do exame interno. */
    consentimento: {
      id: 'consentimento',
      titulo: 'Consentimento para o exame interno',
      campos: [
        radio('ef_esclarecida',
          'Paciente esclarecida sobre os procedimentos intravaginais e intra-anais', SIM_NAO),
        radio('ef_autorizou',
          'Paciente autorizou a realização do exame', SIM_NAO),
        nota('Enquanto a autorização não for "Sim", os campos do exame interno permanecem desabilitados. ' +
             'A recusa é registrada no laudo como "exame interno não autorizado pela paciente".')
      ]
    },

    geral: {
      id: 'ef_geral', titulo: 'Exame físico geral',
      campos: [
        txt('ef_pa', 'PA (mmHg)'),
        num('ef_fc', 'FC (bpm)', 20, 220),
        num('ef_fr', 'FR (irpm)', 4, 80),
        { tipo: 'numero', id: 'ef_estatura', label: 'Estatura (m)', min: 0.9, max: 2.5, step: 0.01 },
        { tipo: 'numero', id: 'ef_peso',     label: 'Peso (kg)',    min: 20,  max: 400, step: 0.1 },
        { tipo: 'calculado', id: 'ef_imc',   label: 'IMC (automático)' }
      ]
    },

    inspecao: {
      id: 'ef_inspecao', titulo: 'Inspeção',
      campos: [
        txt('ef_respiracao', 'Aparelho respiratório — tipo de respiração', { larguraTotal: true }),
        sub('Abdome'),
        checks('ef_abdome', 'Achados abdominais',
          ['Estrias', 'Cicatrizes', 'Pigmentação', 'Hérnia']),
        area('ef_abdome_palpacao', 'Palpação abdominal', { larguraTotal: true }),
        sub('Períneo'),
        checks('ef_perineo', 'Achados perineais',
          ['Roturas', 'Tumorações', 'Cicatrizes']),
        area('ef_perineo_obs', 'Observações do períneo', { larguraTotal: true }),
        sub('Ânus'),
        checks('ef_anus', 'Achados anais',
          ['Alteração de esfíncter', 'Fístulas', 'Alteração de mucosa retal', 'Tumorações', 'Hemorroidas']),
        area('ef_anus_obs', 'Observações do ânus', { larguraTotal: true })
      ]
    },

    /* POP — estrutura exatamente como na ficha original. */
    prolapsos: {
      id: 'ef_pop', titulo: 'Prolapso de órgãos pélvicos — Baden & Walker',
      campos: [
        radio('ef_pop_anterior',      'Parede vaginal anterior', SIM_NAO),
        radio('ef_pop_anterior_grau', 'Parede anterior — grau', ['I', 'II', 'III', 'IV']),
        radio('ef_pop_posterior',      'Parede vaginal posterior', SIM_NAO),
        radio('ef_pop_posterior_grau', 'Parede posterior — grau', ['Leve', 'Moderada', 'Grave']),
        radio('ef_pop_cupula',      'Cúpula vaginal ou útero', SIM_NAO),
        radio('ef_pop_cupula_grau', 'Cúpula / útero — grau', ['I', 'II', 'III'])
      ]
    },

    sensibilidade: {
      id: 'ef_sensibilidade', titulo: 'Exame da sensibilidade',
      campos: [ area('ef_sensibilidade_desc', 'Descrição', { larguraTotal: true }) ]
    },

    reflexos: {
      id: 'ef_reflexos', titulo: 'Reflexos perineais',
      campos: [
        radio('ef_reflexo_clitoriano', 'Reflexo clitoriano', ['Presente', 'Ausente']),
        radio('ef_reflexo_anocutaneo', 'Reflexo anocutâneo', ['Presente', 'Ausente'])
      ]
    },

    /* Avaliação funcional dos MAP — redação verbatim da ficha. */
    afa: {
      id: 'ef_afa', titulo: 'Avaliação funcional dos músculos do assoalho pélvico',
      interno: true,
      campos: [
        radio('afa_movimento_interno', 'Movimento interno do períneo', [
          'Sim — algum movimento no sentido interno é percebido no períneo',
          'Não — nenhum movimento no sentido interno é percebido',
          'Paradoxal — movimento de "descida" do períneo é percebido'
        ]),
        radio('afa_reflexo_tosse', 'Reflexo contrátil à tosse', [
          'Sim — contração reflexa do assoalho pélvico junto à tosse',
          'Não — contração reflexa ausente, nenhum movimento',
          'Paradoxal — movimentação de "descida" do períneo à tosse'
        ]),
        radio('afa_via', 'Via de estimativa', ['Unidigital', 'Bidigital', 'Vaginal', 'Anal']),
        { tipo: 'escala', id: 'afa_oxford', label: 'Oxford Modificada', fonte: 'OXFORD_MODIFICADA' },
        { tipo: 'escala', id: 'afa_ics',    label: 'ICS — contração voluntária', fonte: 'ICS_CONTRACAO_VOLUNTARIA' },
        radio('afa_coativacao', 'Coativação', SIM_NAO),
        checks('afa_coativacao_quais', 'Coativação — musculatura', ['Glúteos', 'Adutores', 'Abdominais']),
        radio('afa_relaxamento', 'Relaxamento', [
          'Sim — relaxamento visível diretamente após instrução',
          'Não — ausência, hesitação ou relaxamento parcial após instrução'
        ]),
        num('afa_endurance', 'Endurance — tempo de sustentação (segundos)', 0, 60),
        num('afa_rapidas', 'Contrações rápidas — nº realizado', 0, 10,
            { ajuda: 'Com descanso prévio de 2 minutos. Máximo de 10 repetições.' }),
        radio('afa_palpacao_dolorosa', 'Palpação dolorosa', SIM_NAO),
        area('afa_palpacao_local', 'Palpação dolorosa — local e achado', { larguraTotal: true }),
        radio('afa_simetria_dir_esq', 'Simetria direita-esquerda', SIM_NAO),
        txt('afa_simetria_desc', 'Simetria — descrição'),
        radio('afa_simetria_ap', 'Simetria anteroposterior', SIM_NAO),
        radio('afa_teste_esforco', 'Teste de esforço (+)', ['Deitada', 'Em pé', 'Negativo']),
        area('afa_outros_testes', 'Outros testes específicos — perineometria, pad test, EMG', { larguraTotal: true }),
        eva('afa_eva_desconforto', 'EVA — desconforto da paciente ao exame')
      ]
    },

    diagnostico: {
      id: 'ef_diagnostico', titulo: 'Diagnóstico Fisioterapêutico',
      campos: [
        area('ef_diagnostico_ap', 'Diagnóstico fisioterapêutico da condição do assoalho pélvico',
             { larguraTotal: true, linhas: 5 })
      ]
    }
  };

  /* ══════════════════════════════════════════════════════════════
     PERFIL MASCULINO
     Identificação e exame físico comuns; instrumentos validados
     entram como placeholders declarados (ver js/scores.js).
     ══════════════════════════════════════════════════════════════ */
  Ficha.MASCULINO = [
    {
      id: 'm1', numero: 'M1', titulo: 'Histórico Urológico',
      campos: [
        radio('m1_prostatectomia', 'Prostatectomia radical', ['Não', 'Aberta', 'Robótica']),
        data('m1_prostatectomia_data', 'Prostatectomia — data'),
        radio('m1_rtup', 'RTUP — ressecção transuretral da próstata', SIM_NAO),
        data('m1_rtup_data', 'RTUP — data'),
        txt('m1_sonda_tempo', 'Tempo de permanência de sonda'),
        radio('m1_radioterapia', 'Radioterapia pélvica', SIM_NAO),
        txt('m1_radioterapia_quando', 'Radioterapia — quando'),
        area('m1_outras_cirurgias', 'Outras cirurgias pélvicas', { larguraTotal: true }),
        area('m1_medicamentos', 'Medicamentos em uso', { larguraTotal: true })
      ]
    },
    { id: 'm_ipss',  numero: 'M2', titulo: 'IPSS — International Prostate Symptom Score',
      tipoEspecial: 'ipss', campos: [] },
    { id: 'm_iief5', numero: 'M3', titulo: 'IIEF-5 — Índice Internacional de Função Erétil',
      tipoEspecial: 'iief5', campos: [] },
    { id: 'm_cpsi',  numero: 'M4', titulo: 'NIH-CPSI — Chronic Prostatitis Symptom Index',
      tipoEspecial: 'cpsi', campos: [] }
  ];

  /* ══════════════════════════════════════════════════════════════
     MODO ESSENCIAL — o subconjunto que se preenche COM a paciente

     A ficha completa tem mais de duzentos campos. Preenchê-la inteira
     durante a consulta significa olhar para a tela em vez de olhar
     para a pessoa — e ela costuma estar ansiosa, às vezes já despida.

     Estes são os campos que efetivamente mudam a conduta na primeira
     sessão. O restante da ficha continua existindo e pode ser
     completado depois que a paciente sai, ou ao longo do seguimento.

     Não é uma ficha reduzida: é a mesma ficha, com o resto recolhido.
     ══════════════════════════════════════════════════════════════ */
  Ficha.ESSENCIAIS = [
    /* Quem é e por que veio */
    'ident_data', 'ident_nome', 'ident_idade', 'ident_diagnostico_med',
    's3_queixa', 's3_inicio', 's3_eva_queixa',

    /* O que muda a conduta pélvica */
    's1_estado_reprodutivo',
    's2_g', 's2_p', 's2_a', 's2_c', 's2_forceps',

    /* Sintomas que definem o eixo do tratamento */
    's5_iu', 's5_urgencia', 's5_desencadeantes', 's5_quantidade', 's5_nocturia',
    's6_urgencia', 's6_perda_insensivel',
    's7_percepcao_prolapso',
    's8_dispareunia',
    's9_dor_pelvica',

    /* Exame — o consentimento nunca sai do essencial */
    'ef_esclarecida', 'ef_autorizou',
    'ef_peso', 'ef_estatura', 'ef_imc',
    'ef_pop_anterior', 'ef_pop_posterior', 'ef_pop_cupula',
    'afa_movimento_interno', 'afa_oxford', 'afa_ics',
    'afa_relaxamento', 'afa_eva_desconforto',

    /* O que fecha a sessão */
    'ef_diagnostico_ap'
  ];

  /* Blocos inteiros que permanecem no modo essencial. */
  Ficha.SECOES_ESSENCIAIS = ['identificacao', 's3', 's2', 's5', 'wexner',
                             'consentimento', 'ef_geral', 'ef_pop', 'ef_afa', 'ef_diagnostico'];

  Ficha.ehEssencial = function (id) {
    return Ficha.ESSENCIAIS.indexOf(id) !== -1;
  };

  /* ══════════════════════════════════════════════════════════════
     TEXTOS INSTITUCIONAIS
     ══════════════════════════════════════════════════════════════ */

  /* Registro profissional: constante única, alterada num só lugar.
     Número lido da identificação em vídeo institucional da própria
     profissional. Confirmar antes do uso em documento oficial. */
  Ficha.CREFITO = 'CREFITO-4: 252806-F';

  Ficha.RODAPE_LEGAL =
    'Prescrição privativa de Fisioterapia Pélvica. Este documento é individual, ' +
    'intransferível e não substitui o acompanhamento presencial continuado. ' +
    'Dra. Vanessa Fernandes — Fisioterapia Pélvica | ' + Ficha.CREFITO + '.';

  Ficha.TEXTO_SEM_CONSENTIMENTO = 'Exame interno não autorizado pela paciente.';

  raiz.Ficha = Ficha;
  if (typeof module !== "undefined") module.exports = Ficha;

})(typeof window !== "undefined" ? window : globalThis);
