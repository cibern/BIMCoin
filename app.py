from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/convert', methods=['POST'])
def convert_ifc_to_dxf():
    if 'file' not in request.files:
        return jsonify({"error": "No s'ha rebut cap arxiu"}), 400

    file = request.files['file']

    # Guarda l'arxiu rebut temporalment
    input_path = "uploaded.ifc"
    file.save(input_path)

    # Simula la conversió: copia el fitxer a .dxf (només per exemple)
    output_path = "converted.dxf"
    with open(input_path, "rb") as f_in, open(output_path, "wb") as f_out:
        f_out.write(f_in.read())

    # Envia el fitxer .dxf com a resposta
    response = send_file(output_path, as_attachment=True, download_name="converted.dxf")

    # Esborra els fitxers temporals després d'enviar (opcional)
    try:
        os.remove(input_path)
        os.remove(output_path)
    except Exception:
        pass

    return response

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

