import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\OperadorApp.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_colors = """const colors = {
  bg: '#F8F9FA',
  text: '#111827',
  textMuted: '#4B5563',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  success: '#16A34A',
  danger: '#DC2626',
  border: '#D1D5DB',
  card: '#FFFFFF'
}"""
s_colors_new = """const colors = {
  bg: '#FFFFFF', // High Contrast Light Mode for outdoor
  text: '#000000', // Pure black for max contrast
  textMuted: '#111827', // Darker text for readability in sun
  primary: '#0056D2', // High contrast blue
  primaryHover: '#003E99',
  success: '#0F7031', // High contrast green
  danger: '#B91C1C', // High contrast red
  border: '#9CA3AF', // Darker border
  card: '#F9FAFB'
}"""

if "// High Contrast" not in content:
    content = content.replace(s_colors, s_colors_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched OperadorApp.tsx for high contrast")
