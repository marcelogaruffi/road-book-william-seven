const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/eventos.tsx', 'utf8');

if (!content.includes('LogoPicker')) {
    content = content.replace(
        'import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";',
        `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LogoPicker } from "@/components/LogoPicker";`
    );
}

if (!content.includes('const [logoPickerOpen, setLogoPickerOpen] = useState(false);')) {
    content = content.replace(
        'const [viewMode, setViewMode] = useState(false);',
        `const [viewMode, setViewMode] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);`
    );
}

const replacement = `<button type="button" disabled={viewMode} onClick={() => setLogoPickerOpen(true)} className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-accent h-12 w-full justify-center">
                  <Plus className="size-4" /> Anexar Logo
                </button>
                <LogoPicker
                  open={logoPickerOpen}
                  onOpenChange={setLogoPickerOpen}
                  onSelect={setProdutoraLogoUrl}
                  uploadPath="produtoras"
                />`;

content = content.replace(/<label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer hover:bg-accent h-12 w-full justify-center">[\s\S]*?<input type="file" disabled=\{viewMode\} accept="image\/\*" className="hidden" onChange=\{async \(e\) => \{[\s\S]*?\}\} \/>[\s\S]*?<\/label>/g, replacement);

fs.writeFileSync('src/routes/_authenticated/eventos.tsx', content, 'utf8');
console.log('Patched eventos.tsx');
