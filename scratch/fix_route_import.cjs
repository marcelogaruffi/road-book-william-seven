const fs = require('fs');
let code = fs.readFileSync('src/routes/_authenticated/route.tsx', 'utf8');
code = code.replace(/import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack\/react-router";/, 'import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";');
fs.writeFileSync('src/routes/_authenticated/route.tsx', code, 'utf8');
