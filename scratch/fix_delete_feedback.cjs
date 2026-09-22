const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/tour.index.tsx', 'utf8');

const oldStr = `const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else {
      toast.success("Turnê removida com sucesso");
      fetchTours();
    }`;

const newStr = `const { data, error } = await supabase.from('tours').delete().eq('id', id).select();
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else if (data && data.length === 0) {
      toast.error("Você não tem permissão para apagar esta turnê (foi criada por outro usuário).");
    } else {
      toast.success("Turnê removida com sucesso");
      fetchTours();
    }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/routes/_authenticated/tour.index.tsx', content, 'utf8');
