import jsPDF from "jspdf";
import QRCode from "qrcode";

export type DadosIngresso = {
  codigoIngresso: string;
  espetaculo: string;
  cidade: string;
  teatro: string;
  data: string;
  horario: string;
  setor: string;
  fileira: string;
  assento: string;
  portaAcesso?: string;
  tipoIngresso: string; // "CORTESIA VIP", "CONVITE ESPECIAL", "INTEIRA", "MEIA-ENTRADA"
  titularNome: string;
  titularCpf?: string;
  valorPago?: number;
  produtoraNome?: string;
  produtoraLogoUrl?: string;
  bannerShowUrl?: string;
};

type ImgDimResult = {
  base64: string;
  naturalWidth: number;
  naturalHeight: number;
  loadedImg?: HTMLImageElement;
};

/**
 * Converte qualquer imagem URL ou Base64 diretamente usando HTML Image e Canvas síncrono/assíncrono
 */
export async function carregarImagemComDimensoes(url: string): Promise<ImgDimResult | null> {
  if (!url || typeof document === "undefined") return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      if (!url.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          const nw = img.naturalWidth || img.width || 1200;
          const nh = img.naturalHeight || img.height || 500;
          const canvas = document.createElement("canvas");
          canvas.width = nw;
          canvas.height = nh;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve({
              base64: canvas.toDataURL("image/jpeg", 0.95),
              naturalWidth: nw,
              naturalHeight: nh,
              loadedImg: img
            });
          } else {
            resolve({
              base64: url,
              naturalWidth: nw,
              naturalHeight: nh,
              loadedImg: img
            });
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        // Se falhar o crossOrigin, tenta sem crossOrigin
        if (img.crossOrigin) {
          const retryImg = new Image();
          retryImg.onload = () => {
            resolve({
              base64: url,
              naturalWidth: retryImg.naturalWidth || 1200,
              naturalHeight: retryImg.naturalHeight || 500,
              loadedImg: retryImg
            });
          };
          retryImg.onerror = () => resolve(null);
          retryImg.src = url;
        } else {
          resolve(null);
        }
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export async function carregarImagemBase64(url: string): Promise<string | null> {
  const res = await carregarImagemComDimensoes(url);
  return res ? res.base64 : null;
}

/**
 * Gera um QR Code em Base64 PNG a partir de uma string
 */
export async function gerarQRCodeDataUrl(texto: string): Promise<string> {
  try {
    return await QRCode.toDataURL(texto, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
  } catch (err) {
    console.error("Erro ao gerar QR Code:", err);
    return "";
  }
}

/**
 * Desenha a imagem preservando estritamente a proporção original (aspect-ratio),
 * recortando excessos centrais se necessário (object-fit: cover real em PDF)
 */
function desenharImagemCoverPDF(
  doc: jsPDF,
  imgData: ImgDimResult,
  targetX: number,
  targetY: number,
  targetW: number,
  targetH: number
) {
  try {
    const targetRatio = targetW / targetH;
    const imageRatio = (imgData.naturalWidth || 1200) / (imgData.naturalHeight || 500);

    const auxCanvas = document.createElement("canvas");
    auxCanvas.width = 1200;
    auxCanvas.height = Math.round(1200 / targetRatio);
    const ctx = auxCanvas.getContext("2d");

    if (!ctx || !imgData.loadedImg) {
      doc.addImage(imgData.base64, "JPEG", targetX, targetY, targetW, targetH);
      return;
    }

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);

    let sWidth = imgData.naturalWidth;
    let sHeight = imgData.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imageRatio > targetRatio) {
      sWidth = imgData.naturalHeight * targetRatio;
      sx = (imgData.naturalWidth - sWidth) / 2;
    } else {
      sHeight = imgData.naturalWidth / targetRatio;
      sy = (imgData.naturalHeight - sHeight) / 2;
    }

    ctx.drawImage(imgData.loadedImg, sx, sy, sWidth, sHeight, 0, 0, auxCanvas.width, auxCanvas.height);
    const finalCoverBase64 = auxCanvas.toDataURL("image/jpeg", 0.95);

    doc.addImage(finalCoverBase64, "JPEG", targetX, targetY, targetW, targetH);
  } catch (e) {
    console.warn("Fallback addImage direto:", e);
    try {
      doc.addImage(imgData.base64, "JPEG", targetX, targetY, targetW, targetH);
    } catch (err) {}
  }
}

/**
 * Desenha um único bilhete individual no documento PDF (formato vertical de carteira/mobile)
 */
async function desenharCardIndividual(
  doc: jsPDF,
  dados: DadosIngresso,
  width: number,
  height: number,
  bannerImg?: ImgDimResult | null
): Promise<void> {
  // Fundo branco do Ingresso
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  let topoY = 0;
  // Na proporção 2.4:1 com largura de 100mm, a altura exata deve ser 100 / 2.4 = ~41.6mm
  const bannerH = Math.round(width / 2.4); 

  // 1. Foto Oficial no topo com Cover proporcional perfeito
  if (bannerImg) {
    try {
      desenharImagemCoverPDF(doc, bannerImg, 0, 0, width, bannerH);
      topoY = bannerH;
    } catch {
      topoY = 0;
    }
  }

  // 2. Header Escuro com Título do Show e Produtora
  const headerH = 42;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, topoY, width, headerH, "F");

  // Nome da Produtora
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text((dados.produtoraNome || "WILLIAM SEVEN PRODUÇÕES").toUpperCase(), width / 2, topoY + 7, { align: "center" });

  // Nome do Espetáculo
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const espLinhas = doc.splitTextToSize((dados.espetaculo || "ESPETÁCULO").toUpperCase(), width - 16);
  doc.text(espLinhas, width / 2, topoY + 16, { align: "center" });

  // Tipo do Ingresso Badge
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.roundedRect(width / 2 - 25, topoY + 31, 50, 7, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text((dados.tipoIngresso || "INGRESSO").toUpperCase(), width / 2, topoY + 35.8, { align: "center" });

  // 3. Card de Localização do Assento
  const boxTop = topoY + headerH + 5;
  const boxHeight = dados.portaAcesso ? 30 : 20;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(6, boxTop, width - 12, boxHeight, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(6, boxTop, width - 12, boxHeight, 3, 3, "D");

  // Coluna 1: SETOR
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("SETOR", 10, boxTop + 5.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  const setorTruncado = doc.splitTextToSize((dados.setor || "PLATEIA").toUpperCase(), 44);
  doc.text(setorTruncado, 10, boxTop + 11);

  // Divisória 1
  doc.setDrawColor(226, 232, 240);
  doc.line(56, boxTop + 3, 56, boxTop + 16);

  // Coluna 2: FILEIRA
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("FILEIRA", 65, boxTop + 5.5, { align: "center" });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text((dados.fileira || "-").toUpperCase(), 65, boxTop + 12, { align: "center" });

  // Divisória 2
  doc.line(74, boxTop + 3, 74, boxTop + 16);

  // Coluna 3: ASSENTO
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("ASSENTO", 86, boxTop + 5.5, { align: "center" });
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(String(dados.assento || "-"), 86, boxTop + 12, { align: "center" });

  // Linha da Porta de Entrada
  if (dados.portaAcesso) {
    doc.setDrawColor(226, 232, 240);
    doc.line(10, boxTop + 18, width - 10, boxTop + 18);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text("ENTRADA SUGERIDA:", 10, boxTop + 23);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text(dados.portaAcesso, 10, boxTop + 27);
  }

  // 4. Dados da Apresentação
  let currentY = boxTop + boxHeight + 6;

  // Data e Horário
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("DATA E HORÁRIO", 10, currentY);
  currentY += 4;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${dados.data}${dados.horario ? ` às ${dados.horario}` : ""}`, 10, currentY);

  currentY += 6;

  // Local e Cidade
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("LOCAL E CIDADE", 10, currentY);
  currentY += 4;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  const teatroTexto = `${dados.teatro && dados.teatro !== "-" ? dados.teatro : "Teatro Principal"} — ${dados.cidade || "Praça"}`;
  const teatroLinhas = doc.splitTextToSize(teatroTexto, width - 20);
  doc.text(teatroLinhas, 10, currentY);
  currentY += (teatroLinhas.length * 3.8) + 2;

  // Titular do Bilhete
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("TITULAR DO BILHETE", 10, currentY);
  currentY += 4;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const titularTexto = dados.titularCpf ? `${dados.titularNome} (CPF: ${dados.titularCpf})` : (dados.titularNome || "Portador");
  doc.text(titularTexto, 10, currentY);

  // 5. QR Code de Autenticação com espaçamento generoso
  const qrBase64 = await gerarQRCodeDataUrl(dados.codigoIngresso);
  const qrSize = 34;
  const qrPosY = currentY + 5;
  if (qrBase64) {
    doc.addImage(qrBase64, "PNG", width / 2 - qrSize / 2, qrPosY, qrSize, qrSize);
  }

  // 6. Código Alfanumérico abaixo do QR Code
  const codigoPosY = qrPosY + qrSize + 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`CÓDIGO: ${dados.codigoIngresso}`, width / 2, codigoPosY, { align: "center" });

  // 7. Linha tracejada de picote
  doc.setLineDashPattern([2, 1.5], 0);
  doc.setDrawColor(203, 213, 225);
  doc.line(8, codigoPosY + 6, width - 8, codigoPosY + 6);

  // 8. Mensagem de rodapé
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text("Apresente este bilhete impresso ou na tela do celular na entrada do teatro.", width / 2, codigoPosY + 11, { align: "center" });
}

/**
 * Desenha um único card de ingresso dentro de um quadrante de folha A4
 */
async function desenharCardEmFolhaA4(
  doc: jsPDF,
  dados: DadosIngresso,
  startX: number,
  startY: number,
  cardW: number,
  cardH: number,
  bannerImg?: ImgDimResult | null
): Promise<void> {
  doc.setFillColor(255, 255, 255);
  doc.rect(startX, startY, cardW, cardH, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(startX, startY, cardW, cardH, 3, 3, "D");

  let topoOffset = startY;
  // Largura cardW = 96mm. Proporção oficial 2.4:1 -> Altura = 96 / 2.4 = 40mm
  const bannerH = Math.round(cardW / 2.4);

  if (bannerImg) {
    try {
      desenharImagemCoverPDF(doc, bannerImg, startX, startY, cardW, bannerH);
      topoOffset = startY + bannerH;
    } catch {
      topoOffset = startY;
    }
  }

  const headerH = 26;
  doc.setFillColor(15, 23, 42);
  doc.rect(startX, topoOffset, cardW, headerH, "F");

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text((dados.produtoraNome || "WILLIAM SEVEN PRODUÇÕES").toUpperCase(), startX + cardW / 2, topoOffset + 5, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const espLinhas = doc.splitTextToSize((dados.espetaculo || "ESPETÁCULO").toUpperCase(), cardW - 12);
  doc.text(espLinhas, startX + cardW / 2, topoOffset + 11.5, { align: "center" });

  doc.setFillColor(79, 70, 229);
  doc.roundedRect(startX + cardW / 2 - 18, topoOffset + 20, 36, 5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text((dados.tipoIngresso || "INGRESSO").toUpperCase(), startX + cardW / 2, topoOffset + 23.5, { align: "center" });

  const boxTop = topoOffset + headerH + 3;
  const boxHeight = dados.portaAcesso ? 20 : 15;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(startX + 4, boxTop, cardW - 8, boxHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(startX + 4, boxTop, cardW - 8, boxHeight, 2, 2, "D");

  // Colunas de Setor / Fileira / Assento
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("SETOR", startX + 6, boxTop + 4);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  const setorTruncado = doc.splitTextToSize((dados.setor || "PLATEIA").toUpperCase(), cardW * 0.44);
  doc.text(setorTruncado, startX + 6, boxTop + 8);

  const div1X = startX + cardW * 0.52;
  doc.setDrawColor(226, 232, 240);
  doc.line(div1X, boxTop + 2, div1X, boxTop + 12);

  const colFilaX = startX + cardW * 0.62;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("FILA", colFilaX, boxTop + 4, { align: "center" });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text((dados.fileira || "-").toUpperCase(), colFilaX, boxTop + 9.5, { align: "center" });

  const div2X = startX + cardW * 0.72;
  doc.line(div2X, boxTop + 2, div2X, boxTop + 12);

  const colAssentoX = startX + cardW * 0.84;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("ASSENTO", colAssentoX, boxTop + 4, { align: "center" });
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text(String(dados.assento || "-"), colAssentoX, boxTop + 9.5, { align: "center" });

  if (dados.portaAcesso) {
    doc.setDrawColor(226, 232, 240);
    doc.line(startX + 6, boxTop + 13, startX + cardW - 6, boxTop + 13);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.text("ENTRADA:", startX + 6, boxTop + 17);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(dados.portaAcesso, startX + 18, boxTop + 17);
  }

  let currentY = boxTop + boxHeight + 4;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("DATA E HORÁRIO", startX + 6, currentY);
  currentY += 3;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(`${dados.data}${dados.horario ? ` às ${dados.horario}` : ""}`, startX + 6, currentY);

  currentY += 4;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("LOCAL E CIDADE", startX + 6, currentY);
  currentY += 3;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  const teatroTexto = `${dados.teatro && dados.teatro !== "-" ? dados.teatro : "Teatro Principal"} — ${dados.cidade || "Praça"}`;
  const teatroLinhas = doc.splitTextToSize(teatroTexto, cardW - 12);
  doc.text(teatroLinhas, startX + 6, currentY);
  currentY += (teatroLinhas.length * 3) + 1;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("TITULAR DO BILHETE", startX + 6, currentY);
  currentY += 3;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(dados.titularNome || "Portador", startX + 6, currentY);

  const qrBase64 = await gerarQRCodeDataUrl(dados.codigoIngresso);
  if (qrBase64) {
    const qrSize = 20;
    doc.addImage(qrBase64, "PNG", startX + cardW / 2 - qrSize / 2, startY + cardH - 27, qrSize, qrSize);
  }

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.text(`CÓDIGO: ${dados.codigoIngresso}`, startX + cardW / 2, startY + cardH - 5, { align: "center" });

  doc.setLineDashPattern([1.5, 1], 0);
  doc.setDrawColor(203, 213, 225);
  doc.line(startX + 4, startY + cardH - 3, startX + cardW - 4, startY + cardH - 3);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "normal");
  doc.text("Apresente na portaria do teatro.", startX + cardW / 2, startY + cardH - 1.2, { align: "center" });
}

/**
 * Encontra a melhor foto disponível para o ingresso (incluindo fallbacks de storage do evento)
 */
function resolverBannerIngresso(dados: DadosIngresso): string | undefined {
  if (dados.bannerShowUrl && dados.bannerShowUrl.trim()) {
    return dados.bannerShowUrl;
  }
  if (typeof window !== "undefined") {
    // Tentar achar pelo mapa do evento
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("axis_mapa_evento_")) {
        try {
          const obj = JSON.parse(localStorage.getItem(k) || "{}");
          if (obj.imagemIngressoUrl) return obj.imagemIngressoUrl;
        } catch (e) {}
      }
    }
  }
  return undefined;
}

/**
 * Gera um arquivo PDF de bilhete individual ou múltiplos do mesmo titular
 */
export async function exportarIngressoPDF(dados: DadosIngresso | DadosIngresso[]): Promise<void> {
  const lista: DadosIngresso[] = Array.isArray(dados) ? dados : [dados];
  if (lista.length === 0) return;

  // Se for apenas 1 bilhete, gera formato vertical mobile (100mm x 220mm com folga completa)
  if (lista.length === 1) {
    const item = lista[0];
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 220]
    });

    const bannerUrl = resolverBannerIngresso(item);
    let bannerImg: ImgDimResult | null = null;
    if (bannerUrl) {
      bannerImg = await carregarImagemComDimensoes(bannerUrl);
    }

    await desenharCardIndividual(doc, item, 100, 220, bannerImg);

    const safeName = (item.titularNome || "Bilhete").replace(/[^a-zA-Z0-9]/g, "_");
    const nomeArquivo = `Ingresso_${item.codigoIngresso}_${safeName}.pdf`;
    doc.save(nomeArquivo);
    return;
  }

  // Se forem múltiplos ingressos do mesmo titular, gera folha A4 com todos agrupados!
  await exportarLoteIngressosFolhaA4(lista, lista[0]?.titularNome);
}

/**
 * Exporta múltiplos ingressos agrupados em uma folha A4 (até 4 ingressos por página)
 */
export async function exportarLoteIngressosFolhaA4(lista: DadosIngresso[], nomeTitular?: string): Promise<void> {
  if (!lista || lista.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4" // 210mm x 297mm
  });

  const bannerUrl = resolverBannerIngresso(lista[0]) || lista.find(i => i.bannerShowUrl)?.bannerShowUrl;
  let bannerImg: ImgDimResult | null = null;
  if (bannerUrl) {
    bannerImg = await carregarImagemComDimensoes(bannerUrl);
  }

  const cardW = 96;
  const cardH = 142;
  const marginX = 6;
  const marginY = 6;
  const gapX = 6;
  const gapY = 6;

  for (let i = 0; i < lista.length; i++) {
    const item = lista[i];
    const posOnPage = i % 4;

    if (i > 0 && posOnPage === 0) {
      doc.addPage();
    }

    const col = posOnPage % 2;
    const row = Math.floor(posOnPage / 2);

    const startX = marginX + col * (cardW + gapX);
    const startY = marginY + row * (cardH + gapY);

    await desenharCardEmFolhaA4(doc, item, startX, startY, cardW, cardH, bannerImg);
  }

  const safeName = (nomeTitular || lista[0]?.titularNome || "Ingressos").replace(/[^a-zA-Z0-9]/g, "_");
  const dataHoje = new Date().toISOString().split("T")[0];
  const nomeArquivo = `Folha_Ingressos_A4_${safeName}_${dataHoje}.pdf`;

  doc.save(nomeArquivo);
}
