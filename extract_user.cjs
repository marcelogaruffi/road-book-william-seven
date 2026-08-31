
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('C:/Users/Marcelo Garuffi/.gemini/antigravity/brain/*/.system_generated/logs/transcript_full.jsonl');
for (const file of files) {
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT') {
          console.log('\n--- USER INPUT from ' + file.split('brain/')[1].split('/')[0] + ' ---');
          console.log(obj.content.substring(0, 500));
        }
      } catch(e){}
    }
  } catch(e) {}
}

