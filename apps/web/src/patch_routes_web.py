import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\routes.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Import Admin
if "import Admin from './pages/Admin'" not in content:
    content = content.replace("import Login from './pages/Login'", "import Login from './pages/Login'\nimport Admin from './pages/Admin'")

# Add route
route_str = """      <Route path="compras" element={<Compras />} />
      <Route path="admin" element={
        <ProtectedRoute roles={['admin']}>
          <Admin />
        </ProtectedRoute>
      } />"""

if "path=\"admin\"" not in content:
    content = content.replace("<Route path=\"compras\" element={<Compras />} />", route_str)

# Also add Admin to Sidebar
# But Sidebar is probably inside `routes.tsx` or another file?
# Wait, let's see if Sidebar is in `routes.tsx`

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated routes.tsx")
