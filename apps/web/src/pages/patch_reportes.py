import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Reportes.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# First replace imports
s_import = """import { getColaCompras, getDiesel, type FilaCompras } from '../lib/api'"""
s_import_new = """import { getColaCompras, getDiesel, getReporte, type FilaCompras } from '../lib/api'"""
content = content.replace(s_import, s_import_new)

# Replace the entire render body. Wait, `exportarDiesel` and others are there.
# Let's replace the whole component. I'll write a Python script that just rewrites it.
# It's cleaner to rewrite the whole file because there are 4 static reports to add.
