import * as THREE from 'three';
import type { MicroInicio, RutaInicio } from '../datos/tipos-inicio';
import { proyectarRutas } from './proyeccion';
import type { RutaPlana } from './proyeccion';

export interface OpcionesEscena {
  contenedor: HTMLDivElement;
  rutas: readonly RutaInicio[];
  micros: readonly MicroInicio[];
  mostrarBusesDemo?: boolean;
}

export interface EscenaBuses {
  destruir: () => void;
}

interface BusAnimado {
  grupo: THREE.Group;
  curva: THREE.CatmullRomCurve3;
  progreso: number;
  velocidad: number;
}

interface RutaEscena {
  ruta: RutaPlana;
  curva: THREE.CatmullRomCurve3;
  tubo: THREE.Mesh;
  brillo: THREE.Mesh;
}

const COLOR_PLANO = 0x081b3d;
const ALTURA_RUTA = 0.12;

function aleatorio(indice: number): number {
  const valor = Math.sin(indice * 12.9898 + 78.233) * 43758.5453;
  return valor - Math.floor(valor);
}

function crearBus(color: string): THREE.Group {
  const grupo = new THREE.Group();
  const colorRuta = new THREE.Color(color);

  const materialCarroceria = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.42,
    metalness: 0.18,
  });
  const materialFranja = new THREE.MeshStandardMaterial({
    color: colorRuta,
    roughness: 0.35,
    metalness: 0.2,
    emissive: colorRuta,
    emissiveIntensity: 0.18,
  });
  const materialTecho = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.55,
    metalness: 0.1,
  });
  const materialVidrio = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.18,
    metalness: 0.72,
  });
  const materialRueda = new THREE.MeshStandardMaterial({
    color: 0x020617,
    roughness: 0.95,
  });
  const materialLuz = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });

  const carroceria = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.98), materialCarroceria);
  carroceria.position.y = 0.31;
  grupo.add(carroceria);

  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.59, 0.09, 0.99), materialFranja);
  franja.position.y = 0.28;
  grupo.add(franja);

  const techo = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.86), materialTecho);
  techo.position.y = 0.51;
  grupo.add(techo);

  const parabrisas = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.025), materialVidrio);
  parabrisas.position.set(0, 0.36, 0.497);
  grupo.add(parabrisas);

  const ventanaLateralDerecha = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.13, 0.5), materialVidrio);
  ventanaLateralDerecha.position.set(0.296, 0.35, -0.03);
  grupo.add(ventanaLateralDerecha);

  const ventanaLateralIzquierda = ventanaLateralDerecha.clone();
  ventanaLateralIzquierda.position.x = -0.296;
  grupo.add(ventanaLateralIzquierda);

  const geometriaRueda = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12);
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.29, 0.29]) {
      const rueda = new THREE.Mesh(geometriaRueda, materialRueda);
      rueda.rotation.z = Math.PI / 2;
      rueda.position.set(x, 0.13, z);
      grupo.add(rueda);
    }
  }

  for (const x of [-0.18, 0.18]) {
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), materialLuz);
    luz.position.set(x, 0.25, 0.5);
    grupo.add(luz);
  }

  return grupo;
}

function crearRuta(ruta: RutaPlana): RutaEscena {
  const puntos = ruta.puntos.map(punto => new THREE.Vector3(punto.x, ALTURA_RUTA, punto.z));
  const curva = new THREE.CatmullRomCurve3(puntos, false, 'centripetal', 0.5);
  const color = new THREE.Color(ruta.color);

  const tubo = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 96, 0.045, 6, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );

  const brillo = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 96, 0.12, 6, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  return { ruta, curva, tubo, brillo };
}

/**
 * Crea una escena Three.js autocontenida. El componente React solo se encarga
 * de montar y desmontar; toda la animación y la limpieza viven aquí.
 */
export function crearEscenaBuses({ contenedor, rutas, micros, mostrarBusesDemo = false }: OpcionesEscena): EscenaBuses {
  const rutasPlanas = proyectarRutas(rutas, 8);
  if (rutasPlanas.length === 0) throw new Error('No hay rutas con trazado suficiente.');

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camara.position.set(0, 6.2, 8.6);
  camara.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(COLOR_PLANO, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  contenedor.appendChild(renderer.domElement);

  const mapa = new THREE.Group();
  escena.add(mapa);

  escena.add(new THREE.HemisphereLight(0xbfdbfe, 0x081b3d, 1.2));
  const luzDireccional = new THREE.DirectionalLight(0xffffff, 2.1);
  luzDireccional.position.set(4, 8, 5);
  escena.add(luzDireccional);
  const luzAzul = new THREE.PointLight(0x38bdf8, 16, 28);
  luzAzul.position.set(-5, 3, -2);
  escena.add(luzAzul);

  const plano = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
      color: 0x0b1d3a,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
    }),
  );
  plano.rotation.x = -Math.PI / 2;
  plano.position.y = -0.1;
  mapa.add(plano);

  const cuadricula = new THREE.GridHelper(20, 24, 0x1d4ed8, 0x1e3a8a);
  const materialesCuadricula = Array.isArray(cuadricula.material) ? cuadricula.material : [cuadricula.material];
  for (const material of materialesCuadricula) {
    material.transparent = true;
    material.opacity = 0.24;
  }
  cuadricula.position.y = -0.06;
  mapa.add(cuadricula);

  const geometriaEdificio = new THREE.BoxGeometry(1, 1, 1);
  const materialEdificio = new THREE.MeshStandardMaterial({
    color: 0x12305f,
    roughness: 0.74,
    metalness: 0.12,
    transparent: true,
    opacity: 0.66,
  });

  for (let indice = 0; indice < 42; indice += 1) {
    const x = (aleatorio(indice * 3 + 1) - 0.5) * 15;
    const z = (aleatorio(indice * 3 + 2) - 0.5) * 15;
    if (Math.abs(x) < 2.4 && Math.abs(z) < 2.4) continue;

    const altura = 0.16 + aleatorio(indice * 3 + 3) * 0.42;
    const ancho = 0.3 + aleatorio(indice * 7 + 1) * 0.46;
    const profundidad = 0.3 + aleatorio(indice * 11 + 2) * 0.46;
    const edificio = new THREE.Mesh(geometriaEdificio, materialEdificio);
    edificio.position.set(x, altura / 2 - 0.04, z);
    edificio.scale.set(ancho, altura, profundidad);
    mapa.add(edificio);
  }

  const rutasEscena: RutaEscena[] = [];
  const geometriaParadero = new THREE.SphereGeometry(0.07, 12, 12);
  const materialParadero = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (const ruta of rutasPlanas) {
    const rutaDibujada = crearRuta(ruta);
    mapa.add(rutaDibujada.tubo, rutaDibujada.brillo);

    for (const punto of ruta.puntos) {
      const paradero = new THREE.Mesh(geometriaParadero, materialParadero);
      paradero.position.set(punto.x, ALTURA_RUTA + 0.04, punto.z);
      mapa.add(paradero);
    }

    rutasEscena.push(rutaDibujada);
  }

  const buses: BusAnimado[] = [];
  const busesPorRuta = new Map<number, number>();

  for (const ruta of rutasEscena) {
    const microsDeRuta = micros.filter(micro => micro.rutaId === ruta.ruta.id);
    const asignados = busesPorRuta.get(ruta.ruta.id) ?? 0;

    if (mostrarBusesDemo && microsDeRuta.length === 0 && asignados === 0) {
      const bus = crearBus(ruta.ruta.color);
      mapa.add(bus);
      buses.push({
        grupo: bus,
        curva: ruta.curva,
        progreso: 0.18,
        velocidad: 0.034,
      });
      busesPorRuta.set(ruta.ruta.id, 1);
      continue;
    }

    for (let indiceMicro = 0; indiceMicro < microsDeRuta.length; indiceMicro += 1) {
      if (buses.length >= 6) break;
      const bus = crearBus(ruta.ruta.color);
      mapa.add(bus);
      buses.push({
        grupo: bus,
        curva: ruta.curva,
        progreso: 0.12 + buses.length * 0.16,
        velocidad: 0.03 + (buses.length % 3) * 0.006,
      });
      busesPorRuta.set(ruta.ruta.id, (busesPorRuta.get(ruta.ruta.id) ?? 0) + 1);
    }
  }

  function colocarBuses(): void {
    for (const bus of buses) {
      const posicion = bus.curva.getPointAt(bus.progreso % 1);
      const tangente = bus.curva.getTangentAt(bus.progreso % 1);
      bus.grupo.position.set(posicion.x, ALTURA_RUTA, posicion.z);
      bus.grupo.lookAt(posicion.x + tangente.x, ALTURA_RUTA, posicion.z + tangente.z);
    }
  }

  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cuadro = 0;
  let visible = true;
  let destruida = false;
  let ultimoTiempo = performance.now();
  let tiempo = 0;

  function renderizar(): void {
    renderer.render(escena, camara);
  }

  function animar(): void {
    if (destruida) return;
    const ahora = performance.now();
    const delta = Math.min((ahora - ultimoTiempo) / 1000, 0.05);
    ultimoTiempo = ahora;
    tiempo += delta;

    for (const bus of buses) {
      bus.progreso = (bus.progreso + delta * bus.velocidad) % 1;
    }
    colocarBuses();

    mapa.rotation.y = Math.sin(tiempo * 0.12) * 0.045;
    camara.position.x = Math.sin(tiempo * 0.16) * 0.22;
    camara.lookAt(0, 0, 0);
    renderizar();
    cuadro = requestAnimationFrame(animar);
  }

  function detener(): void {
    if (cuadro !== 0) {
      cancelAnimationFrame(cuadro);
      cuadro = 0;
    }
  }

  function iniciar(): void {
    if (movimientoReducido || destruida || !visible || document.hidden) return;
    detener();
    ultimoTiempo = performance.now();
    cuadro = requestAnimationFrame(animar);
  }

  function redimensionar(): void {
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    if (ancho === 0 || alto === 0) return;

    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    renderer.setSize(ancho, alto, false);
    if (movimientoReducido) {
      colocarBuses();
      renderizar();
    }
  }

  const observadorTamano = new ResizeObserver(redimensionar);
  observadorTamano.observe(contenedor);

  const observadorVisibilidad = new IntersectionObserver(entradas => {
    visible = entradas[0]?.isIntersecting ?? true;
    if (visible) iniciar();
    else detener();
  }, { threshold: 0.05 });
  observadorVisibilidad.observe(contenedor);

  function alCambiarVisibilidad(): void {
    if (document.hidden) detener();
    else iniciar();
  }
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  redimensionar();
  colocarBuses();
  renderizar();

  if (!movimientoReducido) {
    ultimoTiempo = performance.now();
    cuadro = requestAnimationFrame(animar);
  }

  return {
    destruir() {
      destruida = true;
      detener();
      observadorTamano.disconnect();
      observadorVisibilidad.disconnect();
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);

      escena.traverse(objeto => {
        const objetoConGeometria = objeto as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        objetoConGeometria.geometry?.dispose();
        const materiales = Array.isArray(objetoConGeometria.material)
          ? objetoConGeometria.material
          : objetoConGeometria.material
            ? [objetoConGeometria.material]
            : [];
        for (const material of materiales) material.dispose();
      });

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === contenedor) {
        contenedor.removeChild(renderer.domElement);
      }
    },
  };
}
