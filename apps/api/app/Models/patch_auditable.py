import re
import glob

def patch_model(filename):
    path = rf'c:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\api\app\Models\{filename}'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    if "use App\\Traits\\Auditable;" not in content:
        # Add import
        content = content.replace("use CodeIgniter\\Model;", "use CodeIgniter\\Model;\nuse App\\Traits\\Auditable;")
        # Add trait
        content = content.replace("class " + filename.replace('.php', '') + " extends Model\n{", "class " + filename.replace('.php', '') + " extends Model\n{\n    use Auditable;\n")

        # Add callbacks
        callbacks = """
    protected $beforeUpdate = ['auditBeforeUpdate'];
    protected $afterInsert  = ['auditAfterInsert'];
    protected $afterUpdate  = ['auditAfterUpdate'];
    protected $afterDelete  = ['auditAfterDelete'];
"""
        # If there are already callbacks, we should merge them, but for now let's just assume they don't exist
        # RequisicionModel has none. RegistroTallerModel has none. UnidadModel has none.
        if "protected $allowedFields" in content:
            content = content.replace("protected $allowedFields", callbacks + "\n    protected $allowedFields")

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filename}")
    else:
        print(f"Already patched {filename}")

patch_model('RequisicionModel.php')
patch_model('RegistroTallerModel.php')
patch_model('UnidadModel.php')
patch_model('CatalogoPiezaModel.php')
