const fs = require('fs');

function fixFile(file, classToFind) {
    let c = fs.readFileSync(file, 'utf8');
    
    // Check if the file has the unclosed condition
    if (c.includes('{!espetaculoNome && (')) {
        // Look for the end of the col-span-1 block and the start of the col-span-2/3 block
        const regex = new RegExp(`</CardContent>\\s*</Card>\\s*</div>\\s*<div className="${classToFind}">`);
        if (regex.test(c)) {
            c = c.replace(regex, `</CardContent>\n        </Card>\n      </div>\n      )}\n\n      <div className={espetaculoNome ? "" : "${classToFind}"}>`);
            fs.writeFileSync(file, c, 'utf8');
            console.log("Fixed " + file);
        } else {
            console.log("Regex not matched in " + file);
        }
    }
}

fixFile('src/components/MalasTemplateTab.tsx', 'lg:col-span-2');
fixFile('src/components/TemplateRidersTab.tsx', 'lg:col-span-2');
fixFile('src/components/som-operacao/TemplateCuesTab.tsx', 'xl:col-span-3');

