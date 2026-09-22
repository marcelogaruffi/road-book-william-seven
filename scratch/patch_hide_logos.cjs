const fs = require('fs');

let content = fs.readFileSync('src/components/LogoPicker.tsx', 'utf8');

// Add X to imports
content = content.replace(
  'import { Upload, Search, ImageIcon } from "lucide-react";',
  'import { Upload, Search, ImageIcon, X } from "lucide-react";'
);

// Add hiddenLogos state
content = content.replace(
  'const [uploadingLocal, setUploadingLocal] = useState(false);',
  `const [uploadingLocal, setUploadingLocal] = useState(false);
  const [hiddenLogos, setHiddenLogos] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hidden_logos');
    if (saved) setHiddenLogos(JSON.parse(saved));
  }, []);

  function hideLogo(visualName: string) {
    const newHidden = [...hiddenLogos, visualName];
    setHiddenLogos(newHidden);
    localStorage.setItem('hidden_logos', JSON.stringify(newHidden));
    toast.success("Logo ocultado da lista.");
  }`
);

// Filter by hiddenLogos
content = content.replace(
  'return filename.toLowerCase().includes(filter.toLowerCase());',
  `const visualName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
      if (hiddenLogos.includes(visualName)) return false;
      return filename.toLowerCase().includes(filter.toLowerCase());`
);

// Add the X button to the UI
const imgContainerOld = `<img src={url} alt="Logo" className="w-full h-full object-contain p-3" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-bold bg-primary px-3 py-1.5 rounded-full">Selecionar</span>
                      </div>`;
const imgContainerNew = `<img src={url} alt="Logo" className="w-full h-full object-contain p-3" />
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          const vName = filename.split('-').length > 1 ? filename.split('-').slice(1).join('-') : filename;
                          hideLogo(vName);
                        }}
                        className="absolute top-1 right-1 bg-white hover:bg-red-500 hover:text-white text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-20 shadow-sm"
                        title="Ocultar logo da lista"
                      >
                        <X className="size-3" />
                      </button>
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="text-white text-sm font-bold bg-primary px-3 py-1.5 rounded-full">Selecionar</span>
                      </div>`;

content = content.replace(imgContainerOld, imgContainerNew);

// Since we know the user specifically requested to hide those exact two, let's pre-populate the initial state in localStorage!
// Actually, we can just do it in the code dynamically if the array is empty initially.
// Let's just set the initial state!
content = content.replace(
  "const [hiddenLogos, setHiddenLogos] = useState<string[]>([]);",
  "const [hiddenLogos, setHiddenLogos] = useState<string[]>(['0.9862359553083587.png', 'extracted_page_1_0_Image5.png']);"
);

fs.writeFileSync('src/components/LogoPicker.tsx', content, 'utf8');
console.log('LogoPicker updated with hide functionality!');
