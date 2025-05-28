# ifc_obj_dxf_api.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import subprocess

import pymeshlab  # Assegura't d'instal·lar-ho: pip install pymeshlab

app = FastAPI()

# CORS per permetre peticions des del navegador (Vite, etc)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pots restringir-ho a ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- IFC → OBJ -----------
@app.post("/convert")
async def convert_ifc_to_obj(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp_ifc:
        tmp_ifc.write(await file.read())
        tmp_ifc_path = tmp_ifc.name

    tmp_obj_path = tmp_ifc_path.replace(".ifc", ".obj")
    result = subprocess.run(
        ["IfcConvert", tmp_ifc_path, tmp_obj_path],
        capture_output=True
    )
    os.remove(tmp_ifc_path)

    if result.returncode != 0 or not os.path.exists(tmp_obj_path):
        return {"error": result.stderr.decode() or "Error convertint IFC→OBJ"}

    return FileResponse(tmp_obj_path, filename="model.obj", media_type="application/octet-stream")


# ----------- OBJ → DXF -----------
@app.post("/obj2dxf")
async def convert_obj_to_dxf(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".obj", delete=False) as tmp_obj:
        tmp_obj.write(await file.read())
        tmp_obj_path = tmp_obj.name

    tmp_dxf_path = tmp_obj_path.replace(".obj", ".dxf")

    try:
        ms = pymeshlab.MeshSet()
        ms.load_new_mesh(tmp_obj_path)
        ms.save_current_mesh(tmp_dxf_path)
    except Exception as e:
        os.remove(tmp_obj_path)
        return {"error": f"Error a PyMeshLab: {e}"}

    os.remove(tmp_obj_path)

    if not os.path.exists(tmp_dxf_path):
        return {"error": "No s'ha pogut generar el fitxer DXF."}

    return FileResponse(tmp_dxf_path, filename="model.dxf", media_type="application/dxf")



