/**
 * QA de la aplicación local en Chrome headless, con un perfil temporal propio.
 * Usa el protocolo de pruebas del navegador; no controla ventanas ni perfiles
 * del usuario. No instala dependencias, desactiva seguridad ni crea cuentas.
 * Ejecutar con Vite iniciado: node pruebas/comprobacion-web.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const base = process.env.GOTACNA_WEB ?? 'http://127.0.0.1:5173';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Solo se admite la web local');
const chrome = process.env.GOTACNA_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const salida = resolve('pruebas/resultados-web');
await mkdir(salida, { recursive: true });
const informe = { fecha: new Date().toISOString(), suites: [], comprobaciones: [], capturas: [], escrituras: [] };
const pausa = ms => new Promise(r => setTimeout(r, ms));
const comprobar = (condicion, nombre, datos) => {
  assert.ok(condicion, nombre);
  informe.comprobaciones.push({ nombre, ...(datos ? { datos } : {}) });
  console.log('OK · ' + nombre);
};

async function iniciar(zoom = 1) {
  const perfil = await mkdtemp(join(tmpdir(), 'go-tacna-qa-'));
  if (zoom !== 1) {
    await mkdir(join(perfil, 'Default'));
    // Preferencia nativa de Chromium, solo en este perfil de pruebas.
    // https://raw.githubusercontent.com/chromium/chromium/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
    await writeFile(join(perfil, 'Default', 'Preferences'), JSON.stringify({
      partition: { default_zoom_level: { x: Math.log(zoom) / Math.log(1.2) } },
    }));
  }
  const proceso = spawn(chrome, [
    '--headless=new', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--force-device-scale-factor=1', '--window-size=1440,900',
    '--user-data-dir=' + perfil, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let errorInicio;
  proceso.on('error', error => { errorInicio = error; });
  proceso.stderr.on('data', () => {}); // No imprimir telemetría ni datos de otros perfiles.
  let socket;
  try {
  const limite = Date.now() + 20000;
  let puerto;
  while (!puerto) {
    if (errorInicio) throw errorInicio;
    if (proceso.exitCode !== null) throw Error('Chrome terminó antes de iniciar QA');
    try { puerto = Number((await readFile(join(perfil, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch { /* Arranque asíncrono. */ }
    if (Date.now() > limite) { proceso.kill(); throw Error('Chrome no abrió su puerto de pruebas'); }
    if (!puerto) await pausa(100);
  }
  const version = await (await fetch('http://127.0.0.1:' + puerto + '/json/version', { signal: AbortSignal.timeout(5000) })).json();
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((ok, no) => {
    const timer = setTimeout(() => no(Error('El canal de pruebas no respondió')), 5000);
    socket.addEventListener('open', () => { clearTimeout(timer); ok(); }, { once: true });
    socket.addEventListener('error', error => { clearTimeout(timer); no(error); }, { once: true });
  });
  let secuencia = 0;
  const pendientes = new Map();
  socket.addEventListener('message', evento => {
    const mensaje = JSON.parse(evento.data);
    if (mensaje.id) {
      const pendiente = pendientes.get(mensaje.id);
      if (!pendiente) return;
      pendientes.delete(mensaje.id); clearTimeout(pendiente.timer);
      if (mensaje.error) pendiente.no(Error(mensaje.error.message)); else pendiente.ok(mensaje.result);
    }
    if (mensaje.method === 'Network.requestWillBeSent') {
      const peticion = mensaje.params.request;
      const url = new URL(peticion.url);
      if (['localhost', '127.0.0.1'].includes(url.hostname) && !['GET', 'HEAD', 'OPTIONS'].includes(peticion.method)) {
        informe.escrituras.push({ metodo: peticion.method, ruta: url.pathname });
      }
    }
  });
  function enviar(method, params = {}, sessionId) {
    const id = ++secuencia;
    return new Promise((ok, no) => {
      const timer = setTimeout(() => { pendientes.delete(id); no(Error('Timeout CDP: ' + method)); }, 30000);
      pendientes.set(id, { ok, no, timer });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => enviar(method, params, sessionId);
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  async function evaluar(expression) {
    const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }
  async function esperar(expression, tiempo = 20000) {
    const fin = Date.now() + tiempo;
    while (Date.now() < fin) {
      try { const r = await evaluar(expression); if (r) return r; } catch { /* Navegación o render en curso. */ }
      await pausa(100);
    }
    throw Error('No se cumplió: ' + expression.slice(0, 140));
  }
  async function abrir(ruta, selector) {
    await cdp('Page.navigate', { url: base + ruta });
    await esperar('document.readyState === "complete"');
    if (selector) await esperar('Boolean(document.querySelector(' + JSON.stringify(selector) + '))');
    await evaluar('document.fonts.ready.then(() => true)');
  }
  async function dimensiones(width, height) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await pausa(120);
  }
  async function captura(nombre) {
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(salida, nombre + '.png'), Buffer.from(data, 'base64'));
    informe.capturas.push(nombre + '.png');
  }
  return { cdp, evaluar, esperar, abrir, dimensiones, captura, version: version.Browser,
    async cerrar() {
      try { await enviar('Browser.close'); } catch { /* El cierre puede cerrar antes el socket. */ }
      socket.close();
      for (const p of pendientes.values()) clearTimeout(p.timer);
      if (proceso.exitCode === null) await Promise.race([new Promise(r => proceso.once('exit', r)), pausa(3000)]);
      if (proceso.exitCode === null) proceso.kill();
    },
  };
  } catch (error) {
    socket?.close();
    if (proceso.exitCode === null) proceso.kill();
    throw error;
  }
}

let navegador;
try {
  navegador = await iniciar();
  informe.navegador = navegador.version;
  console.log('Navegador aislado: ' + navegador.version);
  for (const [archivo, selector] of [['revision-publica', '#informe'], ['revision-visor', '#comprobaciones']]) {
    await navegador.abrir('/pruebas/' + archivo + '.html?ejecutar=1', selector);
    const texto = await navegador.esperar('(() => { const t=document.querySelector(' + JSON.stringify(selector) + ').textContent; return /TOTAL:|FALLO:/.test(t) ? t : false; })()', 120000);
    await writeFile(join(salida, archivo + '.txt'), texto);
    informe.suites.push({ nombre: archivo, texto });
    assert.ok(!texto.includes('FALLO:'), texto);
    console.log(archivo + ': ' + texto.split('\n').at(-1));
  }
  // Escenas del mismo código con datos ficticios para comparar composiciones.
  for (const [pantalla, selector] of [['inicio', '.gt-ruta-boton'], ['registro', 'form'], ['login', 'form'], ['mapa', '#micro-publico-101']]) {
    for (const [ancho, alto, etiqueta] of [[1440, 900, 'escritorio'], [390, 844, 'movil']]) {
      await navegador.dimensiones(ancho, alto);
      await navegador.abrir('/pruebas/escena-visor.html?' + (pantalla === 'mapa' ? 'ruta=1' : 'pantalla=' + pantalla), selector);
      const medidas = await navegador.evaluar('({ancho:innerWidth,documento:document.documentElement.scrollWidth,foco:document.activeElement?.id})');
      comprobar(medidas.documento <= medidas.ancho, pantalla + ' sin desbordamiento en ' + etiqueta, medidas);
      if (pantalla === 'inicio') {
        const alineacion = await navegador.evaluar('({hero:document.querySelector(".gt-hero-interior").getBoundingClientRect().left,beneficios:document.querySelector(".gt-beneficios ul").getBoundingClientRect().left})');
        comprobar(Math.abs(alineacion.hero - alineacion.beneficios) < 1, 'Beneficios alineados con el contenido en ' + etiqueta, alineacion);
      }
      if (pantalla === 'mapa') comprobar(await navegador.evaluar('Number(getComputedStyle(document.querySelector(".gt-marca")).fontWeight) >= 700'), 'Cabecera del mapa conserva identidad en ' + etiqueta);
      await navegador.evaluar('scrollTo(0,0)');
      await navegador.captura(pantalla + '-' + etiqueta);
      if (pantalla === 'inicio') {
        await navegador.evaluar('document.querySelector("#empresas").scrollIntoView({behavior:"instant"})');
        await navegador.captura('empresas-' + etiqueta);
        await navegador.evaluar('scrollTo(0,document.documentElement.scrollHeight)');
        await navegador.captura('pie-' + etiqueta);
      }
    }
  }
  // Comprobar que la demostración sigue accesible y se desmonta al cerrarse.
  await navegador.dimensiones(1440, 900);
  await navegador.abrir('/pruebas/escena-visor.html?pantalla=inicio', '.gt-ruta-boton');
  await navegador.evaluar('document.querySelector(".gt-demo-boton").click()');
  await navegador.esperar('Boolean(document.querySelector(".gt-demo-lienzo canvas,.gt-demo-lienzo svg"))');
  comprobar(true, 'Demostración 3D accesible bajo demanda');
  await navegador.evaluar('document.querySelector(".gt-demo-boton").click()');
  await navegador.esperar('!document.querySelector(".gt-demo-lienzo")');
  comprobar(true, 'Cerrar demostración retira su lienzo');
  // Aplicación real: solo lecturas públicas y sin sesión guardada.
  await navegador.abrir('/', '.gt-ruta-boton');
  comprobar(await navegador.evaluar('!document.querySelector(".gt-error")'), 'Portada conectada al catálogo real');
  await navegador.captura('inicio-api-real');
  await navegador.abrir('/mapa?ruta=4', '#ruta-seleccionada-titulo');
  await navegador.esperar('Boolean(document.querySelector(".cp-tarjeta-micro"))');
  await navegador.esperar('Boolean(document.querySelector(".maplibregl-canvas")) && !document.querySelector(".cp-aviso-mapa")', 30000);
  comprobar(true, 'Mapa real con calles, recorrido y unidades públicas');
  comprobar(await navegador.evaluar('Boolean(document.querySelector(".maplibregl-ctrl-attrib-inner a"))'), 'Mapa real conserva atribución');
  await navegador.evaluar('scrollTo(0,0)');
  await navegador.captura('mapa-api-real');
  await navegador.cerrar(); navegador = null;

  // Segundo perfil con zoom nativo de navegador, sin cambiar el perfil personal.
  navegador = await iniciar(2);
  await navegador.dimensiones(1440, 900);
  for (const [pantalla, selector] of [['inicio', '.gt-ruta-boton'], ['registro', 'form'], ['login', 'form'], ['mapa', '#micro-publico-101']]) {
    await navegador.abrir('/pruebas/escena-visor.html?' + (pantalla === 'mapa' ? 'ruta=1' : 'pantalla=' + pantalla), selector);
    const medidas = await navegador.evaluar('({ancho:innerWidth,documento:document.documentElement.scrollWidth,dpr:devicePixelRatio,escala:visualViewport.scale})');
    const layout = await navegador.cdp('Page.getLayoutMetrics');
    comprobar(Math.abs(medidas.dpr - 2) < .01 && Math.abs(layout.cssVisualViewport.zoom - 2) < .01, pantalla + ' con zoom nativo al 200 %', { ...medidas, zoom: layout.cssVisualViewport.zoom });
    comprobar(medidas.documento <= medidas.ancho, pantalla + ' conserva acceso horizontal al 200 %');
    await navegador.evaluar('scrollTo(0,0)');
    await navegador.captura(pantalla + '-zoom-200');
  }
  comprobar(informe.escrituras.length === 0, 'Sin escrituras HTTP ni creación de cuentas reales');
  informe.correcto = true;
} catch (error) {
  informe.correcto = false;
  informe.error = error.message;
  console.error(error.message);
  if (navegador) await navegador.captura('fallo').catch(() => {});
  process.exitCode = 1;
} finally {
  if (navegador) await navegador.cerrar();
  await writeFile(join(salida, 'informe.json'), JSON.stringify(informe, null, 2));
  const imagenes = informe.capturas.map(nombre => '<figure><figcaption>' + nombre + '</figcaption><img src="' + nombre + '" style="max-width:100%;border:1px solid #cbd5e1"></figure>').join('\n');
  await writeFile(join(salida, 'index.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><title>Comprobación final Go Tacna</title><style>body{font:16px system-ui;max-width:1480px;margin:32px auto;padding:16px}pre{white-space:pre-wrap}figure{margin:24px 0}</style><h1>Comprobación final de Go Tacna</h1><pre>' + JSON.stringify({correcto:informe.correcto,navegador:informe.navegador,suites:informe.suites.map(s=>({nombre:s.nombre,resumen:s.texto.split('\n').at(-1)})),comprobaciones:informe.comprobaciones,error:informe.error},null,2).replaceAll('&','&amp;').replaceAll('<','&lt;') + '</pre>' + imagenes + '</html>');
  console.log('Informe y capturas: ' + salida);
}
