  const exportRestricoesExcel = async () => {
    toast.info("Gerando Excel das Restrições...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Restrições Alimentares');

      worksheet.columns = [
        { key: 'nome', width: 30 },
        { key: 'funcao', width: 20 },
        { key: 'restricao', width: 50 }
      ];

      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:C1');
        worksheet.getCell('B1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = `Restrições Alimentares - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }

      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Integrante', 'Função', 'Restrição Alimentar'];
      headerRow.font = { bold: true };

      let currentRow = headerRowNumber + 1;
      equipePerfis.forEach(p => {
        const row = worksheet.getRow(currentRow);
        row.values = [p.nome, p.role, p.restricao_alimentar || 'Nenhuma restrição'];
        currentRow++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Restricoes_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao exportar Excel");
      console.error(e);
    }
  };

  const exportCardapioExcel = async () => {
    toast.info("Gerando Excel do Cardápio...");
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cardápio Catering');

      worksheet.columns = [
        { key: 'ordem', width: 10 },
        { key: 'produto', width: 40 },
        { key: 'quantidade', width: 20 },
        { key: 'destino', width: 40 }
      ];

      let headerRowNumber = 1;
      const logoData = await getLogoBase64AndImg();
      if (logoData) {
        const imageId = workbook.addImage({ base64: logoData.base64, extension: 'png' });
        worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('B1:D1');
        worksheet.getCell('B1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('B1').font = { size: 16, bold: true };
        worksheet.getCell('B1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      } else {
        worksheet.getRow(1).height = 60;
        worksheet.mergeCells('A1:D1');
        worksheet.getCell('A1').value = `Cardápio de Catering - ${eventoFull?.espetaculo || ''}`;
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
        headerRowNumber = 3;
      }

      const headerRow = worksheet.getRow(headerRowNumber);
      headerRow.values = ['Item', 'Produto', 'Qtd / Unidade', 'Destino (Camarins)'];
      headerRow.font = { bold: true };

      let currentRow = headerRowNumber + 1;
      cateringItens.forEach((c, idx) => {
        const row = worksheet.getRow(currentRow);
        row.values = [
          idx + 1,
          c.produto,
          c.quantidade ? `${c.quantidade} ${c.unidade}` : `-`,
          c.camarins?.length > 0 ? c.camarins.join(', ') : 'Geral'
        ];
        currentRow++;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = `Cardapio_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');
      saveAs(new Blob([buffer]), `${safeName}.xlsx`);
      toast.success("Excel gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no Excel");
      console.error(err);
    }
  };

  const drawHeaderPDF = (doc: jsPDF, title: string, logoData: {base64: string, width: number, height: number} | null) => {
    let y = 15;
    if (logoData) {
      const imgWidth = 40;
      const imgHeight = (logoData.height / logoData.width) * imgWidth;
      doc.addImage(logoData.base64, 'PNG', 14, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Espetáculo: ${eventoFull?.espetaculo || '-'}`, 14, y);
    y += 6;
    if (eventoFull?.data) {
       doc.text(`Data: ${new Date(eventoFull.data + 'T12:00:00').toLocaleDateString('pt-BR')}`, 14, y);
       y += 6;
    }
    if (eventoFull?.local || eventoFull?.cidade) {
       doc.text(`Local: ${eventoFull.local || ''} - ${eventoFull.cidade || ''}`, 14, y);
       y += 6;
    }
    y += 6;
    return y;
  };

  const exportRestricoesPDF = async () => {
    toast.info("Gerando PDF das Restrições...");
    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let y = drawHeaderPDF(doc, "Restrições Alimentares da Equipe", logoData);

      const restricoesData = equipePerfis.map(p => [
        p.nome,
        p.role.toUpperCase(),
        p.restricao_alimentar || 'Nenhuma restrição'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Integrante', 'Função', 'Restrição Alimentar']],
        body: restricoesData,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } }
      });

      const safeName = `Restricoes_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');
      doc.save(`${safeName}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
      console.error(err);
    }
  };

  const exportCardapioPDF = async () => {
    toast.info("Gerando PDF do Cardápio...");
    try {
      const doc = new jsPDF();
      const logoData = await getLogoBase64AndImg();
      let y = drawHeaderPDF(doc, "Cardápio de Catering", logoData);

      const cardapioData = cateringItens.map((c, idx) => [
        (idx + 1).toString(),
        c.produto,
        c.quantidade ? `${c.quantidade} ${c.unidade}` : `-`,
        c.camarins?.length > 0 ? c.camarins.join(', ') : 'Geral'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Item', 'Produto', 'Qtd', 'Destino (Camarins)']],
        body: cardapioData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 30 }, 3: { cellWidth: 60 } }
      });

      const safeName = `Cardapio_${eventoFull?.espetaculo || 'Evento'}_${eventoFull?.cidade || ''}`.replace(/[^a-zA-Z0-9_ -]/g, '_');
      doc.save(`${safeName}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro no PDF");
      console.error(err);
    }
  };
