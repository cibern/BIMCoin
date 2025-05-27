import subprocess
import sys
import FreeCAD
import Import
import Part

ifc_path = sys.argv[1]
obj_path = ifc_path.replace('.ifc', '.obj')
dxf_path = ifc_path.replace('.ifc', '.dxf')

# Convertir IFC → OBJ
subprocess.run(["ifcconvert", ifc_path, obj_path])

# OBJ → DXF amb FreeCAD
doc = FreeCAD.newDocument()
Part.insert(obj_path, doc.Name)
Import.export(doc.Objects, dxf_path)

print("✅ DXF creat:", dxf_path)

