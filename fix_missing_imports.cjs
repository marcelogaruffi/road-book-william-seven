const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
c = 'import { ClipboardList, Drama, DoorOpen, Banknote, ShoppingCart, LogOut, Sun, Moon, ChevronRight, Menu, ChevronDown, Plus } from "lucide-react";\\n' + c;
fs.writeFileSync('src/routes/_authenticated/route.tsx', c);
