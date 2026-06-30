import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnv(key) {
  let c1 = []; try { c1 = fs.readFileSync('.env.local', 'utf8').split('\n'); } catch {}
  let c2 = []; try { c2 = fs.readFileSync('.env', 'utf8').split('\n'); } catch {}
  const lines = [...c1, ...c2];
  for (const l of lines) {
    if (l.startsWith(key + '=')) return l.split('=')[1].trim().replace(/^"/, '').replace(/"$/, '');
  }
  return null;
}

const OLD_URL = getEnv('VITE_SUPABASE_URL');
const OLD_ANON = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

const NEW_URL = "https://vaavzyudbxqcmtlbposs.supabase.co";
const NEW_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhYXZ6eXVkYnhxY210bGJwb3NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA2NzA3OCwiZXhwIjoyMDk3NjQzMDc4fQ.crft7vw8Fp_oxWZmN-p5VAkkONdJCitGd5RGlcekMBA";

const oldSupa = createClient(OLD_URL, OLD_ANON);
const newSupa = createClient(NEW_URL, NEW_SERVICE);

async function run() {
  console.log("🚀 Iniciando migração...");

  // 1. Migrar Tours
  console.log("📦 Baixando Tours...");
  const { data: tours, error: errT } = await oldSupa.from('tours').select('*');
  if (errT) throw errT;
  console.log(`Encontrados ${tours.length} tours.`);
  if (tours.length > 0) {
    const { error: errInsT } = await newSupa.from('tours').insert(tours);
    if (errInsT) throw errInsT;
    console.log("✅ Tours inseridos!");
  }

  // 2. Migrar Roadbooks
  console.log("📦 Baixando Roadbooks...");
  const { data: rbs, error: errR } = await oldSupa.from('roadbooks').select('*');
  if (errR) throw errR;
  console.log(`Encontrados ${rbs.length} roadbooks.`);
  if (rbs.length > 0) {
    const { error: errInsR } = await newSupa.from('roadbooks').insert(rbs);
    if (errInsR) throw errInsR;
    console.log("✅ Roadbooks inseridos!");
  }

  // 3. Migrar Arquivos
  console.log("🖼️ Analisando arquivos anexos...");
  const pathsToMigrate = new Set();
  
  for (const rb of rbs) {
    const checkArray = (arr) => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item && typeof item === 'object' && item.path) {
            pathsToMigrate.add(item.path);
          }
        });
      }
    };
    checkArray(rb.hotel_fotos);
    checkArray(rb.teatro_fotos);
    checkArray(rb.documentos);
    checkArray(rb.voo_ida?.cartoes_embarque);
    checkArray(rb.voo_volta?.cartoes_embarque);
  }

  const paths = Array.from(pathsToMigrate);
  console.log(`Encontrados ${paths.length} arquivos para migrar.`);
  
  let successCount = 0;
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    console.log(`Migrando arquivo ${i + 1}/${paths.length}: ${p}`);
    
    // Download
    const { data: fileData, error: dlErr } = await oldSupa.storage.from('roadbook-docs').download(p);
    if (dlErr) {
      console.warn(`⚠️ Erro ao baixar ${p}:`, dlErr.message);
      continue;
    }
    
    // Upload
    const { error: ulErr } = await newSupa.storage.from('roadbook-docs').upload(p, fileData, { upsert: true });
    if (ulErr) {
      console.warn(`⚠️ Erro ao subir ${p}:`, ulErr.message);
      continue;
    }
    successCount++;
  }
  console.log(`✅ Arquivos migrados com sucesso: ${successCount}/${paths.length}`);
  console.log("🎉 MIGRAÇÃO CONCLUÍDA!");
}

run().catch(console.error);
