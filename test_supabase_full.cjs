const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL="(.*?)"/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log('--- TESTE DE CONEXÃO E GRAVAÇÃO NO SUPABASE ---');
  
  // 1. Criar um usuário de teste (ou tentar logar se já existir)
  const testEmail = `teste_${Date.now()}@williamseven.com`;
  const testPassword = 'senha_super_secreta_123';
  
  console.log(`\n1. Criando usuário de teste temporário: ${testEmail}...`);
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authErr) {
    console.error('❌ Erro ao criar usuário:', authErr.message);
    return;
  }
  console.log('✅ Usuário criado e autenticado com sucesso!');

  // 2. Inserir um roadbook de teste
  console.log('\n2. Testando INCLUSÃO de um Roadbook...');
  const testSlug = `teste-automacao-${Date.now()}`;
  const payload = {
    espetaculo: "Espetáculo de Teste Supabase",
    cidade: "Cidade Teste",
    slug: testSlug,
    user_id: authData.user.id,
    automacoes: {
      hotel_extras: [
        {
          data: "2026-07-08",
          titulo: "Teste de gravação da programação",
          hora_inicio: "10:00"
        }
      ]
    }
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('roadbooks')
    .insert(payload)
    .select('id, slug, automacoes')
    .single();

  if (insertErr) {
    console.error('❌ Erro ao inserir:', insertErr.message);
    return;
  }
  console.log('✅ Roadbook criado com sucesso! ID:', insertData.id);

  // 3. Testar a ATUALIZAÇÃO (Adicionar um segundo item na programação)
  console.log('\n3. Testando ATUALIZAÇÃO (adicionando item na programação)...');
  const updatedPayload = {
    automacoes: {
      hotel_extras: [
        ...insertData.automacoes.hotel_extras,
        {
          data: "2026-07-08",
          titulo: "NOVO ITEM ATUALIZADO",
          hora_inicio: "14:00"
        }
      ]
    }
  };

  const { error: updateErr } = await supabase
    .from('roadbooks')
    .update(updatedPayload)
    .eq('id', insertData.id);

  if (updateErr) {
    console.error('❌ Erro ao atualizar:', updateErr.message);
    return;
  }

  // 4. Lendo novamente para confirmar se salvou
  console.log('\n4. Lendo do banco de dados para confirmar a gravação...');
  const { data: finalData, error: readErr } = await supabase
    .from('roadbooks')
    .select('automacoes')
    .eq('id', insertData.id)
    .single();

  if (readErr) {
    console.error('❌ Erro ao ler:', readErr.message);
    return;
  }

  const prog = finalData.automacoes.hotel_extras;
  if (Array.isArray(prog) && prog.length === 2) {
    console.log('✅ SUCESSO ABSOLUTO! O Supabase atualizou a programação perfeitamente.');
    console.log('Itens salvos no banco:', prog);
  } else {
    console.log('❌ FALHA MISTERIOSA: O Supabase não retornou os 2 itens esperados.', finalData);
  }

  // Limpeza
  console.log('\n5. Limpando os dados de teste...');
  await supabase.from('roadbooks').delete().eq('id', insertData.id);
  console.log('✅ Concluído.');

})();
