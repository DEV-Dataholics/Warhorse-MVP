import re

path = r'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Controllers\Api\V1\AlmacenController.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

s_val = """            'categoria'          => 'required|in_list[Frenos,Suspensión,Preventivos,Filtros,Aceites,Otros]',"""
s_val_new = """            'categoria'          => 'required|in_list[Frenos,Suspensión,Preventivos,Filtros,Aceites,Otros,Yonke]',
            'unidad_donante_id'  => 'permit_empty|is_natural_no_zero',"""

# We need to replace it in two places (crear and actualizar).
# The file has accent mark 'Suspensión'. Let me check the exact string.
# In the output it was 'SuspensiA3n' which is utf-8 'Suspensión' interpreted as cp1252.
# So if I read as utf-8, it will be 'Suspensión'.
if "Yonke" not in content:
    content = content.replace(s_val, s_val_new)

s_insert = """        $stockAct = isset($datos['stock_actual']) && $datos['stock_actual'] !== '' ? (int) $datos['stock_actual'] : 0;
        $validar  = isset($datos['validar_limites']) ? (int) filter_var($datos['validar_limites'], FILTER_VALIDATE_BOOLEAN) : 0;"""
s_insert_new = """        $stockAct = isset($datos['stock_actual']) && $datos['stock_actual'] !== '' ? (int) $datos['stock_actual'] : 0;
        $validar  = isset($datos['validar_limites']) ? (int) filter_var($datos['validar_limites'], FILTER_VALIDATE_BOOLEAN) : 0;
        $categoria = $datos['categoria'] ?? 'Otros';
        $unidadDonanteId = isset($datos['unidad_donante_id']) && $datos['unidad_donante_id'] !== '' ? (int) $datos['unidad_donante_id'] : null;

        if ($categoria === 'Yonke' && empty($unidadDonanteId)) {
            return RespuestasApi::error(422, 'validation', 'La categoría Yonke obliga a registrar la unidad donante.', [['La categoría Yonke obliga a registrar la unidad donante.']]);
        }"""

if "$unidadDonanteId" not in content:
    content = content.replace(s_insert, s_insert_new)

s_insert_arr = """            'stock_maximo'       => $stockMax,
            'stock_actual'       => $stockAct,
            'validar_limites'    => $validar,
        ];"""
s_insert_arr_new = """            'stock_maximo'       => $stockMax,
            'stock_actual'       => $stockAct,
            'validar_limites'    => $validar,
            'unidad_donante_id'  => $unidadDonanteId,
        ];"""

if "'unidad_donante_id'  => $unidadDonanteId," not in content:
    content = content.replace(s_insert_arr, s_insert_arr_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched AlmacenController")
