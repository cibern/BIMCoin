# ifc_obj_dxf_api.py

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile, os, json, math
import subprocess
import ifcopenshell
import pymeshlab  # pip install pymeshlab
from fastapi import Form
import ezdxf  # pip install ezdxf
import ifcopenshell.geom
#from ifcopenshell.util.shape import get_bounding_box
import numpy as np
from ifcopenshell.util.placement import get_local_placement



app = FastAPI()

# CORS per permetre peticions des del navegador (Vite, etc)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------- NOU: OBTENIR NIVELLS/PLANTES IFC -----------
@app.post("/get_levels")
async def get_levels(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp_ifc:
        tmp_ifc.write(await file.read())
        tmp_ifc_path = tmp_ifc.name

    try:
        ifc_file = ifcopenshell.open(tmp_ifc_path)
        storeys = ifc_file.by_type("IfcBuildingStorey")
        print("TROBATS STOREYS:", storeys)  # DEBUG!
        levels = []
        for s in storeys:
            print(f"Storey: {s} - Name: {getattr(s, 'Name', None)}")  # DEBUG!
            if hasattr(s, "Name") and s.Name:
                levels.append(s.Name)
    except Exception as e:
        print("EXCEPCIÓ:", e)  # DEBUG!
        levels = []
    finally:
        os.remove(tmp_ifc_path)

    return JSONResponse(content={"levels": levels})


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

# ----------- Obté la geometria dels nivells selecionats -----------
# ----------- Generar DXF 2D fictici amb ezdxf segons nivells -----------
@app.post("/dxf2d")
async def dxf2d(file: UploadFile = File(...), levels: str = Form(...)):
    levels_selected = json.loads(levels)
    with tempfile.NamedTemporaryFile(suffix=".ifc", delete=False) as tmp_ifc:
        tmp_ifc.write(await file.read())
        tmp_ifc_path = tmp_ifc.name

    tmp_dxf_path = tmp_ifc_path.replace(".ifc", ".dxf")
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()
    ifc_file = ifcopenshell.open(tmp_ifc_path)

    storeys = {s.Name: s for s in ifc_file.by_type("IfcBuildingStorey") if hasattr(s, "Name")}
    print("TROBATS STOREYS:", [s for s in storeys.values()])

    for level_name in levels_selected:
        print(f"Analitzant nivell: {level_name}")
        msp.add_text(level_name, dxfattribs={"height": 2.5, "insert": (0, 0)})

        this_storey = storeys.get(level_name)
        if not this_storey:
            continue

        for rel in getattr(this_storey, "ContainsElements", []):
            for elem in getattr(rel, "RelatedElements", []):
                if not (elem.is_a("IfcWall") or elem.is_a("IfcWallStandardCase") or elem.is_a("IfcDoor") or elem.is_a("IfcWindow")):
                    continue

                elem_type = elem.is_a()
                color = 2 if elem_type == "IfcDoor" else 5 if elem_type == "IfcWindow" else 7
                # Transformació global d'aquest element
                placement = getattr(elem, "ObjectPlacement", None)
                try:
                    matrix = get_local_placement(placement) if placement else np.eye(4)
                except Exception as ex:
                    print(f"Error a get_local_placement: {ex}")
                    matrix = np.eye(4)

                axis_found = False
                if hasattr(elem, "Representation") and elem.Representation:
                    for rep in elem.Representation.Representations:
                        if rep.RepresentationType == "Curve2D" and rep.RepresentationIdentifier == "Axis":
                            for item in rep.Items:
                                if item.is_a("IfcPolyline"):
                                    points = []
                                    for p in item.Points:
                                        x, y = float(p.Coordinates[0]), float(p.Coordinates[1])
                                        pt_before = (x, y)
                                        vec = np.array([x, y, 0, 1])
                                        pt_after = matrix @ vec
                                        global_pt = (pt_after[0], pt_after[1])
                                        print(f"    > Punt original: {pt_before}  → Punt global: {global_pt}")
                                        points.append(global_pt)
                                    if len(points) > 1:
                                        msp.add_lwpolyline(points, dxfattribs={"color": color, "layer": elem_type})
                                        print(f"    → {elem_type} {elem.GlobalId} - footprint exportada ({len(points)} punts)")
                                        axis_found = True
                if not axis_found:
                    print(f"    {elem_type}: {elem.GlobalId} - sense línia base vàlida.")

    doc.saveas(tmp_dxf_path)
    os.remove(tmp_ifc_path)
    return FileResponse(tmp_dxf_path, filename="nivells_planta.dxf", media_type="application/dxf")