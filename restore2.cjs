const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

const missingFuncs = `
  const addSomInputList = () => {
    const list = somData.input_list_tabela || [];
    const proximoCanal = (list.length + 1).toString();
    updateSomData('input_list_tabela', [...list, { id: Math.random().toString(36).substring(2, 9), canal: proximoCanal, equipamento: '', obs: '' }]);
  };

  const removeSomInputList = (id: string) => {
    const list = (somData.input_list_tabela || []).filter((e: any) => e.id !== id);
    updateSomData('input_list_tabela', list);
  };

  const updateSomInputList = (id: string, field: string, value: string) => {
    const list = (somData.input_list_tabela || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateSomData('input_list_tabela', list);
  };
`;

code = code.replace(
  "updateSomData('equipamentos_lista', list);\n  };",
  "updateSomData('equipamentos_lista', list);\n  };\n\n" + missingFuncs
);

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', code);
console.log('Done');
