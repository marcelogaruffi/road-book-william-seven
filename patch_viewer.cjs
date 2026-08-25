const fs = require('fs');
let code = fs.readFileSync('src/components/TemplateRiderSomViewer.tsx', 'utf8');

const oldMap = `anexos.map((url: string, index: number) => (
                      <a 
                        key={index} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-bold text-sm truncate"
                      >
                        <LinkIcon className="size-4 shrink-0" /> 
                        Ver Arquivo {index + 1}
                      </a>
                    ))`;

const newMap = `anexos.map((anexo: any, index: number) => {
                      const url = typeof anexo === 'string' ? anexo : anexo.url;
                      const nome = typeof anexo === 'string' ? \`Arquivo \${index + 1}\` : anexo.nome;
                      return (
                        <a 
                          key={index} 
                          href={url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-bold text-sm truncate"
                        >
                          <LinkIcon className="size-4 shrink-0" /> 
                          {nome}
                        </a>
                      );
                    })`;

let normalizedCode = code.replace(/\r\n/g, '\n');
let normalizedOld = oldMap.replace(/\r\n/g, '\n');

if (normalizedCode.includes(normalizedOld)) {
  code = normalizedCode.replace(normalizedOld, newMap);
  fs.writeFileSync('src/components/TemplateRiderSomViewer.tsx', code);
  console.log('TemplateRiderSomViewer patched');
} else {
  console.log('Failed to patch TemplateRiderSomViewer');
}
