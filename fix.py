import os
with open('src/routes/_authenticated/malas.$evento_id.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''          </div>\n        </div>\n      )}'''
replacement = '''          </div>\n          <div className="flex justify-center mt-8">\n            <Button onClick={handleAddExtraVolume} variant="outline" className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 h-14 rounded-2xl px-8 shadow-none">\n              <Luggage className="size-5 mr-2" />\n              Adicionar Nova Mala (Volume Extra)\n            </Button>\n          </div>\n        </div>\n      )}'''

content = content.replace(target, replacement)

with open('src/routes/_authenticated/malas.$evento_id.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
