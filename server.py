#!/usr/bin/env python3
"""
server.py
Servidor Web Local en Python Puro (Librería Estándar: http.server).
No requiere paquetes externos (ni Flask, ni Tkinter, ni npm).
Ejecuta los algoritmos de Teoría de la Computación directamente en Python.

Uso:
    python3 server.py
"""

import sys
import os
import json
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
import bridge

PORT = 8080
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

class AutomataHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            data = {}

        path = self.path.split("?")[0]
        response_data = None
        status_code = 200

        try:
            if path == "/api/modalidad_a":
                alfa = data.get("alfabeto", "")
                regex = data.get("regex", "")
                response_data = bridge.procesar_modalidad_a_py(alfa, regex)

            elif path == "/api/modalidad_b":
                alfa = data.get("alfabeto", "")
                estados = data.get("estados", "")
                inicial = data.get("inicial", "")
                finales = data.get("finales", "")
                transiciones = data.get("transiciones", [])
                response_data = bridge.procesar_modalidad_b_py(alfa, estados, inicial, finales, transiciones)

            elif path == "/api/simular":
                aut_dict = data.get("automata", {})
                cadena = data.get("cadena", "")
                response_data = bridge.simular_cadena_py(aut_dict, cadena)

            else:
                status_code = 404
                response_data = {"error": f"Ruta API no encontrada: {path}"}

        except Exception as e:
            status_code = 400
            response_data = {"error": str(e)}

        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def run_server():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, AutomataHTTPHandler)
    url = f"http://localhost:{PORT}"

    print("=" * 65)
    print(" AutoLearn • Servidor Web Educativo en Python Puro")
    print(f" Servidor iniciado en: {url}")
    print(" Presiona Ctrl+C para detener el servidor.")
    print("=" * 65)

    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
