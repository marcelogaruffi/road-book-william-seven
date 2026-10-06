const { execSync } = require('child_process');

// 1. Restore all
execSync('git restore src/routes/_authenticated/som.$evento_id.tsx src/routes/_authenticated/video.$evento_id.tsx src/routes/_authenticated/iluminacao.$evento_id.tsx src/routes/_authenticated/som-operacao.$evento_id.tsx src/routes/_authenticated/malas.$evento_id.tsx');

// 2. Run previous fixes
execSync('node scratch/fix_eq.cjs');
execSync('node scratch/fix_single.cjs');
execSync('node scratch/refactor_tabs.cjs');
execSync('node scratch/inject_role.cjs');
execSync('node scratch/redirect_save_safe.cjs');
execSync('node scratch/replace_viewer.cjs');
execSync('node scratch/fix_malas_manual.cjs');
