const fs = require('fs');
const path = require('path');

const replacements = {
    "Á¡": "á",
    "Á\x81": "Á",
    "Á¢": "â",
    "Á£": "ã",
    "Á§": "ç",
    "Á©": "é",
    "Áª": "ê",
    "Á\xad": "í",
    "Á³": "ó",
    "Á´": "ô",
    "Áµ": "õ",
    "Áº": "ú",
    "Á€": "À",
    "Á‚": "Â",
    "Áƒ": "Ã",
    "Á‡": "Ç",
    "Á‰": "É",
    "ÁŠ": "Ê",
    "Á\x8d": "Í",
    "Á“": "Ó",
    "Á”": "Ô",
    "Á•": "Õ",
    "Áš": "Ú",
    // Also the original ones that were missed:
    "Ã¡": "á",
    "Ã\x81": "Á",
    "Ã¢": "â",
    "Ã£": "ã",
    "Ã§": "ç",
    "Ã©": "é",
    "Ãª": "ê",
    "Ã\xad": "í",
    "Ã³": "ó",
    "Ã´": "ô",
    "Ãµ": "õ",
    "Ãº": "ú",
    "Ã€": "À",
    "Ã‚": "Â",
    "Ãƒ": "Ã",
    "Ã‡": "Ç",
    "Ã‰": "É",
    "ÃŠ": "Ê",
    "Ã\x8d": "Í",
    "Ã“": "Ó",
    "Ã”": "Ô",
    "Ã•": "Õ",
    "Ãš": "Ú",
    // and emojis?
    "ðŸŒŸ": "🌟",
    "Ã°Å¸Å½â€°": "🎉",
    "Ã°Å¸Å½â€š": "🎂",
    // specific broken Áxis
    "Á xis": "Áxis",
};

function search(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            for (let [bad, good] of Object.entries(replacements)) {
                content = content.split(bad).join(good);
            }
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed', fullPath);
            }
        }
    });
}
search('src');
