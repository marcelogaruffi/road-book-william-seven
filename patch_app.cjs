try {
    const fs = require('fs');
    let content = fs.readFileSync('app.html', 'utf8');
    content = content.replace('Áxis - Gestão para Teatros e Shows', 'Áxis - Gestão para Teatros e Shows');
    fs.writeFileSync('app.html', content, 'utf8');
    console.log("Success");
} catch(e) {
    console.log("Error:", e);
}

