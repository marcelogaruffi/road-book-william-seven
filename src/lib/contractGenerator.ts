import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ContractVariables = {
  numeroSequencial?: number;
  nomeContratado: string;
  cpfContratado: string;
  rgContratado?: string;
  cidadeContratado?: string;
  estadoContratado?: string;
  telefoneContratado?: string;
  emailContratado?: string;
  chavePixContratado?: string;
  funcaoContratado: string;
  descricaoServicos?: string;
  tipoPessoaContratado?: string;
  representanteContratado?: string;
  // Composição Financeira
  modoRemuneracao?: "discriminado" | "fechado";
  valorCache?: number | string;
  valorDiarias?: number | string;
  qtdDiarias?: number;
  valorAjudaCusto?: number | string;
  valorOutros?: number | string;
  valorTotal?: number | string;
  discriminacaoValores?: string;
  // Dados Bancários
  bancoContratado?: string;
  agenciaContratado?: string;
  contaContratado?: string;
  dadosBancarios?: string;
  // Condições e Benefícios Inclusos
  condicoesTransporte?: string;
  condicoesTraslados?: string;
  condicoesHospedagem?: string;
  condicoesAlimentacao?: string;
  condicoesCatering?: string;
  condicoesEquipamentos?: string;
  condicoesDireitosImagem?: string;
  condicoesOperacionais?: string;
  condicoesAdicionais?: string;
  prazoAvisoCancelamento?: string;
  multaCancelamento?: string;
  // Turnê / Múltiplas Praças
  isTurne?: boolean;
  qtdApresentacoes?: number;
  itinerarioTurne?: string;
  condicoesPagamento?: string;
  nomeEspetaculo: string;
  cidadeEvento?: string;
  localEvento?: string;
  dataEvento?: string;
  dataInicial?: string;
  dataFinal?: string;
  horarioEvento?: string;
  // Produtora / Contratante
  nomeProdutora?: string;
  nomeFantasiaProdutora?: string;
  cnpjProdutora?: string;
  enderecoProdutora?: string;
  cidadeProdutora?: string;
  representanteProdutora?: string;
  tipoPessoaProdutora?: string;
  codigoAutenticacao?: string;
  // Aditivo
  aditivoNumero?: string | number;
  aditivoObjeto?: string;
  contratoOriginalCodigo?: string;
  contratoDataOriginal?: string;
  descricaoAditivo?: string;
  valorAdicional?: number | string;
  aditivoPagamento?: string;
  aditivoDataEfeito?: string;
};

export function formatCurrencyBR(val: number | string): string {
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/\D/g, "")) / 100 || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function valorPorExtenso(valor: number): string {
  if (valor === 0) return "zero reais";
  
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converterCentena(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let res = "";
    const c = Math.floor(n / 100);
    const resto = n % 100;
    if (c > 0) {
      res += centenas[c];
      if (resto > 0) res += " e ";
    }
    if (resto < 20) {
      res += unidades[resto];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      res += dezenas[d];
      if (u > 0) res += " e " + unidades[u];
    }
    return res;
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  const partes: string[] = [];
  const milhoes = Math.floor(inteiro / 1000000);
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  const unidadesResto = inteiro % 1000;

  if (milhoes > 0) {
    partes.push(`${converterCentena(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`);
  }
  if (milhares > 0) {
    partes.push(`${milhares === 1 ? "mil" : converterCentena(milhares) + " mil"}`);
  }
  if (unidadesResto > 0) {
    partes.push(converterCentena(unidadesResto));
  }

  let strReais = partes.join(" e ");
  if (inteiro > 0) {
    strReais += inteiro === 1 ? " real" : " reais";
  }

  if (centavos > 0) {
    const strCentavos = `${converterCentena(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
    if (inteiro > 0) {
      return `${strReais} e ${strCentavos}`;
    }
    return strCentavos;
  }

  return strReais;
}

export function generateVerificationCode(seqNumber?: number): string {
  const year = new Date().getFullYear();
  if (typeof seqNumber === "number" && seqNumber > 0) {
    const padded = String(seqNumber).padStart(4, "0");
    return `CTR-${year}-${padded}`;
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CTR-${year}-${code}`;
}

export async function computeDocumentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ==============================================================================
// PRESETS DE LOGÍSTICA E BENEFÍCIOS SELECIONÁVEIS
// ==============================================================================
export const PRESETS_HOSPEDAGEM = [
  { label: "Hotel executivo com café (Individual)", valor: "Hospedagem em hotel padrão executivo com café da manhã incluso, em quarto individual, fornecida pela CONTRATANTE." },
  { label: "Hotel executivo com café (Duplo / Compartilhado)", valor: "Hospedagem em hotel padrão executivo com café da manhã incluso, em quarto duplo/compartilhado, fornecida pela CONTRATANTE." },
  { label: "Airbnb / Residência de Temporada com café", valor: "Hospedagem em Airbnb ou residência de temporada selecionada, com café da manhã providenciado pela produção." },
  { label: "Airbnb / Residência de Temporada sem café", valor: "Hospedagem em Airbnb ou residência de temporada fornecida pela CONTRATANTE (alimentação por ajuda de custo ou catering)." },
  { label: "Ajuda de custo diária para hospedagem", valor: "Hospedagem de responsabilidade do CONTRATADO, mediante ajuda de custo específica paga pela CONTRATANTE." },
  { label: "Incluso no cachê global (por conta do contratado)", valor: "Hospedagem por conta exclusiva do CONTRATADO, integralmente compreendida no valor global pactuado." },
  { label: "Não aplicável (sem pernoite)", valor: "Não aplicável (apresentação local sem necessidade de hospedagem ou pernoite)." },
];

export const PRESETS_TRANSPORTE = [
  { label: "Aéreo emitido pela CONTRATANTE (com bagagem)", valor: "Passagens aéreas de ida e volta emitidas pela CONTRATANTE com franquia de bagagem despachada inclusa." },
  { label: "Transporte terrestre em van/ônibus leito da produção", valor: "Transporte rodoviário interestadual em veículo executivo / ônibus leito fretado pela produção." },
  { label: "Reembolso de combustível e pedágio", valor: "Deslocamento terrestre por conta do CONTRATADO com reembolso integral de combustível e pedágio mediante comprovantes fiscais." },
  { label: "Incluso no cachê global", valor: "Transporte e passagens de inteira responsabilidade do CONTRATADO, inclusos no valor global contratado." },
  { label: "Não aplicável (apresentação na praça sede)", valor: "Não aplicável (apresentação realizada na cidade de domicílio do profissional)." },
];

export const PRESETS_TRASLADOS = [
  { label: "Vans e carros oficiais da produção", valor: "Traslados locais (aeroporto/rodoviária <-> hotel <-> teatro) realizados exclusivamente pelas vans da produção." },
  { label: "Aplicativos / Táxi custeados pela produção", valor: "Traslados locais realizados via aplicativos de transporte ou táxi custeados diretamente pela CONTRATANTE." },
  { label: "Incluso no valor global", valor: "Traslados locais por conta do CONTRATADO, contemplados no valor global contratado." },
  { label: "Não aplicável", valor: "Não aplicável à logística deste evento." },
];

export const PRESETS_ALIMENTACAO = [
  { label: "Refeições fornecidas + Catering de camarim", valor: "Refeições diárias completas (almoço e jantar) fornecidas pela CONTRATANTE, além de serviço de catering e camarim nos teatros." },
  { label: "Catering completo de teatro/camarim", valor: "Serviço de catering completo disponibilizado no teatro durante montagem, ensaios e apresentações." },
  { label: "Ajuda de custo diária de alimentação", valor: "Ajuda de custo diária de alimentação creditada diretamente ao CONTRATADO conforme discriminado nas condições financeiras." },
  { label: "Incluso no valor global", valor: "Alimentação e despesas correlatas por conta do CONTRATADO, compreendidas no valor global ajustado." },
];

export const PRESETS_EQUIPAMENTOS = [
  { label: "Equipamentos fornecidos pela produção", valor: "Equipamentos técnicos de som, luz, projeção e palco disponibilizados integralmente pela CONTRATANTE conforme rider aprovado." },
  { label: "Instrumentos / ferramentas próprias com suporte", valor: "O CONTRATADO utilizará instrumentos/ferramentas de uso pessoal, com zelo e suporte técnico e logístico da produção." },
  { label: "Não aplicável", valor: "Não aplicável à função contratada." },
];

export const PRESETS_IMAGEM = [
  { label: "Autorização promocional e institucional de circulação", valor: "Autorização de uso de nome, imagem e voz exclusivamente para divulgação institucional e promocional do espetáculo contratado, nos meios de comunicação, programas e mídias sociais oficiais pelo período da circulação." },
  { label: "Autorização ampla de circulação", valor: "Autorização para uso de imagem e voz em fotos de cena, clipping, programas e mídias sociais oficiais da turnê pelo período de circulação." },
  { label: "Não aplicável", valor: "Não aplicável." },
];

// ==============================================================================
// 5 MODELOS NATIVOS OFICIAIS DO ÁXIS
// ==============================================================================
export const MODELO_CONTRATO_ARTISTICO = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS
**Contrato nº {{CONTRATO_NUMERO}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}, {{CONTRATANTE_TIPO_PESSOA}}, inscrito(a) no CPF/CNPJ sob nº {{CONTRATANTE_DOCUMENTO}}, com endereço em {{CONTRATANTE_ENDERECO}}, neste ato representado(a), quando aplicável, por {{CONTRATANTE_REPRESENTANTE}}.

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}, {{PROFISSIONAL_TIPO_PESSOA}}, inscrito(a) no CPF/CNPJ sob nº {{PROFISSIONAL_DOCUMENTO}}, com endereço em {{PROFISSIONAL_ENDERECO}}, representado(a), quando aplicável, por {{PROFISSIONAL_REPRESENTANTE}}.

As partes celebram o presente contrato de prestação de serviços artísticos, nas seguintes condições:

### CLÁUSULA 1ª — OBJETO

1.1. O presente instrumento tem por objeto a prestação de serviços artísticos na função de **{{FUNCAO}}**, no espetáculo, projeto ou evento denominado **{{EVENTO_NOME}}**, compreendendo {{DESCRICAO_SERVICOS}}.

1.2. Os serviços incluem exclusivamente as apresentações, ensaios, preparações e demais atividades previstas neste contrato e no Anexo I — Roteiro e Condições da Contratação.

1.3. A contratação compreende o período de {{DATA_INICIO}} a {{DATA_FIM}}, podendo abranger uma apresentação, múltiplas apresentações ou turnê em diferentes localidades.

### CLÁUSULA 2ª — EXECUÇÃO E PROGRAMAÇÃO

2.1. O(A) CONTRATADO(A) compromete-se a executar as atividades ajustadas com profissionalismo, pontualidade e respeito às condições artísticas previamente acordadas.

2.2. As datas, cidades, locais, horários, intervalos e atividades constam do Anexo I, integrante deste instrumento.

2.3. A inclusão de apresentações, ensaios ou atividades não previstos dependerá de acordo entre as partes, com definição dos efeitos financeiros e operacionais.

2.4. A participação em atividades que ofereçam risco à integridade física ou moral não poderá ser exigida em desacordo com a legislação aplicável.

### CLÁUSULA 3ª — REMUNERAÇÃO

3.1. Pela execução dos serviços, o(a) CONTRATADO(A) receberá a remuneração definida no Anexo I, conforme a modalidade financeira selecionada.

3.2. A remuneração poderá ser estabelecida por valor global, apresentação, diária ou composição discriminada, incluindo apenas as parcelas expressamente identificadas.

3.3. O pagamento será realizado conforme os prazos, parcelas e meios previstos no Anexo I, observadas as retenções tributárias legalmente aplicáveis.

3.4. Despesas e benefícios fornecidos separadamente pela CONTRATANTE não serão considerados integrantes do cachê, salvo disposição expressa e juridicamente válida.

### CLÁUSULA 4ª — VIAGENS E LOGÍSTICA

4.1. As condições relativas a passagens, hospedagem, transporte terrestre, traslados, alimentação, catering e ajudas de custo serão aquelas expressamente descritas no Anexo I.

4.2. A responsabilidade por reservas, emissões, pagamentos e reembolsos observará as opções contratadas, sem prejuízo de obrigações legais ou coletivas.

4.3. Alterações substanciais de itinerário, datas ou condições de deslocamento deverão ser comunicadas e ajustadas entre as partes.

### CLÁUSULA 5ª — IMAGEM E DIREITOS ARTÍSTICOS

5.1. O(A) CONTRATADO(A) autoriza, quando assinalado no Anexo I, a utilização de seu nome, imagem e voz exclusivamente para divulgação do espetáculo ou projeto contratado, nos meios, território e prazo especificados.

5.2. A gravação integral, transmissão, distribuição, disponibilização comercial ou reutilização de interpretações artísticas dependerá de autorização específica, respeitados os direitos autorais e conexos e a legislação profissional aplicável.

5.3. Nenhuma disposição deste contrato implica cessão geral ou automática de direitos autorais ou conexos.

### CLÁUSULA 6ª — CANCELAMENTO E RESCISÃO

6.1. O cancelamento ou a rescisão deverá ser comunicado por escrito, preferencialmente com antecedência de {{PRAZO_AVISO_CANCELAMENTO}}, ressalvadas situações excepcionais.

6.2. Permanecerão devidos os valores correspondentes aos serviços efetivamente prestados, além das despesas comprovadamente assumidas e não recuperáveis, quando legalmente exigíveis.

6.3. Eventuais multas ou indenizações observarão as condições expressamente pactuadas no Anexo I e os limites legais.

6.4. Na ocorrência de força maior, as partes buscarão, sempre que possível, a remarcação consensual, sem prejuízo dos direitos legalmente assegurados.

### CLÁUSULA 7ª — NATUREZA DA CONTRATAÇÃO

7.1. O presente instrumento destina-se à contratação civil de serviços autônomos, quando juridicamente admissível, não afastando o reconhecimento de eventual relação de emprego ou a aplicação de legislação profissional específica quando presentes seus requisitos.

7.2. As partes observarão as obrigações fiscais, previdenciárias, profissionais e coletivas que lhes forem aplicáveis.

### CLÁUSULA 8ª — DISPOSIÇÕES GERAIS

8.1. As partes comprometem-se a respeitar a confidencialidade das informações não públicas da produção e a legislação de proteção de dados pessoais.

8.2. Alterações das condições contratadas deverão ser formalizadas por aditivo, inclusive eletrônico.

8.3. As partes admitem assinatura eletrônica por mecanismo capaz de comprovar autoria e integridade do documento.

8.4. Fica eleito o foro de {{FORO_CIDADE_UF}}, quando legalmente admissível, ressalvadas as competências obrigatórias.

Integram este contrato o Anexo I e os aditivos posteriormente celebrados.

**{{LOCAL_ASSINATURA}}, {{DATA_ASSINATURA}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}

---

{{ANEXO_I_ROTEIRO}}
`;

export const MODELO_CONTRATO_TECNICO = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS PARA ESPETÁCULOS E EVENTOS
**Contrato nº {{CONTRATO_NUMERO}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}, {{CONTRATANTE_TIPO_PESSOA}}, CPF/CNPJ {{CONTRATANTE_DOCUMENTO}}, endereço {{CONTRATANTE_ENDERECO}}, representado(a), quando aplicável, por {{CONTRATANTE_REPRESENTANTE}}.

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}, {{PROFISSIONAL_TIPO_PESSOA}}, CPF/CNPJ {{PROFISSIONAL_DOCUMENTO}}, endereço {{PROFISSIONAL_ENDERECO}}, representado(a), quando aplicável, por {{PROFISSIONAL_REPRESENTANTE}}.

As partes ajustam o presente contrato:

### CLÁUSULA 1ª — OBJETO

1.1. O presente instrumento tem por objeto a prestação de serviços técnicos na função de **{{FUNCAO}}**, para o espetáculo ou evento **{{EVENTO_NOME}}**, compreendendo {{DESCRICAO_SERVICOS}}.

1.2. Os serviços poderão envolver montagem, preparação, operação, manutenção operacional e desmontagem, exclusivamente conforme as atividades contratadas.

1.3. A contratação ocorrerá entre {{DATA_INICIO}} e {{DATA_FIM}}, nas localidades e condições estabelecidas no Anexo I — Roteiro e Condições da Contratação.

### CLÁUSULA 2ª — EXECUÇÃO DOS SERVIÇOS

2.1. O(A) CONTRATADO(A) executará os serviços com diligência técnica, observando os procedimentos de segurança, as especificações do projeto e os limites de sua qualificação profissional.

2.2. O cronograma de atividades, incluindo montagem, passagem técnica, ensaios, apresentações e desmontagem, quando aplicáveis, constará do Anexo I.

2.3. A inclusão de atividades, funções ou datas adicionais dependerá de acordo entre as partes, inclusive quanto à remuneração correspondente.

### CLÁUSULA 3ª — REMUNERAÇÃO

3.1. A remuneração será estabelecida conforme o Anexo I, podendo corresponder a valor global, diária, apresentação ou composição discriminada de serviços.

3.2. O pagamento será efetuado nas condições e prazos ali estabelecidos, observadas as obrigações fiscais e retenções legais.

3.3. Despesas de viagens e benefícios fornecidos pela CONTRATANTE serão discriminados separadamente, quando aplicável.

### CLÁUSULA 4ª — EQUIPAMENTOS E SEGURANÇA

4.1. A CONTRATANTE disponibilizará os equipamentos, materiais, infraestrutura e condições de segurança que estiverem sob sua responsabilidade, conforme especificado no Anexo I.

4.2. O(A) CONTRATADO(A) deverá utilizar adequadamente os equipamentos disponibilizados, comunicar defeitos ou riscos identificados e observar as normas técnicas e de segurança aplicáveis.

4.3. Atividades que exijam habilitação, treinamento ou autorização específica somente poderão ser executadas por profissionais devidamente qualificados.

4.4. Diante de risco grave e iminente, a atividade deverá ser interrompida e a situação comunicada ao responsável pela produção.

4.5. Eventuais danos a equipamentos serão apurados conforme responsabilidade comprovada e legislação aplicável, não havendo responsabilidade automática por desgaste normal ou falhas preexistentes.

### CLÁUSULA 5ª — VIAGENS E DESPESAS

5.1. Passagens, hospedagem, traslados, transporte, alimentação, catering e ajudas de custo seguirão as condições expressamente estabelecidas no Anexo I.

5.2. A distribuição de responsabilidades financeiras não afastará obrigações previstas em legislação ou normas coletivas aplicáveis.

### CLÁUSULA 6ª — CONFIDENCIALIDADE E CONDUTA

6.1. O(A) CONTRATADO(A) compromete-se a preservar informações técnicas, comerciais e operacionais não públicas a que tiver acesso durante a execução dos serviços.

6.2. As partes deverão manter conduta profissional, respeitosa e compatível com as exigências de segurança do evento.

### CLÁUSULA 7ª — CANCELAMENTO E RESCISÃO

7.1. O cancelamento ou a rescisão será comunicado por escrito, preferencialmente com antecedência de {{PRAZO_AVISO_CANCELAMENTO}}.

7.2. Os serviços efetivamente executados serão remunerados, observadas as despesas comprovadas, as condições pactuadas e a legislação aplicável.

7.3. Alterações de datas, locais ou escopo deverão ser formalizadas por aditivo quando modificarem substancialmente a contratação.

### CLÁUSULA 8ª — NATUREZA E DISPOSIÇÕES GERAIS

8.1. Este contrato destina-se à prestação civil de serviços autônomos, quando juridicamente cabível, sem afastar eventual vínculo empregatício ou normas profissionais obrigatórias.

8.2. As partes observarão as obrigações fiscais, previdenciárias, profissionais, de segurança e de proteção de dados que lhes sejam aplicáveis.

8.3. O Anexo I integra este instrumento, assim como seus futuros aditivos.

8.4. As partes admitem assinatura eletrônica com comprovação de autoria e integridade.

8.5. Fica eleito o foro de {{FORO_CIDADE_UF}}, quando legalmente admissível, ressalvadas as competências obrigatórias.

**{{LOCAL_ASSINATURA}}, {{DATA_ASSINATURA}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}

---

{{ANEXO_I_ROTEIRO}}
`;

export const MODELO_CONTRATO_PRODUCAO_BACKSTAGE = `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PRODUÇÃO E BACKSTAGE
**Contrato nº {{CONTRATO_NUMERO}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}, {{CONTRATANTE_TIPO_PESSOA}}, CPF/CNPJ {{CONTRATANTE_DOCUMENTO}}, com endereço em {{CONTRATANTE_ENDERECO}}, neste ato representado(a), quando aplicável, por {{CONTRATANTE_REPRESENTANTE}}.

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}, {{PROFISSIONAL_TIPO_PESSOA}}, CPF/CNPJ {{PROFISSIONAL_DOCUMENTO}}, com endereço em {{PROFISSIONAL_ENDERECO}}, representado(a), quando aplicável, por {{PROFISSIONAL_REPRESENTANTE}}.

As partes ajustam o presente contrato de prestação de serviços de produção e apoio operacional:

### CLÁUSULA 1ª — OBJETO

1.1. O presente instrumento tem por objeto a prestação de serviços de produção e apoio operacional na função de **{{FUNCAO}}**, para o espetáculo ou evento **{{EVENTO_NOME}}**, compreendendo {{DESCRICAO_SERVICOS}}.

1.2. As atividades incluem suporte de produção, coordenação operacional de bastidores, camarins, figurinos, contrarregragem, recepção e logística, conforme discriminado no Anexo I.

1.3. A contratação ocorrerá entre {{DATA_INICIO}} e {{DATA_FIM}}, nas praças e condições descritas no Anexo I.

### CLÁUSULA 2ª — CONDUTA E CONFIDENCIALIDADE NOS BASTIDORES

2.1. O(A) CONTRATADO(A) compromete-se a atuar com diligência, discrição, pontualidade e respeito à privacidade dos artistas, técnicos e integrantes da equipe.

2.2. É expressamente vedada a divulgação pública de imagens não autorizadas de bastidores, camarins, dados operacionais e de bilheteria sem anuência expressa da CONTRATANTE.

2.3. As partes zelarão por ambiente de trabalho seguro, profissional e colaborativo.

### CLÁUSULA 3ª — REMUNERAÇÃO

3.1. A remuneração e as parcelas contratadas serão aquelas estabelecidas no Anexo I, observada a modalidade financeira adotada.

3.2. Os pagamentos serão realizados nos prazos e condições pactuados, com as devidas retenções tributárias e emissão de notas fiscais ou recibos aplicáveis.

### CLÁUSULA 4ª — LOGÍSTICA E VIAGENS

4.1. Deslocamentos, traslados, hospedagem, alimentação, catering e ajudas de custo seguirão o detalhamento constante do Anexo I.

4.2. As partes ajustarão previamente eventuais necessidades de remarcação ou alteração de roteiro decorrentes de força maior.

### CLÁUSULA 5ª — CANCELAMENTO, RESCISÃO E FORO

5.1. O cancelamento ou rescisão deverá ser comunicado por escrito com antecedência de {{PRAZO_AVISO_CANCELAMENTO}}.

5.2. Valores relativos a serviços prestados permanecerão devidos nos termos da legislação aplicável.

5.3. As partes admitem a plena validade jurídica da assinatura eletrônica deste contrato nos termos da legislação nacional.

5.4. Fica eleito o foro da Comarca de {{FORO_CIDADE_UF}}.

**{{LOCAL_ASSINATURA}}, {{DATA_ASSINATURA}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}

---

{{ANEXO_I_ROTEIRO}}
`;

export const MODELO_ANEXO_ROTEIRO_COMPLETO = `# ANEXO I — ROTEIRO E CONDIÇÕES DA CONTRATAÇÃO
**Vinculado ao contrato nº {{CONTRATO_NUMERO}}**

**Evento / Espetáculo:** {{EVENTO_NOME}}

**Contratante:** {{CONTRATANTE_NOME}}

**Contratado(a):** {{PROFISSIONAL_NOME}}

**Função:** {{FUNCAO}}

**Período:** {{DATA_INICIO}} a {{DATA_FIM}}

### 1. ROTEIRO DE ATIVIDADES E APRESENTAÇÕES

As atividades contratadas ocorrerão conforme o itinerário oficial detalhado:

{{ITINERARIO_TURNE}}

- **Total de apresentações:** {{TOTAL_APRESENTACOES}}
- **Total de diárias remuneradas:** {{TOTAL_DIARIAS}}
- **Período da contratação:** {{DATA_INICIO}} a {{DATA_FIM}}

### 2. CONDIÇÕES FINANCEIRAS

{{DISCRIMINACAO_VALORES}}

**TOTAL FINANCEIRO CONTRATADO: {{VALOR_TOTAL_CONTRATADO}} ({{VALOR_GLOBAL_EXTENSO}})**

### 3. CONDIÇÕES DE PAGAMENTO

- **Forma de pagamento:** {{PAGAMENTO_FORMA}}
- **Regras e Prazos:** {{CONDICOES_PAGAMENTO}}
- **Dados para Liquidação:** {{DADOS_BANCARIOS}}

### 4. TRANSPORTE E DESLOCAMENTOS

- **Passagens e Transporte Interestadual:** {{CONDICOES_TRANSPORTE}}
- **Traslados Locais:** {{CONDICOES_TRASLADOS}}

### 5. HOSPEDAGEM

- **Acomodação:** {{CONDICOES_HOSPEDAGEM}}

### 6. ALIMENTAÇÃO E CATERING

- **Alimentação:** {{CONDICOES_ALIMENTACAO}}

### 7. CONDIÇÕES ESPECÍFICAS

- **Equipamentos e Materiais:** {{CONDICOES_EQUIPAMENTOS}}
- **Direitos de Imagem e Voz:** {{IMAGEM_FINALIDADE}}
- **Condições Adicionais:** {{CONDICOES_ADICIONAIS}}

### 8. CANCELAMENTO E REMARCAÇÃO

- **Prazo preferencial de comunicação:** {{PRAZO_AVISO_CANCELAMENTO}}
- **Regras de Cancelamento:** {{MULTA_CANCELAMENTO_DESCRICAO}}

### 9. INTEGRAÇÃO CONTRATUAL

O presente anexo integra o contrato nº {{CONTRATO_NUMERO}}, prevalecendo suas condições específicas quanto a roteiro, remuneração e logística.

**{{LOCAL_ASSINATURA}}, {{DATA_ASSINATURA}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}
`;

export const MODELO_TERMO_ADITIVO = `# TERMO ADITIVO AO CONTRATO DE PRESTAÇÃO DE SERVIÇOS
**Aditivo nº {{ADITIVO_NUMERO}}**

**Contrato original nº:** {{CONTRATO_ORIGINAL_CODIGO}}

**Data do contrato original:** {{CONTRATO_DATA_ORIGINAL}}

**CONTRATANTE:** {{CONTRATANTE_NOME}}, {{CONTRATANTE_TIPO_PESSOA}}, CPF/CNPJ {{CONTRATANTE_DOCUMENTO}}.

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}, {{PROFISSIONAL_TIPO_PESSOA}}, CPF/CNPJ {{PROFISSIONAL_DOCUMENTO}}.

As partes resolvem celebrar o presente termo aditivo, mediante as seguintes condições:

### CLÁUSULA 1ª — OBJETO DA ALTERAÇÃO

1.1. O presente aditivo tem por finalidade alterar ou complementar as condições do contrato original relativas a {{ADITIVO_OBJETO}}.

1.2. As alterações pactuadas são descritas a seguir:
{{DESCRICAO_ADITIVO}}

### CLÁUSULA 2ª — ATIVIDADES E ROTEIRO

2.1. As atividades e praças acrescentadas ou ajustadas são:
{{ITINERARIO_TURNE}}

### CLÁUSULA 3ª — CONDIÇÕES FINANCEIRAS

3.1. Em razão das alterações ajustadas, o valor da remuneração original é aditado com o acréscimo de **{{VALOR_ADICIONAL}}**, totalizando o novo montante líquido de **{{VALOR_TOTAL_CONTRATADO}}** ({{VALOR_GLOBAL_EXTENSO}}).

3.2. Condições e prazos de pagamento da complementação: {{ADITIVO_PAGAMENTO}}.

### CLÁUSULA 4ª — LOGÍSTICA E BENEFÍCIOS

4.1. As condições de transporte, hospedagem e alimentação passam a observar:
- **Transporte:** {{CONDICOES_TRANSPORTE}}
- **Hospedagem:** {{CONDICOES_HOSPEDAGEM}}
- **Alimentação:** {{CONDICOES_ALIMENTACAO}}

### CLÁUSULA 5ª — RATIFICAÇÃO

5.1. Permanecem válidas e inalteradas todas as demais cláusulas do contrato original que não tenham sido expressamente modificadas pelo presente termo.

5.2. Este aditivo integra o contrato original e produzirá efeitos a partir de {{ADITIVO_DATA_EFEITO}}, respeitados os direitos já constituídos.

5.3. As partes admitem assinatura eletrônica com validade jurídica e integridade assegurada.

**{{LOCAL_ASSINATURA}}, {{DATA_ASSINATURA}}**

**CONTRATANTE:** {{CONTRATANTE_NOME}}

**CONTRATADO(A):** {{PROFISSIONAL_NOME}}
`;

export const MODELOS_PADRAO_AXIS = [
  {
    id: "padrao_artistico",
    titulo: "Contrato de Prestação de Serviços Artísticos (Elenco / Músicos)",
    tipo: "artistico",
    descricao: "Contrato formal de serviços artísticos com cláusulas de imagem, execução, roteiro e anexo integrado.",
    conteudo_markdown: MODELO_CONTRATO_ARTISTICO,
  },
  {
    id: "padrao_tecnico",
    titulo: "Contrato de Prestação de Serviços Técnicos (Som, Luz, Palco, Vídeo)",
    tipo: "tecnico",
    descricao: "Contrato para equipe técnica com normas de segurança, equipamentos, responsabilidades operacionais e anexo de roteiro.",
    conteudo_markdown: MODELO_CONTRATO_TECNICO,
  },
  {
    id: "padrao_producao",
    titulo: "Contrato de Prestação de Serviços de Produção e Backstage",
    tipo: "producao",
    descricao: "Contrato para produtores, assistentes, camareiros e apoio operacional com sigilo de camarim e roteiro.",
    conteudo_markdown: MODELO_CONTRATO_PRODUCAO_BACKSTAGE,
  },
  {
    id: "padrao_anexo1",
    titulo: "Anexo I — Roteiro e Condições da Contratação",
    tipo: "anexo",
    descricao: "Documento oficial de roteiro de atividades, cidades da turnê, detalhamento financeiro, logística e transporte.",
    conteudo_markdown: MODELO_ANEXO_ROTEIRO_COMPLETO,
  },
  {
    id: "padrao_aditivo",
    titulo: "Termo Aditivo Contratual (Acréscimo de Praças e Valores)",
    tipo: "aditivo",
    descricao: "Termo aditivo para inclusão de novas cidades, datas ou complementação de remuneração sem alterar o contrato original.",
    conteudo_markdown: MODELO_TERMO_ADITIVO,
  },
];

export function replaceContractVariables(template: string, vars: ContractVariables): string {
  let result = template;

  const totalNum = typeof vars.valorTotal === "number" ? vars.valorTotal : (typeof vars.valorCache === "number" ? vars.valorCache : 0);
  const extenso = valorPorExtenso(totalNum);

  // Montagem da discriminação padrão
  let discriminacaoPadrao = "";
  if (vars.modoRemuneracao === "fechado") {
    discriminacaoPadrao = `Modalidade: Valor global fechado de ${formatCurrencyBR(totalNum)} (${extenso}), abrangendo a integralidade dos serviços e apresentações contratadas.`;
  } else {
    const partesDesc: string[] = [];
    if (vars.valorCache) partesDesc.push(`Cachê: ${formatCurrencyBR(vars.valorCache)}`);
    if (vars.valorDiarias) partesDesc.push(`Diárias (${vars.qtdDiarias || 1} diária(s)): ${formatCurrencyBR(vars.valorDiarias)}`);
    if (vars.valorAjudaCusto) partesDesc.push(`Ajuda de Custo: ${formatCurrencyBR(vars.valorAjudaCusto)}`);
    if (vars.valorOutros) partesDesc.push(`Adicionais/Outros: ${formatCurrencyBR(vars.valorOutros)}`);
    discriminacaoPadrao = `${partesDesc.join(" | ")}; Totalizando a importância líquida de ${formatCurrencyBR(totalNum)} (${extenso}).`;
  }

  // Dados bancários formatados
  const dadosBancariosFormatados = vars.dadosBancarios || (
    vars.bancoContratado 
      ? `Banco: ${vars.bancoContratado} | Agência: ${vars.agenciaContratado || "N/I"} | Conta: ${vars.contaContratado || "N/I"} | Chave PIX: ${vars.chavePixContratado || "Não informada"}`
      : `Chave PIX: ${vars.chavePixContratado || vars.cpfContratado || "A informar"}`
  );

  const codigoContrato = vars.codigoAutenticacao || (vars.numeroSequencial ? generateVerificationCode(vars.numeroSequencial) : "CTR-2026-0001");
  const anoAtual = new Date().getFullYear();
  const numeroContratoFormatado = vars.numeroSequencial 
    ? `${String(vars.numeroSequencial).padStart(4, "0")}/${anoAtual}`
    : codigoContrato;

  const nomeProd = vars.nomeProdutora || "WILLIAM SEVEN PRODUÇÕES ARTÍSTICAS LTDA";
  const cnpjProd = vars.cnpjProdutora || "00.000.000/0001-00";
  const endProd = vars.enderecoProdutora || "São Paulo / SP";
  const cidProd = vars.cidadeProdutora || "São Paulo/SP";
  const repProd = vars.representanteProdutora || "Diretoria";
  const tipoPessoaProd = vars.tipoPessoaProdutora || (cnpjProd.replace(/\D/g, "").length > 11 ? "pessoa jurídica de direito privado" : "pessoa física");

  const nomeContr = vars.nomeContratado || "___________________________";
  const cpfContr = vars.cpfContratado || "___.___.___-__";
  const endContr = [vars.cidadeContratado, vars.estadoContratado].filter(Boolean).join(" - ") || "São Paulo/SP";
  const repContr = vars.representanteContratado || "o próprio";
  const tipoPessoaContr = vars.tipoPessoaContratado || (cpfContr.replace(/\D/g, "").length > 11 ? "pessoa jurídica" : "pessoa física");

  const descricaoServicosDefault = `a execução diligente de ensaios, passagens e apresentações na função de ${vars.funcaoContratado || "Profissional"}`;

  // Anexo I gerado dinamicamente caso requisitado
  const anexoIRoteiroGerado = `# ANEXO I — ROTEIRO E CONDIÇÕES DA CONTRATAÇÃO
**Vinculado ao contrato nº ${numeroContratoFormatado}**

**Evento / Espetáculo:** ${vars.nomeEspetaculo || "Espetáculo Teatral"}
**Contratante:** ${nomeProd}
**Contratado(a):** ${nomeContr}
**Função:** ${vars.funcaoContratado || "Profissional"}
**Período:** ${vars.dataInicial || "Conforme cronograma"} a ${vars.dataFinal || "Conforme cronograma"}

### 1. ROTEIRO DE ATIVIDADES E APRESENTAÇÕES
${vars.itinerarioTurne || `Local: ${vars.localEvento || "Teatro"} em ${vars.cidadeEvento || "Praça"}`}
- **Total de apresentações:** ${vars.qtdApresentacoes || 1}
- **Total de diárias:** ${vars.qtdDiarias || 1}

### 2. CONDIÇÕES FINANCEIRAS
${vars.discriminacaoValores || discriminacaoPadrao}
**Total Contratado:** ${formatCurrencyBR(totalNum)} (${extenso})

### 3. CONDIÇÕES DE PAGAMENTO
- **Forma e Prazo:** ${vars.condicoesPagamento || "Transferência ou PIX em até 5 dias úteis após a apresentação."}
- **Dados Bancários / PIX:** ${dadosBancariosFormatados}

### 4. LOGÍSTICA, TRANSPORTE E BENEFÍCIOS
- **Transporte / Passagens:** ${vars.condicoesTransporte || "Transporte e passagens fornecidos pela PRODUTORA"}
- **Traslados Locais:** ${vars.condicoesTraslados || "Vans oficiais da produção para traslados locais"}
- **Hospedagem:** ${vars.condicoesHospedagem || "Hospedagem em hotel padrão executivo com café da manhã custeada pela PRODUTORA"}
- **Alimentação:** ${vars.condicoesAlimentacao || "Alimentação fornecida via catering nos camarins e refeições organizadas pela PRODUTORA"}
- **Equipamentos:** ${vars.condicoesEquipamentos || "Equipamentos técnicos fornecidos conforme rider"}
- **Direitos de Imagem:** ${vars.condicoesDireitosImagem || "Autorização para fins promocionais e de divulgação do espetáculo."}
- **Condições de Cancelamento:** ${vars.prazoAvisoCancelamento || "30 (trinta) dias de antecedência"}`;

  const replacements: Record<string, string> = {
    // Contratante (ambas as convenções: nova e anterior)
    "{{CONTRATANTE_NOME}}": nomeProd,
    "{{NOME_PRODUTORA}}": nomeProd,
    "{{CONTRATANTE_FANTASIA}}": vars.nomeFantasiaProdutora || nomeProd,
    "{{NOME_FANTASIA_PRODUTORA}}": vars.nomeFantasiaProdutora || nomeProd,
    "{{CONTRATANTE_DOCUMENTO}}": cnpjProd,
    "{{CNPJ_PRODUTORA}}": cnpjProd,
    "{{CONTRATANTE_ENDERECO}}": endProd,
    "{{ENDERECO_PRODUTORA}}": endProd,
    "{{CONTRATANTE_CIDADE}}": cidProd,
    "{{CIDADE_PRODUTORA}}": cidProd,
    "{{CONTRATANTE_REPRESENTANTE}}": repProd,
    "{{CONTRATANTE_TIPO_PESSOA}}": tipoPessoaProd,

    // Contratado(a)
    "{{PROFISSIONAL_NOME}}": nomeContr,
    "{{NOME_CONTRATADO}}": nomeContr,
    "{{PROFISSIONAL_DOCUMENTO}}": cpfContr,
    "{{CPF_CONTRATADO}}": cpfContr,
    "{{RG_CONTRATADO}}": vars.rgContratado || "Não informado",
    "{{PROFISSIONAL_ENDERECO}}": endContr,
    "{{CIDADE_CONTRATADO}}": vars.cidadeContratado || "São Paulo",
    "{{ESTADO_CONTRATADO}}": vars.estadoContratado || "SP",
    "{{PROFISSIONAL_REPRESENTANTE}}": repContr,
    "{{PROFISSIONAL_TIPO_PESSOA}}": tipoPessoaContr,
    "{{TELEFONE_CONTRATADO}}": vars.telefoneContratado || "Não informado",
    "{{EMAIL_CONTRATADO}}": vars.emailContratado || "Não informado",
    "{{CHAVE_PIX_CONTRATADO}}": vars.chavePixContratado || cpfContr || "A informar",
    "{{DADOS_BANCARIOS}}": dadosBancariosFormatados,

    // Função e Objeto
    "{{FUNCAO}}": vars.funcaoContratado || "Profissional",
    "{{FUNCAO_CONTRATADO}}": vars.funcaoContratado || "Profissional",
    "{{EVENTO_NOME}}": vars.nomeEspetaculo || "Espetáculo Teatral",
    "{{NOME_ESPETACULO}}": vars.nomeEspetaculo || "Espetáculo Teatral",
    "{{DESCRICAO_SERVICOS}}": vars.descricaoServicos || descricaoServicosDefault,

    // Datas e Roteiro
    "{{DATA_INICIO}}": vars.dataInicial || vars.dataEvento || "Conforme cronograma",
    "{{DATA_INICIAL}}": vars.dataInicial || vars.dataEvento || "Conforme cronograma",
    "{{DATA_FIM}}": vars.dataFinal || vars.dataEvento || "Conforme cronograma",
    "{{DATA_FINAL}}": vars.dataFinal || vars.dataEvento || "Conforme cronograma",
    "{{DATA_EVENTO}}": vars.dataEvento || "Conforme cronograma",
    "{{CIDADE_EVENTO}}": vars.cidadeEvento || "A definir",
    "{{LOCAL_EVENTO}}": vars.localEvento || "Teatro",
    "{{HORARIO_EVENTO}}": vars.horarioEvento || "Conforme cronograma",
    "{{TOTAL_APRESENTACOES}}": String(vars.qtdApresentacoes || 1),
    "{{QTD_APRESENTACOES}}": String(vars.qtdApresentacoes || 1),
    "{{TOTAL_DIARIAS}}": String(vars.qtdDiarias || 1),
    "{{TOTAL_DIAS_PERIODO}}": String(vars.qtdDiarias || 1),
    "{{ITINERARIO_TURNE}}": vars.itinerarioTurne || "",
    "{{ANEXO_I_ROTEIRO}}": anexoIRoteiroGerado,

    // Financeiro
    "{{VALOR_CACHE}}": formatCurrencyBR(vars.valorCache || totalNum),
    "{{VALOR_DIARIAS}}": formatCurrencyBR(vars.valorDiarias || 0),
    "{{VALOR_AJUDA_CUSTO}}": formatCurrencyBR(vars.valorAjudaCusto || 0),
    "{{VALOR_OUTROS}}": formatCurrencyBR(vars.valorOutros || 0),
    "{{VALOR_TOTAL}}": formatCurrencyBR(totalNum),
    "{{VALOR_TOTAL_CONTRATADO}}": formatCurrencyBR(totalNum),
    "{{VALOR_GLOBAL}}": formatCurrencyBR(totalNum),
    "{{VALOR_GLOBAL_EXTENSO}}": extenso,
    "{{VALOR_POR_EXTENSO}}": extenso,
    "{{DISCRIMINACAO_VALORES}}": vars.discriminacaoValores || discriminacaoPadrao,

    // Pagamento
    "{{PAGAMENTO_FORMA}}": "PIX / Transferência Bancária",
    "{{CONDICOES_PAGAMENTO}}": vars.condicoesPagamento || "Transferência ou PIX em até 5 dias úteis após a apresentação.",

    // Logística e Benefícios
    "{{CONDICOES_TRANSPORTE}}": vars.condicoesTransporte || "Transporte e passagens fornecidos pela PRODUTORA",
    "{{CONDICOES_TRASLADOS}}": vars.condicoesTraslados || "Vans oficiais da produção para traslados locais",
    "{{CONDICOES_HOSPEDAGEM}}": vars.condicoesHospedagem || "Hospedagem em hotel padrão executivo com café da manhã custeada pela PRODUTORA",
    "{{CONDICOES_ALIMENTACAO}}": vars.condicoesAlimentacao || "Alimentação fornecida via catering nos camarins e refeições organizadas pela PRODUTORA",
    "{{CONDICOES_CATERING}}": vars.condicoesCatering || vars.condicoesAlimentacao || "Catering nos teatros e camarins durante montagem e apresentações",
    "{{CONDICOES_EQUIPAMENTOS}}": vars.condicoesEquipamentos || "Equipamentos técnicos fornecidos conforme rider",
    "{{IMAGEM_FINALIDADE}}": vars.condicoesDireitosImagem || "Divulgação institucional, clipping e redes sociais do espetáculo",
    "{{CONDICOES_ADICIONAIS}}": vars.condicoesAdicionais || "As partes elegem a boa-fé e cooperação mútua na execução do projeto.",

    // Cancelamento e Foro
    "{{PRAZO_AVISO_CANCELAMENTO}}": vars.prazoAvisoCancelamento || "30 (trinta) dias de antecedência",
    "{{MULTA_CANCELAMENTO_DESCRICAO}}": vars.multaCancelamento || "Reembolso dos serviços efetivamente prestados e despesas comprovadas",
    "{{FORO_CIDADE_UF}}": cidProd,

    // Código e Numeração Sequencial
    "{{CONTRATO_NUMERO}}": numeroContratoFormatado,
    "{{CODIGO_AUTENTICACAO}}": codigoContrato,
    "{{NUMERO_SEQUENCIAL}}": vars.numeroSequencial ? String(vars.numeroSequencial).padStart(4, "0") : (codigoContrato.split("-").pop() || "0001"),
    "{{NUMERO_CONTRATO}}": numeroContratoFormatado,

    // Termo Aditivo
    "{{ADITIVO_NUMERO}}": String(vars.aditivoNumero || (vars.numeroSequencial ? String(vars.numeroSequencial).padStart(4, "0") : "0001")),
    "{{CONTRATO_ORIGINAL_CODIGO}}": vars.contratoOriginalCodigo || "CTR-ORIGINAL",
    "{{CONTRATO_DATA_ORIGINAL}}": vars.contratoDataOriginal || "Data da celebração original",
    "{{ADITIVO_OBJETO}}": vars.aditivoObjeto || "inclusão de novas praças da turnê e complementação de remuneração",
    "{{DESCRICAO_ADITIVO}}": vars.descricaoAditivo || "Acréscimo de datas e complementação logística/financeira.",
    "{{VALOR_ADICIONAL}}": typeof vars.valorAdicional === "number" ? formatCurrencyBR(vars.valorAdicional) : (vars.valorAdicional || "R$ 0,00"),
    "{{ADITIVO_PAGAMENTO}}": vars.aditivoPagamento || vars.condicoesPagamento || "Pagamento da complementação via PIX em até 5 dias úteis.",
    "{{ADITIVO_DATA_EFEITO}}": vars.aditivoDataEfeito || "sua assinatura",

    // Fechamento
    "{{LOCAL_ASSINATURA}}": cidProd.split("/")[0]?.trim() || cidProd,
    "{{DATA_ASSINATURA}}": format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  };

  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }

  return result;
}

export type ContractAuditData = {
  codigoAutenticacao: string;
  status: string;
  assinadoEm?: string | null;
  signatarioNome?: string | null;
  signatarioCpf?: string | null;
  signatarioEmail?: string | null;
  signatarioIp?: string | null;
  signatarioUserAgent?: string | null;
  hashDocumento?: string | null;
};

export type ProdutoraInfo = {
  nome?: string;
  nomeFantasia?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  logoUrl?: string | null;
  ocultarMarcaAxis?: boolean;
};

export async function exportContractToPDF(
  titulo: string,
  conteudo: string,
  audit: ContractAuditData,
  produtora?: ProdutoraInfo
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  const nomeProd = produtora?.nome || "WILLIAM SEVEN PRODUÇÕES ARTÍSTICAS LTDA";
  const nomeFantasiaProd = produtora?.nomeFantasia || "";
  const cnpjProd = produtora?.cnpj ? `CNPJ/CPF: ${produtora.cnpj}` : "CNPJ: 00.000.000/0001-00";
  const enderecoProd = [produtora?.endereco, produtora?.cidade].filter(Boolean).join(" • ") || "São Paulo / SP";

  // ==============================================================================
  // CABEÇALHO CONFORME IDENTIDADE VISUAL DO SISTEMA (LOGO ESQUERDA + DADOS DIREITA)
  // ==============================================================================
  const logoBoxWidth = 32;
  const logoBoxHeight = nomeFantasiaProd ? 19 : 16;

  // Carregar e desenhar Logotipo da Produtora (se configurado ou fallback oficial)
  let logoInserido = false;
  const urlParaTentar = produtora?.logoUrl || "/logo-seven.png";

  if (urlParaTentar && typeof window !== "undefined") {
    try {
      const imgData = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = urlParaTentar;
      });

      if (imgData) {
        doc.addImage(imgData, "PNG", margin, cursorY, logoBoxWidth, logoBoxHeight, undefined, "FAST");
        logoInserido = true;
      }
    } catch (e) {
      console.warn("Não foi possível carregar o logotipo no PDF:", e);
    }
  }

  // Se não foi possível carregar a imagem, desenha placeholder elegante
  if (!logoInserido) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, cursorY, logoBoxWidth, logoBoxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(nomeFantasiaProd ? nomeFantasiaProd.slice(0, 12).toUpperCase() : "PRODUÇÃO", margin + logoBoxWidth / 2, cursorY + logoBoxHeight / 2 + 2.5, { align: "center" });
  }

  // Dados da Produtora / Contratante à direita
  if (nomeFantasiaProd) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(nomeFantasiaProd.toUpperCase(), pageWidth - margin, cursorY + 4, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Razão Social: ${nomeProd.toUpperCase()}`, pageWidth - margin, cursorY + 8.5, { align: "right" });

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(cnpjProd, pageWidth - margin, cursorY + 12.5, { align: "right" });
    doc.text(enderecoProd, pageWidth - margin, cursorY + 16.5, { align: "right" });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(nomeProd.toUpperCase(), pageWidth - margin, cursorY + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(cnpjProd, pageWidth - margin, cursorY + 10, { align: "right" });
    doc.text(enderecoProd, pageWidth - margin, cursorY + 14.5, { align: "right" });
  }

  // Linha divisória suave
  cursorY += (nomeFantasiaProd ? 24 : 21);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  // Título do Contrato Centralizado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(titulo.toUpperCase(), contentWidth);
  doc.text(titleLines, pageWidth / 2, cursorY, { align: "center" });
  cursorY += titleLines.length * 5 + 2;

  // Subtítulo: Contrato nº / Código de Autenticação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contrato nº ${audit.codigoAutenticacao}`, pageWidth / 2, cursorY, { align: "center" });
  cursorY += 9;

  // ==============================================================================
  // CORPO DO CONTRATO
  // ==============================================================================
  const paragraphs = conteudo.split("\n");

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length === 0) {
      cursorY += 3.5;
      continue;
    }

    // Detecção de títulos e seções
    const isH1 = trimmed.startsWith("# ");
    const isH2 = trimmed.startsWith("## ");
    const isH3 = trimmed.startsWith("### ") || trimmed.startsWith("#### ");
    const isHeading =
      isH1 ||
      isH2 ||
      isH3 ||
      trimmed.startsWith("CLÁUSULA") ||
      trimmed.startsWith("CONTRATO") ||
      trimmed.startsWith("TERMO") ||
      trimmed.startsWith("CONTRATANTE:") ||
      trimmed.startsWith("CONTRATADO(A):") ||
      trimmed.startsWith("ITINERÁRIO") ||
      trimmed.startsWith("ANEXO");

    // Limpa marcadores Markdown (# e **) para o PDF ficar esteticamente limpo e legível
    const cleanText = trimmed
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1");

    if (isH1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      cursorY += 2;
    } else if (isH2 || isH3 || isHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      cursorY += 1.5;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // slate-700
    }

    const lines = doc.splitTextToSize(cleanText, contentWidth);

    // Se as linhas ultrapassarem o espaço da página atual, cria nova página
    if (cursorY + lines.length * 4.4 > pageHeight - 35) {
      doc.addPage();
      cursorY = 20;
    }

    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.4 + (isHeading ? 2 : 1);
  }

  // ==============================================================================
  // BLOCO DE ASSINATURA / AUDITORIA DIGITAL
  // ==============================================================================
  cursorY += 6;
  if (cursorY + 65 > pageHeight - 15) {
    doc.addPage();
    cursorY = 22;
  }

  const isAssinado = audit.status === "assinado" && audit.assinadoEm;

  // Caixa de Autenticação Digital
  doc.setFillColor(isAssinado ? 240 : 248, isAssinado ? 253 : 250, isAssinado ? 244 : 252);
  doc.setDrawColor(isAssinado ? 34 : 203, isAssinado ? 197 : 213, isAssinado ? 94 : 225);
  doc.roundedRect(margin, cursorY, contentWidth, 56, 3, 3, "FD");

  // Selo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(isAssinado ? 22 : 100, isAssinado ? 101 : 116, isAssinado ? 52 : 139);
  doc.text(
    isAssinado
      ? "CERTIFICADO DE ASSINATURA ELETRÔNICA DIGITAL"
      : "DOCUMENTO PENDENTE DE ASSINATURA ELETRÔNICA",
    margin + 6,
    cursorY + 8
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  if (isAssinado) {
    const dataHoraStr = format(new Date(audit.assinadoEm!), "dd/MM/yyyy 'às' HH:mm:ss '(Horário de Brasília, UTC-3)'", { locale: ptBR });
    doc.text(`Signatário: ${audit.signatarioNome || "Nome não registrado"}`, margin + 6, cursorY + 15);
    doc.text(`CPF: ${audit.signatarioCpf || "CPF não registrado"}`, margin + 6, cursorY + 20);
    doc.text(`E-mail: ${audit.signatarioEmail || "E-mail não registrado"}`, margin + 6, cursorY + 25);
    doc.text(`Data/Hora do Aceite: ${dataHoraStr}`, margin + 6, cursorY + 30);
    doc.text(`Endereço IP: ${audit.signatarioIp || "IP Registrado"}`, margin + 6, cursorY + 35);
    
    // Hash SHA-256
    doc.setFont("courier", "bold");
    doc.setFontSize(7);
    const hashLines = doc.splitTextToSize(`Hash SHA-256 do Documento: ${audit.hashDocumento || "N/A"}`, contentWidth - 12);
    doc.text(hashLines, margin + 6, cursorY + 41);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const legalNotice = "Documento eletrônico assinado com manifestação inequívoca de vontade nos termos da Medida Provisória nº 2.200-2/2001 e da Lei Federal nº 14.063/2020.";
    const legalLines = doc.splitTextToSize(legalNotice, contentWidth - 12);
    doc.text(legalLines, margin + 6, cursorY + 48);
  } else {
    doc.text("Este documento aguarda o aceite eletrônico formal por parte do contratado.", margin + 6, cursorY + 18);
    doc.text(`Código de Acompanhamento: ${audit.codigoAutenticacao}`, margin + 6, cursorY + 24);
    doc.text("Assim que o profissional assinar no sistema, o certificado de integridade com Hash SHA-256 será emitido.", margin + 6, cursorY + 30);
  }

  // ==============================================================================
  // RODAPÉ EM TODAS AS PÁGINAS (ÁXIS + NÚMERO DE PÁGINAS)
  // ==============================================================================
  const totalPages = doc.internal.pages.length - 1;
  const exibirMarca = produtora?.ocultarMarcaAxis !== true;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400

    // Rodapé esquerdo (marca do sistema)
    if (exibirMarca) {
      doc.text("Documento gerado pelo Áxis", margin, pageHeight - 8);
    } else {
      doc.text(`Autenticação: ${audit.codigoAutenticacao}`, margin, pageHeight - 8);
    }

    // Rodapé direito (numeração de páginas)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  // Salvar PDF com nome limpo e elegante (sem excesso de underlines nem acentos corrompidos)
  const tituloLimpo = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentuações
    .replace(/[^a-zA-Z0-9\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, " "); // espaços limpos
  const nomeArquivo = `${tituloLimpo || "Contrato"} - ${audit.codigoAutenticacao}.pdf`;
  doc.save(nomeArquivo);
}
