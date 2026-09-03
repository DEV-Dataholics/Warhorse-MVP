import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Taller.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import React, { useState, useEffect }", "import { useState, useEffect }")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Taller")
