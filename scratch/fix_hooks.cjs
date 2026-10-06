const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

// Remove from the IIFE
code = code.replace(/\{\(\(\) => \{\s*const location = useLocation\(\);\s*const SLink/, '{(() => {\n            const SLink');

// Put it at the top of AuthedRoute
code = code.replace(/function AuthedRoute\(\) \{/, 'function AuthedRoute() {\n  const location = useLocation();');

fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');
