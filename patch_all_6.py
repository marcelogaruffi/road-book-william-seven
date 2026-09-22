import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"No changes (pattern not found) in {filepath}")

# 1. Import EstoqueGlobalTab
imports = '''import { Route as AuthedRoute } from "./route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MalasTemplateTab } from '@/components/MalasTemplateTab';
import { EstoqueGlobalTab } from '@/components/EstoqueGlobalTab';'''
modify_file('src/routes/_authenticated/malas.index.tsx', r'import \{ Route as AuthedRoute \} from "\./route";\s*import \{ Tabs, TabsContent, TabsList, TabsTrigger \} from "@/components/ui/tabs";\s*import \{ MalasTemplateTab \} from \'@/components/MalasTemplateTab\';', imports)

# 2. Add Tab Trigger and Content
tabs = '''      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1">
          <TabsTrigger value="eventos" className="rounded-lg h-full font-bold">Eventos (Checklist)</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
          <TabsTrigger value="estoque" className="rounded-lg h-full font-bold">Estoque Global</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="space-y-8 mt-8">'''
modify_file('src/routes/_authenticated/malas.index.tsx', r'<Tabs defaultValue="eventos" className="w-full">\s*<TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1">\s*<TabsTrigger value="eventos" className="rounded-lg h-full font-bold">Eventos \(Checklist\)</TabsTrigger>\s*<TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos \(Padr.*?o\)</TabsTrigger>\s*</TabsList>\s*<TabsContent value="eventos" className="space-y-8 mt-8">', tabs)

tab_content = '''        <TabsContent value="modelos" className="mt-0">
          <MalasTemplateTab />
        </TabsContent>

        <TabsContent value="estoque" className="mt-0">
          <EstoqueGlobalTab />
        </TabsContent>'''
modify_file('src/routes/_authenticated/malas.index.tsx', r'<TabsContent value="modelos" className="mt-0">\s*<MalasTemplateTab />\s*</TabsContent>', tab_content)

