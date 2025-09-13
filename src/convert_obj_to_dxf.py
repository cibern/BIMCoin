# convert_obj_to_dxf.py
import sys
import FreeCAD
import Mesh
import importDXF

obj_path = sys.argv[-2]
dxf_path = sys.argv[-1]

print(f"Importing OBJ: {obj_path}")
doc = FreeCAD.newDocument()
mesh = Mesh.Mesh(obj_path)
mesh_obj = doc.addObject("Mesh::Feature", "Mesh")
mesh_obj.Mesh = mesh

print(f"Exporting to DXF: {dxf_path}")
importDXF.export([mesh_obj], dxf_path)
print("Conversion complete!")

