import ifcopenshell

model = ifcopenshell.open(r"C:\Users\ciber\OneDrive\Documents\prototip\2025\www\001.ifc")
model.write(r"C:\Users\ciber\OneDrive\Documents\prototip\2025\www\001.dxf")


import subprocess

ifc_file = r"C:\Users\ciber\OneDrive\Documents\prototip\2025\www\001.ifc"
dxf_file = r"C:\Users\ciber\OneDrive\Documents\prototip\2025\www\001.obj"
ifcconvert_exe = r"C:\Prototips\BIMCoin\BimCoin\IfcConvert.exe"  # Ajusta la ruta!

subprocess.run([ifcconvert_exe, ifc_file, dxf_file])
