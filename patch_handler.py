import sys

with open('src/components/RoadbookForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

upload_func = '''
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof RoadbookData) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('roadbooks').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('roadbooks').getPublicUrl(path);
      up(field, publicUrl);
      toast.success('Logo enviada!');
    } catch (err) {
      toast.error('Erro ao enviar logo.');
    }
  };
'''

if 'const handleImageUpload' not in c:
    c = c.replace('const up = (k: keyof RoadbookData, v: any) => {', upload_func + '\n  const up = (k: keyof RoadbookData, v: any) => {')
    with open('src/components/RoadbookForm.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
