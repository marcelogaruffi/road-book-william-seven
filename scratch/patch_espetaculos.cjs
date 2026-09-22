const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/espetaculos.tsx', 'utf8');

if (!content.includes('LogoPicker')) {
    content = content.replace(
        'import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";',
        `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { LogoPicker } from "@/components/LogoPicker";`
    );
}

if (!content.includes('logoPickerOpen')) {
    content = content.replace(
        'const [logoHover, setLogoHover] = useState<{esp: boolean, cia: boolean}>({esp: false, cia: false});',
        `const [logoHover, setLogoHover] = useState<{esp: boolean, cia: boolean}>({esp: false, cia: false});
  const [logoPickerOpen, setLogoPickerOpen] = useState<{open: boolean, field: 'logo_espetaculo_url' | 'logo_cia_url' | null}>({open: false, field: null});`
    );
}

content = content.replace(
    /<input type="file" accept="image\/\*" onChange=\{e => uploadLogo\(e, "logo_espetaculo_url"\)\} className="absolute inset-0 opacity-0 cursor-pointer" \/>/g,
    `<button type="button" onClick={() => setLogoPickerOpen({open: true, field: "logo_espetaculo_url"})} className="absolute inset-0 opacity-0 cursor-pointer" />`
);

content = content.replace(
    /<input type="file" accept="image\/\*" onChange=\{e => uploadLogo\(e, "logo_cia_url"\)\} className="absolute inset-0 opacity-0 cursor-pointer" \/>/g,
    `<button type="button" onClick={() => setLogoPickerOpen({open: true, field: "logo_cia_url"})} className="absolute inset-0 opacity-0 cursor-pointer" />`
);

if (!content.includes('<LogoPicker')) {
    content = content.replace(
        '</Dialog>',
        `</Dialog>
      <LogoPicker
        open={logoPickerOpen.open}
        onOpenChange={(open) => setLogoPickerOpen(s => ({ ...s, open }))}
        onSelect={(url) => {
          if (logoPickerOpen.field === 'logo_espetaculo_url') {
             setLogoEspetaculo(url);
          } else if (logoPickerOpen.field === 'logo_cia_url') {
             setLogoCia(url);
          }
        }}
        uploadPath="logos"
      />`
    );
}

fs.writeFileSync('src/routes/_authenticated/espetaculos.tsx', content, 'utf8');
console.log('Patched espetaculos.tsx');
