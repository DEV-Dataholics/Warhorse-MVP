import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OrdenesTrabajo.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we replace the EXACT string
if "export default function OrdenesTrabajo" in content:
    content = content.replace("export default function OrdenesTrabajo({ asTab }: { asTab?: boolean } = {}) {", "export default function OrdenesTrabajo({ asTab }: { asTab?: boolean } = {}) {\n  console.log(asTab);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched asTab ignore")
