const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'public/gerador_sql_supabase.xlsx');
  console.log('Reading file:', filePath);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const policiais = data.map(row => {
    // Attempt to match keys flexibly
    const getVal = (possibleKeys) => {
      for (const k of possibleKeys) {
        if (row[k] !== undefined) return String(row[k]);
      }
      return '';
    };

    const rawId = row['Id'] !== undefined ? row['Id'] : (row['id'] !== undefined ? row['id'] : row['ID']);
    const parsedId = rawId !== undefined && rawId !== null ? Number(rawId) : undefined;

    return {
      ...(parsedId !== undefined && !isNaN(parsedId) ? { id: parsedId } : {}),
      rg: getVal(['rg', 'RG', 'Rg', 'matricula']),
      nome: getVal(['nome', 'Nome', 'NOME']),
      nomeGuerra: getVal(['nome_guerra', 'nomeGuerra', 'Nome de Guerra', 'NOME_GUERRA']),
      postoGrad: getVal(['P/G', 'p/g', 'posto_grad', 'postoGrad', 'Posto/Graduação', 'POSTO_GRAD'])
    };
  });

  const output = `// Arquivo gerado automaticamente a partir de gerador_sql_supabase.xlsx
export const POLICIAIS = ${JSON.stringify(policiais, null, 2)};
`;

  const outputPath = path.join(__dirname, 'src/data/policiais.js');
  fs.writeFileSync(outputPath, output);
  console.log('policiais.js updated successfully! Total records:', policiais.length);
} catch (e) {
  console.error('Error during conversion:', e.message);
}
