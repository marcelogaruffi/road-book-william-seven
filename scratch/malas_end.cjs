const fs = require('fs');

let code = fs.readFileSync('src/routes/_authenticated/malas.$evento_id.tsx', 'utf8');

const endBlock = `      )}
    </div>
  );
}`;

const replacement = `      )}
          </div>
        </TabsContent>
        <TabsContent value="modelos" className="mt-0">
          <MalasTemplateTab />
        </TabsContent>
      </Tabs>
    </>
  );
}`;

code = code.replace(endBlock, replacement);

fs.writeFileSync('src/routes/_authenticated/malas.$evento_id.tsx', code, 'utf8');
