const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/catering.index.tsx', 'utf8');
c = c.replace('              </TabsContent>\r\n            </Tabs>', '              </TabsContent>\r\n              <TabsContent value="padrao">\r\n                <div className="bg-white p-6 border rounded-2xl shadow-sm">\r\n                  <CateringPadraoTab />\r\n                </div>\r\n              </TabsContent>\r\n            </Tabs>');
c = c.replace('              </TabsContent>\n            </Tabs>', '              </TabsContent>\n              <TabsContent value="padrao">\n                <div className="bg-white p-6 border rounded-2xl shadow-sm">\n                  <CateringPadraoTab />\n                </div>\n              </TabsContent>\n            </Tabs>');
fs.writeFileSync('src/routes/_authenticated/catering.index.tsx', c);
