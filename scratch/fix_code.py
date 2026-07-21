import os

filepath = 'src/routes/_authenticated/iluminacao.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicated handleCreateOrEdit block
content = content.replace('''    if (!error && data) {
      window.location.href = `/iluminacao/${evento.id}`;
    } else {
      toast.error("Erro ao iniciar mapa: " + (error?.message || "Desconhecido"));
      console.error("Erro ao iniciar mapa:", error);
    }
  };

    if (!error && data) {
      window.location.href = `/iluminacao/${evento.id}`;
    } else {
      toast.error("Erro ao iniciar mapa: " + (error?.message || "Desconhecido"));
      console.error("Erro ao iniciar mapa:", error);
    }
  };''', '''    if (!error && data) {
      window.location.href = `/iluminacao/${evento.id}`;
    } else {
      toast.error("Erro ao iniciar mapa: " + (error?.message || "Desconhecido"));
      console.error("Erro ao iniciar mapa:", error);
    }
  };''')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

filepath_som = 'src/routes/_authenticated/som.tsx'
with open(filepath_som, 'r', encoding='utf-8') as f:
    content_som = f.read()

content_som = content_som.replace('''    // Criar novo registro
    const { data, error } = await supabase.from('mapas_som').insert({
      evento_id: evento.id,''', '''    const { data: userData } = await supabase.auth.getUser();
    
    // Criar novo registro
    const { data, error } = await supabase.from('mapas_som').insert({
      evento_id: evento.id,
      user_id: userData.user?.id,''')

with open(filepath_som, 'w', encoding='utf-8') as f:
    f.write(content_som)
