# AutoLearn: contenido de la entrega

El ZIP incluye el código fuente, la aplicación web compilada, las pruebas y la documentación con evidencias reales.

## Abrir la aplicación en línea

[https://automataeducativo.netlify.app/](https://automataeducativo.netlify.app/)

Abrir el enlace en un navegador. No es necesario instalar Node.js, Python ni dependencias para utilizar la versión publicada.

## Consultar el informe

Abrir `docs/ENTREGA_AUTOLEARN.pdf`. El documento editable está en `docs/ENTREGA_AUTOLEARN.md`. Las capturas y registros originales se encuentran en `docs/evidencias/`.

## Ejecutar la versión compilada

Si se dispone de Python 3, desde la carpeta descomprimida ejecutar:

```bash
python3 server.py
```

Abrir `http://localhost:8080`. En Windows puede utilizarse `python server.py`. La carpeta `dist/` incluida permite ejecutar esta versión sin instalar dependencias de npm.

Para publicarla sin instalar herramientas, subir la carpeta `dist/` a Netlify desde su interfaz web. El código web ejecuta los algoritmos en el navegador.

## Desarrollo y pruebas

Para modificar o recompilar la aplicación se necesita Node.js con npm:

```bash
npm ci
npm run dev
npm test
npm run build
```

Para las pruebas del motor Python:

```bash
python3 test_runner.py
python3 -m unittest discover -s tests -v
```

Las dependencias instaladas, el historial de Git, la configuración local, los archivos temporales y las copias duplicadas no se incluyen en el ZIP. Las instrucciones completas están en `README.md`.
