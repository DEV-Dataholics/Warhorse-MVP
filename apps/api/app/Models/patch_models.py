import re

def add_soft_deletes(filename):
    path = rf'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Models\{filename}'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change useSoftDeletes from false to true or add it
    if "protected $useSoftDeletes   = false;" in content:
        content = content.replace("protected $useSoftDeletes   = false;", "protected $useSoftDeletes   = true;")
    elif "protected $useSoftDeletes = false;" in content:
        content = content.replace("protected $useSoftDeletes = false;", "protected $useSoftDeletes = true;")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

add_soft_deletes('UsuarioModel.php')
add_soft_deletes('UnidadModel.php')
print("Soft deletes enabled")
