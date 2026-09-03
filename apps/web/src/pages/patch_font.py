import re

for filename in ['Compras.tsx', 'Taller.tsx']:
    path = rf'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\{filename}'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace("fontSize: 14, minWidth: 850", "fontSize: 13, minWidth: 850")
        content = content.replace("fontSize: 14, minWidth: 600", "fontSize: 13, minWidth: 600")
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filename}")
    except Exception as e:
        print(f"Error {filename}: {e}")
