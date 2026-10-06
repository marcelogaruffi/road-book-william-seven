const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

const regex = /([ \t]*)\}\)\}\r?\n([ \t]*)<\/div>\r?\n([ \t]*)<\/div>\r?\n([ \t]*)\)\}\r?\n([ \t]*)<\/div>\r?\n\s*\);\r?\n\}/;
if (code.match(regex)) {
  code = code.replace(regex, `$1})}\n$2</div>\n$3</div>\n$4)}\n$5</div>\n$5  </TabsContent>\n$5  <TabsContent value="modelos" className="mt-0">\n$5    <MalasTemplateTab />\n$5  </TabsContent>\n$5</Tabs>\n$5</>\n  );\n}`);
} else {
  // alternative:
  const fallbackRegex = /([ \t]*)\)\}\r?\n([ \t]*)<\/div>\r?\n\s*\);\r?\n\}/;
  if (code.match(fallbackRegex)) {
    code = code.replace(fallbackRegex, `$1)}\n$2</div>\n$2  </TabsContent>\n$2  <TabsContent value="modelos" className="mt-0">\n$2    <MalasTemplateTab />\n$2  </TabsContent>\n$2</Tabs>\n$2</>\n  );\n}`);
  }
}

fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
