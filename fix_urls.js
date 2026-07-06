import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUrls() {
  const { data: roadbooks, error } = await supabase.from('roadbooks').select('id, automacoes, quartos, outros_contatos, festival_info, documentos, voo_ida, voo_volta, hotel_fotos, teatro_fotos, programacao');
  if (error) {
    console.error("Error fetching roadbooks:", error);
    return;
  }

  const fixArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => {
      if (item.path && item.url && item.url.includes('sign=')) {
        const { data } = supabase.storage.from('roadbook-docs').getPublicUrl(item.path);
        item.url = data.publicUrl;
      }
      return item;
    });
  };

  const fixVoos = (voo) => {
    if (!voo) return voo;
    if (voo.cartoes_embarque) voo.cartoes_embarque = fixArray(voo.cartoes_embarque);
    if (voo.outras_informacoes_fotos) voo.outras_informacoes_fotos = fixArray(voo.outras_informacoes_fotos);
    return voo;
  };

  for (const rb of roadbooks) {
    let updated = false;

    const newDocs = fixArray(rb.documentos);
    if (JSON.stringify(newDocs) !== JSON.stringify(rb.documentos)) { rb.documentos = newDocs; updated = true; }

    const newHotelFotos = fixArray(rb.hotel_fotos);
    if (JSON.stringify(newHotelFotos) !== JSON.stringify(rb.hotel_fotos)) { rb.hotel_fotos = newHotelFotos; updated = true; }

    const newTeatroFotos = fixArray(rb.teatro_fotos);
    if (JSON.stringify(newTeatroFotos) !== JSON.stringify(rb.teatro_fotos)) { rb.teatro_fotos = newTeatroFotos; updated = true; }

    const newVooIda = fixVoos(rb.voo_ida);
    if (JSON.stringify(newVooIda) !== JSON.stringify(rb.voo_ida)) { rb.voo_ida = newVooIda; updated = true; }

    const newVooVolta = fixVoos(rb.voo_volta);
    if (JSON.stringify(newVooVolta) !== JSON.stringify(rb.voo_volta)) { rb.voo_volta = newVooVolta; updated = true; }

    if (updated) {
      console.log(`Fixing URLs for roadbook ${rb.id}`);
      await supabase.from('roadbooks').update({
        documentos: rb.documentos,
        hotel_fotos: rb.hotel_fotos,
        teatro_fotos: rb.teatro_fotos,
        voo_ida: rb.voo_ida,
        voo_volta: rb.voo_volta
      }).eq('id', rb.id);
    }
  }

  console.log("Done fixing URLs");
}

fixUrls();
