// Escenas locales sin escrituras ni credenciales. Se revisa el DOM renderizado.
const frame = document.querySelector('#escena'), informe = document.querySelector('#informe');
const pausa = ms => new Promise(r => setTimeout(r, ms));
const doc = () => frame.contentDocument;
async function esperar(condicion) {
  const fin = performance.now() + 10000;
  while (!condicion()) { if (performance.now() > fin) throw Error('Tiempo de espera agotado'); await pausa(40); }
}
async function abrir(pantalla) {
  frame.src = '/pruebas/escena-visor.html?pantalla=' + pantalla;
  await new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
  await esperar(() => pantalla.startsWith('inicio')
    ? doc().querySelector('.gt-ruta-boton,.gt-error') || (doc().querySelector('.gt-vacio') && !doc().querySelector('.gt-vacio').textContent.includes('Consultando'))
    : doc().querySelector('form'));
}
document.querySelector('#ejecutar').onclick = async () => {
  const resultados = [];
  const comprobar = (condicion, nombre) => {
    if (!condicion) throw Error(nombre);
    resultados.push('OK · ' + nombre); informe.textContent = resultados.join('\n');
  };
  try {
    for (const pantalla of ['inicio', 'registro', 'login']) {
      await abrir(pantalla);
      for (const ancho of [320,360,390,768,1024,1280,1440,1920]) {
        frame.width = ancho; await pausa(100);
        comprobar(doc().documentElement.scrollWidth <= frame.contentWindow.innerWidth, pantalla + ' sin desbordamiento a ' + ancho);
      }
      for (const [ancho,alto] of [[1366,768],[1440,900],[844,390]]) {
        frame.width=ancho; frame.style.height=alto+'px'; await pausa(100);
        comprobar(doc().documentElement.scrollWidth <= frame.contentWindow.innerWidth, pantalla+' en '+ancho+'×'+alto);
        frame.contentWindow.scrollTo(0,0);
        if (pantalla === 'inicio' && ancho > 900) comprobar(doc().querySelector('.gt-beneficios').getBoundingClientRect().top < alto, 'La siguiente sección aparece en '+ancho+'×'+alto);
        if (pantalla !== 'inicio' && ancho > 900) comprobar(doc().querySelector('.acceso-propuesta').getBoundingClientRect().top < alto/2, pantalla+' mantiene presentación cerca del inicio');
      }
      frame.style.height='900px';
      if (pantalla === 'inicio') {
        comprobar(!doc().querySelector('.gt-demo-lienzo canvas'), '3D no se monta al abrir la portada');
        comprobar(!doc().body.textContent.includes('min aprox'), 'Portada sin ETA inventado');
        const botones = doc().querySelectorAll('.gt-ruta-boton');
        botones[0].click(); await pausa(40); botones[1].click(); await pausa(40);
        comprobar(doc().querySelectorAll('.gt-ruta-expandida').length === 1 && botones[0].getAttribute('aria-expanded') === 'false', 'Una sola ruta expandida');
        botones[1].click(); await pausa(40);
        comprobar(!doc().querySelector('.gt-ruta-expandida'), 'Se puede cerrar la ruta expandida');
        frame.width = 390; await pausa(100);
        const menu = doc().querySelector('.gt-menu'); menu.focus(); menu.click(); await pausa(40);
        comprobar(Boolean(doc().querySelector('#gt-menu-movil')), 'Menú móvil abierto');
        doc().dispatchEvent(new frame.contentWindow.KeyboardEvent('keydown', {key:'Escape',bubbles:true})); await pausa(40);
        comprobar(!doc().querySelector('#gt-menu-movil') && doc().activeElement === menu, 'Escape cierra menú y devuelve foco');
      } else {
        doc().querySelector('form').dispatchEvent(new frame.contentWindow.Event('submit', {bubbles:true,cancelable:true})); await pausa(60);
        comprobar(Boolean(doc().querySelector('[aria-invalid=true]')), pantalla + ' valida campos vacíos sin enviar datos');
        comprobar(doc().activeElement.id === (pantalla === 'registro' ? 'acceso-nombre' : 'acceso-correo'), pantalla + ' enfoca primer error');
        comprobar(doc().querySelectorAll('input').length === (pantalla === 'registro' ? 7 : 2), pantalla + ' conserva campos');
        const valores = {nombre:'Pasajero',apellido:'Ejemplo',dni:'12345678',telefono:'912345678',correo:'qa@example.test',contrasena:'ClavePrueba123',confirmacion:'ClavePrueba123'};
        for (const [clave,valor] of Object.entries(valores)) {
          const input=doc().querySelector('#acceso-'+clave);
          if (!input) continue;
          Object.getOwnPropertyDescriptor(frame.contentWindow.HTMLInputElement.prototype,'value').set.call(input,valor);
          input.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));
        }
        await pausa(40);
        doc().querySelector('.acceso-mostrar').click(); await pausa(40);
        comprobar(doc().querySelector('#acceso-contrasena').type==='text', pantalla+' permite mostrar contraseña');
        const formulario=doc().querySelector('form');
        formulario.dispatchEvent(new frame.contentWindow.Event('submit',{bubbles:true,cancelable:true}));
        formulario.dispatchEvent(new frame.contentWindow.Event('submit',{bubbles:true,cancelable:true}));
        await pausa(40);
        comprobar(doc().querySelector('.acceso-ingresar').disabled, pantalla+' bloquea controles durante envío ficticio');
        await esperar(()=>!doc().querySelector('.acceso-ingresar').disabled);
        comprobar(doc().documentElement.dataset.cuentas==='1', pantalla+' impide doble envío');
        comprobar(Boolean(doc().querySelector('.acceso-aviso[role=alert]')), pantalla+' presenta error remoto ficticio');
      }
    }
    await abrir('inicio&catalogo=vacio');
    comprobar(!doc().querySelector('.gt-ruta-boton') && Boolean(doc().querySelector('.gt-vacio')), 'Catálogo vacío sin rutas ficticias');
    await abrir('inicio&catalogo=error');
    comprobar(!doc().querySelector('.gt-ruta-boton') && Boolean(doc().querySelector('.gt-error')), 'Error real de catálogo sin respaldo ficticio');
    frame.contentWindow.dispatchEvent(new frame.contentWindow.Event('qa-restaurar-api'));
    doc().querySelector('.gt-error button').click(); await esperar(()=>doc().querySelector('.gt-ruta-boton'));
    comprobar(true, 'Reintentar recupera el catálogo');
    informe.textContent += '\nTOTAL: ' + resultados.length + ' comprobaciones aprobadas.';
  } catch (error) { informe.textContent += '\nFALLO: ' + error.message; }
};
if (new URLSearchParams(location.search).get('ejecutar') === '1') document.querySelector('#ejecutar').click();
