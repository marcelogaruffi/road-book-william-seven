const fs = require('fs');
let c = fs.readFileSync('src/components/CateringPadraoTab.tsx', 'utf8');

c = c.replace(
    'export function CateringPadraoTab() {',
    'export function CateringPadraoTab({ espetaculoNome }: { espetaculoNome?: string }) {'
);

c = c.replace(
    'const [selectedEspetaculo, setSelectedEspetaculo] = useState("");',
    'const [selectedEspetaculo, setSelectedEspetaculo] = useState(espetaculoNome || "");'
);

c = c.replace(
    'useEffect(() => {',
    'useEffect(() => { if (espetaculoNome) setSelectedEspetaculo(espetaculoNome); }, [espetaculoNome]);\n\n  useEffect(() => {'
);

c = c.replace(
    '<div className="flex gap-4 items-center">',
    '{!espetaculoNome && (\n      <div className="flex gap-4 items-center">'
);

c = c.replace(
    '</SelectContent>\n        </Select>\n\n        {selectedEspetaculo',
    '</SelectContent>\n        </Select>\n      </div>\n      )}\n\n      <div className="flex gap-4 items-center justify-end">\n        {selectedEspetaculo'
);

fs.writeFileSync('src/components/CateringPadraoTab.tsx', c, 'utf8');
console.log("Patched Catering");
