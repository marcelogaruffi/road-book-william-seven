import os

filepath = 'src/routes/_authenticated/publico.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ADD RECHARTS IMPORT
import_recharts = '''import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";\n'''

if 'import { PieChart' not in content:
    content = content.replace('import { saveAs } from "file-saver";', 'import { saveAs } from "file-saver";\n' + import_recharts)

# CALCULATIONS BEFORE RENDER
calcs = '''
  // Calculations for charts and summary
  const totalsByActivity = registros.reduce((acc, r) => {
    if (!r.atividade) return acc;
    if (!acc[r.atividade]) acc[r.atividade] = 0;
    acc[r.atividade] += (r.publico_presente || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieActivityData = Object.keys(totalsByActivity).map(key => ({
    name: key,
    value: totalsByActivity[key]
  })).filter(item => item.value > 0);

  const ageDataMap = registros.reduce((acc, r) => {
    if (r.publico_majoritario && r.publico_majoritario.length > 0) {
      r.publico_majoritario.forEach((idade: string) => {
        if (!acc[idade]) acc[idade] = 0;
        acc[idade] += 1; // Frequency of events with this age group
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const pieAgeData = Object.keys(ageDataMap).map(key => ({
    name: key,
    value: ageDataMap[key]
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#6366f1'];

  return (
'''

content = content.replace('  return (\n    <div className="space-y-6', calcs + '    <div className="space-y-6')

# ADD CHARTS AND SUMMARY BELOW TABLE CARD
charts_ui = '''
      {registros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Total por Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {Object.entries(totalsByActivity).sort((a, b) => b[1] - a[1]).map(([ativ, total], idx) => (
                <div key={ativ} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{ativ}</span>
                  </div>
                  <span className="font-black text-xl text-slate-900 dark:text-white">{total.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Público por Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {pieActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieActivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieActivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Sem dados numéricos suficientes</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg dark:bg-card/40 rounded-[2rem] overflow-hidden md:col-span-1">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle className="text-lg font-bold">Frequência por Idade</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {pieAgeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieAgeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieAgeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value + ' vezes'} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Sem faixas etárias selecionadas</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
'''

content = content.replace('      </Card>\n    </div>\n  );\n}', '      </Card>\n' + charts_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("publico.tsx updated")
