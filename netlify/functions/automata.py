import json
import sys
import os

# Asegurar que el directorio raíz del proyecto esté en el sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import bridge

def handler(event, context):
    """
    Función Serverless de Netlify ejecutada en Python 3.12.
    Recibe la solicitud JSON y ejecuta los algoritmos formales en Python puro.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            "body": ""
        }

    try:
        body = json.loads(event.get("body", "{}"))
        accion = body.get("accion")

        if accion == "modalidad_a":
            alfa = body.get("alfabeto", "")
            regex = body.get("regex", "")
            resultado = bridge.procesar_modalidad_a_py(alfa, regex)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps(resultado)
            }

        elif accion == "modalidad_b":
            alfa = body.get("alfabeto", "")
            estados = body.get("estados", "")
            inicial = body.get("inicial", "")
            finales = body.get("finales", "")
            transiciones = body.get("transiciones", [])
            resultado = bridge.procesar_modalidad_b_py(alfa, estados, inicial, finales, transiciones)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps(resultado)
            }

        elif accion == "simular":
            aut_dict = body.get("automata", {})
            cadena = body.get("cadena", "")
            resultado = bridge.simular_cadena_py(aut_dict, cadena)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps(resultado)
            }

        else:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": f"Acción desconocida: {accion}"})
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": str(e)})
        }
