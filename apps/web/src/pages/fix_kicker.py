import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Reportes.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import Kicker from '../components/ui/Kicker'", "import Kicker from '../components/Kicker'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
