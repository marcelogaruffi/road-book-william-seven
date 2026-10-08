const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');

c = c.replace(
    'import { Users, LayoutDashboard, CalendarDays, KeyRound, Menu, LogOut, CheckSquare, Music, Wallet, ShoppingCart, UserPlus, Info, Phone, ClipboardList } from "lucide-react";',
    'import { Users, LayoutDashboard, CalendarDays, KeyRound, Menu, LogOut, CheckSquare, Music, Wallet, ShoppingCart, UserPlus, Info, Phone, ClipboardList, Layers } from "lucide-react";'
);
c = c.replace(
    '<SLink to="/padroes" icon={Settings} label="Padrões de Espetáculo" />',
    '<SLink to="/padroes" icon={Layers} label="Padrões de Espetáculo" />'
);

fs.writeFileSync('src/routes/_authenticated/route.tsx', c, 'utf8');
console.log("Fixed sidebar icon");
