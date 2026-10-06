const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/dashboard.tsx', 'utf8');

const originalDaysUntil = `const daysUntil = Math.ceil((getRoadbookStartDateTime(nextEvent).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));`;

const newCode = `const daysUntil = Math.ceil((getRoadbookStartDateTime(nextEvent).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isNaN(daysUntil)) {
        return { 
          title: \`Tudo no esquema, \${firstName}.\`, 
          sub: \`Nosso próximo compromisso será em \${nextEvent.cidade}, em breve. Aproveite o tempo para organizar os detalhes!\`, 
          icon: MapPin, 
          color: 'from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950', 
          link: profile?.role === 'motorista' ? \`/versao-motorista/\${nextEvent.slug}\` : \`/rb/\${nextEvent.slug}\`, 
          btnText: 'Ver Detalhes do Roteiro' 
        };
      }`;

content = content.replace(originalDaysUntil, newCode);

fs.writeFileSync('src/routes/_authenticated/dashboard.tsx', content, 'utf8');
