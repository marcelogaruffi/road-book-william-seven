const fs = require('fs');

const files = [
  { index: 'som.index.tsx', id: 'som.$evento_id.tsx', template: '<TemplateRiderSomViewer role={role} />', import: 'import TemplateRiderSomViewer from "@/components/TemplateRiderSomViewer";' },
  { index: 'video.index.tsx', id: 'video.$evento_id.tsx', template: '<TemplateRidersTab role={role} context="video" />', import: 'import TemplateRidersTab from "@/components/TemplateRidersTab";' },
  { index: 'iluminacao.index.tsx', id: 'iluminacao.$evento_id.tsx', template: '<TemplateRidersTab role={role} context="luz" />', import: 'import TemplateRidersTab from "@/components/TemplateRidersTab";' },
  { index: 'som-operacao.index.tsx', id: 'som-operacao.$evento_id.tsx', template: '<TemplateCuesTab role={role} />', import: 'import { TemplateCuesTab } from "@/components/som-operacao/TemplateCuesTab";' },
  { index: 'malas.index.tsx', id: 'malas.$evento_id.tsx', template: '<MalasTemplateTab />', import: 'import { MalasTemplateTab } from "@/components/MalasTemplateTab";' }
];

for (const f of files) {
  let idCode = fs.readFileSync('src/routes/_authenticated/' + f.id, 'utf8');
  
  // Inject `const { profile } = Route.useRouteContext();` and `const role = profile?.role;`
  if (f.template.includes('role={role}') && !idCode.includes('profile?.role')) {
    idCode = idCode.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n  const { profile } = Route.useRouteContext();\n  const role = profile?.role || null;');
  }
  
  fs.writeFileSync('src/routes/_authenticated/' + f.id, idCode, 'utf8');
}
