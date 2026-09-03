import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\components\AppLayout.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if "{ id: 'admin', label: 'Admin' }" not in content:
    content = content.replace("{ id: 'reportes', label: 'Reportes' },", "{ id: 'reportes', label: 'Reportes' },\n  { id: 'admin', label: 'Admin' },")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated AppLayout.tsx")
