import re

with open('src/routes/_authenticated/financeiro.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
if 'import ExcelJS' not in content:
    content = content.replace(
        'import { format } from "date-fns";\nimport { ptBR } from "date-fns/locale";',
        'import { format } from "date-fns";\nimport { ptBR } from "date-fns/locale";\nimport ExcelJS from "exceljs";\nimport { saveAs } from "file-saver";'
    )

# 2. Replace exportDirectory
old_export = """  const exportDirectory = () => {
    let csv = 'Nome,Role,CPF,Telefone,CEP,Logradouro,Numero,Complemento,Cidade,Estado,Banco_Codigo,Agencia,Conta,Pix_Tipo,Pix_Chave\\n';
    profiles.forEach(p => {
      const row = [
        p.nome, p.role, p.cpf, p.telefone, p.endereco_cep, p.endereco_logradouro, p.endereco_numero,
        p.endereco_complemento, p.endereco_cidade, p.endereco_estado, p.banco_codigo, p.banco_agencia,
        p.banco_conta, p.pix_tipo, p.pix_chave
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',');
      csv += row + '\\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `diretorio_contatos_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };"""

new_export = """  const exportDirectory = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Diretório de Contatos");

    let logoBase64;
    try {
      const response = await fetch('/logo-seven.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
    } catch (e) {
      console.warn("Logo não carregado", e);
    }

    let imgHeightExcel = 70;
    const imgWidthExcel = 140;
    if (logoBase64) {
      const img = new Image();
      img.src = logoBase64;
      await new Promise((res) => { img.onload = res; });
      imgHeightExcel = (img.naturalHeight / img.naturalWidth) * imgWidthExcel;
    }

    worksheet.getColumn(1).width = 30; // Nome
    worksheet.getColumn(2).width = 15; // Função
    worksheet.getColumn(3).width = 18; // CPF
    worksheet.getColumn(4).width = 15; // Telefone
    worksheet.getColumn(5).width = 30; // Endereço
    worksheet.getColumn(6).width = 25; // Dados Bancários

    const headerRowNumber = logoBase64 ? 6 : 1;

    if (logoBase64) {
      const imageId = workbook.addImage({ base64: logoBase64, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: imgWidthExcel, height: imgHeightExcel } });
      worksheet.mergeCells('D1:F4');
      worksheet.getCell('D1').value = 'Diretório de Contatos e Pagamentos';
      worksheet.getCell('D1').font = { size: 16, bold: true, color: { argb: "FF0f172a" } };
      worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'left' };
    }

    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.values = ["Nome", "Função", "CPF", "Telefone", "Endereço Completo", "Dados Bancários (Pix / Conta)"];
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf1f5f9' } };
      cell.font = { bold: true, color: { argb: 'FF334155' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFcbd5e1' } },
        bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } }
      };
    });

    profiles.forEach((p, index) => {
      const row = worksheet.getRow(headerRowNumber + 1 + index);
      const enderecoStr = [p.endereco_logradouro, p.endereco_numero, p.endereco_complemento, p.endereco_cidade, p.endereco_estado, p.endereco_cep].filter(Boolean).join(', ');
      
      let bancoStr = '';
      if (p.pix_chave) {
        bancoStr += `PIX (${p.pix_tipo}): ${p.pix_chave}`;
      }
      if (p.banco_codigo) {
        if (bancoStr) bancoStr += ' | ';
        bancoStr += `Banco: ${p.banco_codigo} Ag: ${p.banco_agencia} C/C: ${p.banco_conta}`;
      }

      row.values = [
        p.nome || '',
        p.role ? p.role.toUpperCase() : '',
        p.cpf || '',
        p.telefone || '',
        enderecoStr,
        bancoStr
      ];
      
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFe2e8f0' } } };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Diretorio_Contatos_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };"""

content = content.replace(old_export, new_export)

with open('src/routes/_authenticated/financeiro.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Financeiro patched successfully")
