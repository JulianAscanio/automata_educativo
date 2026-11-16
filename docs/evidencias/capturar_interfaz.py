import asyncio, json, urllib.request, base64
from pathlib import Path
import websockets
ROOT=Path(__file__).resolve().parent
async def main():
    tabs=json.load(urllib.request.urlopen('http://127.0.0.1:9223/json'))
    async with websockets.connect(tabs[0]['webSocketDebuggerUrl'], max_size=30_000_000) as ws:
        seq=0
        async def call(method, params=None):
            nonlocal seq
            seq+=1; ident=seq
            await ws.send(json.dumps({'id':ident,'method':method,'params':params or {}}))
            while True:
                r=json.loads(await ws.recv())
                if r.get('id')==ident:
                    if 'error' in r: raise RuntimeError(r['error'])
                    return r.get('result',{})
        async def js(expr):
            r=await call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':True})
            if 'exceptionDetails' in r: raise RuntimeError(r['exceptionDetails'])
            return r['result'].get('value')
        async def settle():
            await js('new Promise(r=>setTimeout(r,150))')
        async def click(label):
            await js('(()=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+json.dumps(label)+'); if(!b)throw Error("Botón ausente: '+label+'"); b.click()})()')
            await settle()
        async def fill(index,value):
            await js('(()=>{const e=document.querySelectorAll("input")[%d]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,%s); e.dispatchEvent(new Event("input",{bubbles:true}));})()'%(index,json.dumps(value)))
            await settle()
        async def shot(name):
            metrics=await call('Page.getLayoutMetrics')
            size=metrics['cssContentSize']
            r=await call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True,'clip':{'x':0,'y':0,'width':size['width'],'height':size['height'],'scale':1}})
            (ROOT/(name+'.png')).write_bytes(base64.b64decode(r['data']))
        outcomes=[]
        def record(case,expected,observed):
            assert expected in observed,(case,expected,observed)
            outcomes.append({'caso':case,'esperado':expected,'resultado':'APROBADO'})
        await call('Emulation.setDeviceMetricsOverride',{'width':1600,'height':1100,'deviceScaleFactor':1,'mobile':False})
        await call('Page.navigate',{'url':'http://127.0.0.1:4173'})
        await asyncio.sleep(1)
        text=await js('document.body.innerText')
        record('Modalidad A: (a|b)*ab mínimo de tres estados','3 estados',text)
        await shot('01-modalidad-a-minimo')
        await click('Paso a paso'); await shot('02-particiones-minimizacion')
        await click('Probar cadena'); await fill(2,'aab'); await click('Probar')
        for _ in range(8): await click('Siguiente')
        record('Simulación aab','Cadena aceptada',await js('document.body.innerText')); await shot('03-cadena-aceptada')
        await fill(2,'aba'); await click('Probar')
        for _ in range(8): await click('Siguiente')
        record('Simulación aba','Cadena rechazada',await js('document.body.innerText')); await shot('04-cadena-rechazada')
        await fill(0,'a, a'); await click('Generar')
        record('Alfabeto duplicado','duplicados',await js('document.body.innerText')); await shot('05-error-alfabeto')
        await click('Autómata Manual'); await click('AFND con ε'); await click('Analizar y minimizar'); await click('Tabla')
        record('AFND con ε: mínimo completo','3 estados',await js('document.body.innerText')); await shot('06-modalidad-b-afnd')
        await click('1. Inicial'); await click('Probar cadena')
        record('Simulación de AFND bloqueada','Este autómata es no determinista',await js('document.body.innerText')); await shot('07-simulador-afnd-protegido')
        await click('AFD redundante'); await click('Analizar y minimizar'); await click('Tabla')
        record('AFD redundante: mínimo','4 estados',await js('document.body.innerText')); await shot('08-afd-redundante')
        await click('Con inaccesibles'); await click('Analizar y minimizar'); await click('Paso a paso')
        record('Poda de inaccesibles','q_inacc',await js('document.body.innerText')); await shot('09-poda-inaccesibles')
        await fill(3,'Z'); await click('Analizar y minimizar')
        record('Final ajeno a Q','Los estados finales [Z]',await js('document.body.innerText')); await shot('10-error-estado-final')
        await call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
        await click('Expresión Regular'); await click('(a|b)*ab'); await click('Tabla'); await shot('11-vista-movil')
        (ROOT/'interfaz-resultados.json').write_text(json.dumps(outcomes,ensure_ascii=False,indent=2))
        print(json.dumps(outcomes,ensure_ascii=False,indent=2))
asyncio.run(main())
