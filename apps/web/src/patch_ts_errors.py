import re

# 1. Export pedir
path_api = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\lib\api.ts'
with open(path_api, 'r', encoding='utf-8') as f:
    api = f.read()
api = api.replace("async function pedir<T>", "export async function pedir<T>")
with open(path_api, 'w', encoding='utf-8') as f:
    f.write(api)

# 2. Fix Admin.tsx
path_admin = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Admin.tsx'
with open(path_admin, 'r', encoding='utf-8') as f:
    admin = f.read()
admin = admin.replace("badge,", "").replace("icon=\"âš™ï¸ \" text=", "texto=")
with open(path_admin, 'w', encoding='utf-8') as f:
    f.write(admin)

# 3. Fix routes.tsx
path_routes = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\routes.tsx'
with open(path_routes, 'r', encoding='utf-8') as f:
    routes = f.read()

route_admin = """        <Route path="/compras" element={<RutaModulo modulo="compras"><Compras /></RutaModulo>} />
        <Route path="/admin" element={<RutaModulo modulo="admin"><Admin /></RutaModulo>} />"""

routes = routes.replace('<Route path="/compras" element={<RutaModulo modulo="compras"><Compras /></RutaModulo>} />', route_admin)

with open(path_routes, 'w', encoding='utf-8') as f:
    f.write(routes)
print("Fixed TS errors")
