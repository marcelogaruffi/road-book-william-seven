import re

def modify_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")
    else:
        print(f"No changes (pattern not found) in {filepath}")

# espetaculos.tsx filter
espetaculos_fetch = '''    async function fetchEspetaculos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("templates_espetaculos")
        .select("*")
        .neq("nome_espetaculo", "ESTOQUE_GLOBAL")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);'''
modify_file('src/routes/_authenticated/espetaculos.tsx', r'async function fetchEspetaculos\(\) \{\s*setLoading\(true\);\s*const \{ data, error \} = await supabase\s*\.from\("templates_espetaculos"\)\s*\.select\("\*"\)\s*\.order\("created_at", \{ ascending: false \}\);\s*if \(error\) toast\.error\(error\.message\);', espetaculos_fetch)
