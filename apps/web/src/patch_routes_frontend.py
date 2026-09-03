import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\routes.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_import = "import OrdenesTrabajo from './pages/OrdenesTrabajo'"
s_import_new = """import OrdenesTrabajo from './pages/OrdenesTrabajo'
import OperadorApp from './pages/OperadorApp'"""

if "import OperadorApp" not in content:
    content = content.replace(s_import, s_import_new)

s_route = """<Route path="/login" element={<Login />} />"""
s_route_new = """<Route path="/login" element={<Login />} />
      <Route path="/operador" element={<OperadorApp />} />"""

if "/operador" not in content:
    content = content.replace(s_route, s_route_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("routes.tsx patched")
