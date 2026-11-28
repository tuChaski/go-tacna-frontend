/** Pruebas de interfaz dentro de la escena ficticia local. Nunca se importa
 * desde /mapa y no hace escrituras ni solicitudes a la API de Laravel. */
const frame = document.querySelector('#escena'), resultado = document.querySelector('#resultado');
const informe = document.querySelector('#comprobaciones');
let extension;
const doc = () => frame.contentDocument;
const ventana = () => frame.contentWindow;
const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));
async function esperar(condicion) {
  const limite = performance.now() + 8000;
  while (!condicion()) { if (performance.now() > limite) throw new Error('Tiempo de espera agotado'); await pausa(30); }
}
function medir() {
  const ancho = ventana().innerWidth;
  resultado.textContent = JSON.stringify({ ancho, documento: doc().documentElement.scrollWidth,
    sinDesbordamiento: doc().documentElement.scrollWidth <= ancho, mapas: doc().querySelectorAll('.maplibregl-canvas').length,
    errorMapa: doc().documentElement.dataset.errorMapa ?? null,
    foco: doc().activeElement?.getAttribute('aria-label') || doc().activeElement?.id || doc().activeElement?.tagName }, null, 2);
}
document.querySelector('#anchos').addEventListener('click', evento => {
  const ancho = evento.target.dataset.ancho;
  if (ancho) { frame.width = ancho; requestAnimationFrame(() => requestAnimationFrame(medir)); }
});
document.querySelector('#escenario').addEventListener('change', evento => { extension = null; frame.src = '/pruebas/escena-visor.html?ruta=1&modo=' + evento.target.value; });
document.querySelector('#medir').onclick = medir;
document.querySelector('#teclado').onclick = () => doc().querySelector('.maplibregl-canvas')?.focus();
document.querySelector('#perder').onclick = () => {
  const canvas = doc().querySelector('.maplibregl-canvas');
  extension = canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context'); extension?.loseContext();
  resultado.textContent = extension ? 'Pérdida real de contexto solicitada. Revisa el aviso y prueba el listado.' : 'Extensión de prueba no disponible.';
};
document.querySelector('#restaurar').onclick = () => { extension?.restoreContext(); resultado.textContent = 'Restauración solicitada. Revisa el mapa.'; };
frame.onload = () => setTimeout(medir, 500);

const boton = nombre => [...doc().querySelectorAll('button')].find(b => b.getAttribute('aria-label') === nombre || b.textContent.trim() === nombre);
const clic = nombre => { const b = boton(nombre); if (!b || b.disabled) throw new Error('Botón no disponible: ' + nombre); b.click(); };
function escribir(texto) {
  const input = doc().querySelector('#buscar-ruta-publica');
  Object.getOwnPropertyDescriptor(ventana().HTMLInputElement.prototype, 'value').set.call(input, texto);
  const Evento = ventana().Event;
  input.dispatchEvent(new Evento('input', { bubbles: true }));
}
async function buscar(texto) { escribir(texto); await pausa(350); }
async function escena(modo = 'normal') {
  frame.src = '/pruebas/escena-visor.html?ruta=1&modo=' + modo;
  await new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
  await esperar(() => doc().querySelector(modo === 'marcadores' ? '.cp-marcador' : '#micro-publico-101'));
}
document.querySelector('#comprobar').onclick = async evento => {
  evento.target.disabled = true;
  const resultados = [];
  const comprobar = (condicion, nombre) => { if (!condicion) throw new Error(nombre); resultados.push('OK · ' + nombre); informe.textContent = resultados.join('\n'); };
  try {
    await escena(); await esperar(() => doc().querySelector('.maplibregl-canvas') && !doc().querySelector('.cp-aviso-mapa'));
    comprobar(!doc().documentElement.dataset.errorMapa, 'Worker, estilo y tesela ficticia sin errores');
    for (const ancho of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
      frame.width = ancho; await pausa(80);
      comprobar(doc().documentElement.scrollWidth <= ventana().innerWidth, 'Sin desbordamiento a ' + ancho + ' px');
      comprobar(doc().querySelectorAll('.maplibregl-canvas').length === 1, 'Un solo mapa a ' + ancho + ' px');
    }
    comprobar(Boolean(doc().querySelector('.maplibregl-ctrl-attrib-inner a')), 'Atribución visible en el mapa');
    const mapaInicial = doc().querySelector('.maplibregl-canvas');
    clic('Acercar mapa'); clic('Alejar mapa'); clic('Ver todo el recorrido');
    comprobar(Boolean(doc().querySelector('#ruta-seleccionada-titulo')), 'Controles de cámara conservan la consulta');
    doc().querySelector('#micro-publico-101').click();
    await esperar(() => doc().querySelector('.cp-ficha-micro dl'));
    comprobar(doc().activeElement.id === 'detalle-micro-titulo', 'Foco al abrir el detalle');
    comprobar(doc().querySelector('.cp-ficha-micro').textContent.includes('máximo de pasajeros'), 'Capacidad diferenciada de ocupación');
    clic('Cerrar detalle del micro');
    comprobar(doc().activeElement.id === 'micro-publico-101', 'Foco devuelto al cerrar el detalle');
    clic('Página siguiente de micros'); await esperar(() => doc().querySelector('#micro-publico-107'));
    comprobar(doc().querySelectorAll('.cp-tarjeta-micro').length === 1, 'Paginación de siete micros');
    doc().querySelector('#ruta-publica-2').click(); await esperar(() => doc().querySelector('.cp-sin-trazado'));
    comprobar(doc().querySelector('.cp-sin-trazado').textContent.includes('no tiene un trazado'), 'Ruta sin trazado conserva la consulta');
    await esperar(() => doc().querySelector('.cp-vacio'));
    comprobar(doc().querySelector('.cp-vacio').textContent.includes('Sin micros activos'), 'Ruta sin unidades');
    doc().querySelector('#ruta-publica-6').click(); await esperar(() => doc().querySelector('#ruta-seleccionada-titulo')?.textContent === 'Ruta ficticia 6');
    await esperar(() => doc().querySelector('.cp-sin-trazado'));
    comprobar(doc().querySelector('.cp-sin-trazado').textContent.includes('no es compatible'), 'Geometría incompatible mantiene la ruta');
    doc().querySelector('#ruta-publica-3').click(); await esperar(() => doc().querySelector('.cp-error'));
    comprobar(doc().querySelector('.cp-error').textContent.includes('ya no está disponible'), 'Registro retirado 404');
    doc().querySelector('#ruta-publica-5').click(); await esperar(() => doc().querySelector('.cp-unidades .cp-error'));
    comprobar(Boolean(doc().querySelector('.cp-visor')), 'Error 500 de unidades conserva el mapa');
    comprobar(doc().querySelector('.maplibregl-canvas') === mapaInicial, 'Cambiar rutas no recrea el mapa');
    const anteriores = JSON.parse(doc().documentElement.dataset.consultas).length;
    escribir('n'); await pausa(60); escribir('no'); await pausa(60); escribir('nombre largo');
    await esperar(() => doc().querySelector('#ruta-publica-9'));
    const nuevas = JSON.parse(doc().documentElement.dataset.consultas).slice(anteriores);
    comprobar(nuevas.length === 1 && nuevas[0].search === 'nombre largo' && nuevas[0].page === 1, 'Debounce envía solo el último término al catálogo completo');
    await buscar('error500'); await esperar(() => doc().querySelector('.cp-explorador .cp-error'));
    comprobar(Boolean(doc().querySelector('.cp-ruta-detalle')), 'Error de catálogo conserva la selección');
    await buscar('incompleta'); await esperar(() => doc().querySelector('.cp-explorador .cp-error')?.textContent.includes('incompleta'));
    comprobar(true, 'Respuesta incompleta identificada');
    await buscar('red'); await esperar(() => doc().querySelector('.cp-explorador .cp-error')?.textContent.includes('interrumpida'));
    comprobar(true, 'Conexión interrumpida identificada en transporte ficticio');
    await buscar('lenta'); await pausa(60); await buscar('html');
    await esperar(() => doc().querySelector('.cp-tarjeta-ruta')?.textContent.includes('<b>Texto ficticio</b>'));
    await pausa(1700);
    comprobar(JSON.parse(doc().documentElement.dataset.consultas).some(c => c.search === 'lenta' && c.abortada), 'La búsqueda anterior recibe cancelación');
    comprobar(!doc().querySelector('.cp-tarjeta-ruta b') && doc().querySelector('.cp-tarjeta-ruta').textContent.includes('<b>'), 'Respuesta tardía descartada y HTML como texto');
    clic('Limpiar búsqueda'); await esperar(() => doc().querySelector('#ruta-publica-8'));
    comprobar(doc().querySelector('#ruta-seleccionada-titulo').textContent === 'Ruta ficticia 5', 'Limpiar búsqueda conserva ruta seleccionada');
    clic('Página siguiente de rutas'); await esperar(() => doc().querySelector('#ruta-publica-9'));
    for (const ancho of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
      frame.width = ancho; await pausa(80);
      comprobar(doc().documentElement.scrollWidth <= ventana().innerWidth, 'Nombre largo sin desbordamiento a ' + ancho + ' px');
    }
    clic('Página anterior de rutas'); await esperar(() => doc().querySelector('#ruta-publica-1'));
    doc().querySelector('#ruta-publica-1').click(); await esperar(() => doc().querySelector('#micro-publico-101'));
    doc().querySelector('#micro-publico-101').click(); await esperar(() => doc().querySelector('.cp-ficha-micro dl'));
    clic('Cerrar ruta seleccionada'); await pausa(40);
    comprobar(doc().activeElement.id === 'ruta-publica-1' && !doc().querySelector('.cp-ficha-micro'), 'Cerrar ruta devuelve el foco y retira detalle');
    doc().querySelector('#ruta-publica-1').click(); await esperar(() => doc().querySelector('#micro-publico-101'));
    comprobar(!doc().querySelector('.cp-ficha-micro'), 'Volver a una ruta comienza sin unidad anterior');
    for (const [ancho, alto] of [[1366,768],[1440,900],[844,390]]) {
      frame.width = ancho; frame.height = alto; frame.style.height = alto + 'px'; await pausa(120);
      ventana().scrollTo(0,0);
      const mapa = doc().querySelector('.cp-lienzo-mapa').getBoundingClientRect();
      comprobar(doc().documentElement.scrollWidth <= ventana().innerWidth, 'Consulta sin desbordamiento en ' + ancho + '×' + alto);
      if (ancho > 900) comprobar(mapa.top < alto / 2 && mapa.bottom <= alto, 'Mapa visible al entrar en ' + ancho + '×' + alto);
    }
    frame.style.height = '600px';
    await escena('marcadores');
    doc().querySelector('.cp-marcador').click();
    await esperar(() => doc().querySelector('.cp-marcador[aria-pressed="true"]'));
    comprobar(doc().querySelector('[role="status"]').textContent.includes('101'), 'Marcador abre la selección ficticia');
    clic('MARCADOR-FICTICIO-102'); await pausa(60);
    comprobar(doc().querySelector('.cp-marcador[aria-pressed="true"]').getAttribute('aria-label').includes('102'), 'Tarjeta sincroniza el marcador ficticio');
    await escena('teselas'); await esperar(() => doc().querySelector('.cp-fallo-mapa'));
    comprobar(doc().querySelector('.cp-fallo-mapa').textContent.includes('calles'), 'Fallo de teselas con recuperación explícita');
    doc().querySelector('#micro-publico-101').click(); await esperar(() => doc().querySelector('.cp-ficha-micro dl'));
    comprobar(true, 'Detalle operativo sin teselas');
    ventana().dispatchEvent(new (ventana().Event)('qa-restaurar-teselas'));
    clic('Reintentar mapa'); await esperar(() => !doc().querySelector('.cp-aviso-mapa'));
    comprobar(doc().querySelectorAll('.maplibregl-canvas').length === 1 && Boolean(doc().querySelector('.cp-ficha-micro dl')), 'Reintentar teselas recupera un solo mapa y conserva detalle');
    await escena('sin-webgl'); await esperar(() => doc().querySelector('.cp-fallo-mapa'));
    comprobar(doc().querySelector('.cp-fallo-mapa').textContent.includes('gráficos'), 'Ausencia de WebGL con aviso');
    doc().querySelector('#micro-publico-101').click(); await esperar(() => doc().querySelector('.cp-ficha-micro dl'));
    comprobar(true, 'Detalle operativo sin WebGL');
    ventana().dispatchEvent(new (ventana().Event)('qa-restaurar-webgl'));
    clic('Reintentar mapa'); await esperar(() => !doc().querySelector('.cp-aviso-mapa'));
    comprobar(doc().querySelectorAll('.maplibregl-canvas').length === 1 && Boolean(doc().querySelector('.cp-ficha-micro dl')), 'Reintentar gráficos recupera el mapa y conserva detalle');
    await escena(); await esperar(() => doc().querySelector('.maplibregl-canvas') && !doc().querySelector('.cp-aviso-mapa'));
    const ext = doc().querySelector('canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!ext) throw new Error('La GPU no ofrece WEBGL_lose_context para esta prueba');
    ext.loseContext(); await esperar(() => doc().querySelector('.cp-fallo-mapa'));
    comprobar(doc().querySelector('.cp-fallo-mapa').textContent.includes('gráficos'), 'Pérdida real de contexto WebGL');
    ext.restoreContext(); await esperar(() => !doc().querySelector('.cp-aviso-mapa'));
    comprobar(doc().querySelectorAll('.maplibregl-canvas').length === 1, 'Restauración WebGL sin duplicar mapa');
    medir(); informe.textContent += '\nTOTAL: ' + resultados.length + ' comprobaciones aprobadas.';
  } catch (error) { informe.textContent += '\nFALLO: ' + error.message; }
  finally { evento.target.disabled = false; }
};
// Permite repetir la suite local al abrir una URL de QA explícita.
if (new URLSearchParams(location.search).get('ejecutar') === '1') document.querySelector('#comprobar').click();
