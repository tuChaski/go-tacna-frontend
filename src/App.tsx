import React, { useState, useEffect, useRef } from 'react';
import { 
  Bus, 
  ArrowRight, 
  CheckCircle2, 
  Radio, 
  Layers, 
  Clock, 
  Compass,
  Cpu
} from 'lucide-react';
import * as THREE from 'three';

export default function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- SCENE & CAMERA SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070f, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    currentMount.appendChild(renderer.domElement);

    // --- PARTICLES CLOUD (3D NEBULA DE PUNTOS GPS) ---
    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = Float32Array.from(
      Array.from({ length: particleCount * 3 }, (_, i) => {
        // Alternar entre cian, azul profundo y púrpura neón
        if (i % 3 === 0) return 0.1 + Math.random() * 0.3; // R
        if (i % 3 === 1) return 0.5 + Math.random() * 0.5; // G
        return 0.9 + Math.random() * 0.1;                  // B
      })
    );

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = (Math.random() - 0.5) * 120;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Generar textura de partícula suave
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.5, 'rgba(0,180,255,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- CENTRO 3D HOLOGRAMA (NODO DE TRÁFICO TACNA) ---
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Icosaedro holográfico central
    const icoGeo = new THREE.IcosahedronGeometry(8, 2);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(icoMesh);

    // Anillos de radar orbitales
    const ringGeo = new THREE.TorusGeometry(12, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    coreGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh2.rotation.y = Math.PI / 4;
    coreGroup.add(ringMesh2);

    // --- INTERACTIVIDAD Y PARALLAX ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX) * 0.05;
      mouseY = (event.clientY - windowHalfY) * 0.05;
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Suavizado de movimiento de cámara (Efecto cine/Active Theory)
      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;

      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      // Rotación de las partículas y el núcleo
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = elapsedTime * 0.01;

      coreGroup.rotation.y = elapsedTime * 0.15;
      coreGroup.rotation.x = elapsedTime * 0.08;

      ringMesh1.rotation.z = elapsedTime * 0.2;
      ringMesh2.rotation.z = -elapsedTime * 0.25;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 overflow-x-hidden font-mono selection:bg-cyan-500 selection:text-black relative">
      
      {/* 3D WebGL Canvas Background */}
      <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Cinematic Film Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Cyber Grid Lines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-black/80" />

      {/* --- HUD HEADER --- */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between border-b border-cyan-500/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none border border-cyan-400 bg-cyan-950/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Bus className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-widest text-white flex items-center gap-2">
              GO-TACNA <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">v1.0</span>
            </span>
            <span className="block text-[9px] tracking-[0.3em] text-cyan-400/70 uppercase">
              // URBAN TRANSIT SYSTEM
            </span>
          </div>
        </div>

        {/* Status Widget Active Theory Style */}
        <div className="hidden md:flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-cyan-500/20 rounded-none">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-slate-400">NODES ONLINE:</span>
            <span className="text-cyan-400 font-bold">142</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-black/60 border border-purple-500/20 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>LATENCY:</span>
            <span className="text-purple-400 font-bold">12ms</span>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 pt-16 pb-24">
        
        {/* Navigation Selector Active Theory Style */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 bg-black/80 border border-white/10 backdrop-blur-xl">
            {['ALL', 'SYSTEM', 'LIVE MAP', 'ROUTES'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-xs font-bold tracking-widest transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-950/30 border border-cyan-500/30 mb-8 backdrop-blur-xl">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-cyan-300">
              PRÓXIMO DESPLIEGUE // TACNA - PERÚ
            </span>
          </div>

          <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-8 uppercase text-white mix-blend-difference">
            EL TRANSPORTE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
              EN TIEMPO REAL
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-sans font-light leading-relaxed mb-12">
            Transformando la movilidad urbana en Tacna con telemetría GPS, cálculo predictivo de llegada y mapas interactivos de alta frecuencia.
          </p>

          {/* Formulario Estilo Cyberpunk / Active Theory */}
          <div className="max-w-md mx-auto mb-24">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-none blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative flex bg-black border border-cyan-500/50 p-1.5">
                  <input
                    type="email"
                    required
                    placeholder="INGRESA TU EMAIL PARA ACCESO VIP..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs tracking-wider transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>NOTIFICARME</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-cyan-950/80 border border-cyan-400 text-cyan-300 flex items-center justify-center gap-3 backdrop-blur-xl animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <span className="text-xs tracking-wider">
                  SOLICITUD REGISTRADA // TE NOTIFICAREMOS EL DÍA DEL LANZAMIENTO.
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-3 tracking-widest uppercase">
              [ ACCESO ANTICIPADO // SIN SPAM ]
            </p>
          </div>

        </div>

        {/* --- 3D FLOATING CARDS (HOLOGRAPHIC STYLE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          <div className="group relative p-8 bg-black/60 border border-cyan-500/20 hover:border-cyan-400/80 transition-all duration-500 backdrop-blur-xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center mb-6 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-cyan-400 tracking-widest block mb-1">// MODULE 01</span>
            <h3 className="text-lg font-bold text-white mb-3">TELEMETRÍA EN VIVO</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Rastreo satelital constante de las unidades en tiempo real con actualización de coordenadas instantánea.
            </p>
          </div>

          <div className="group relative p-8 bg-black/60 border border-purple-500/20 hover:border-purple-400/80 transition-all duration-500 backdrop-blur-xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-400/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 bg-purple-950/50 border border-purple-500/40 flex items-center justify-center mb-6 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-purple-400 tracking-widest block mb-1">// MODULE 02</span>
            <h3 className="text-lg font-bold text-white mb-3">CÁLCULO ETA PREDICTIVO</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Algoritmo de estimación de tiempo de llegada a paraderos considerando la velocidad promedio del flujo vehicular.
            </p>
          </div>

          <div className="group relative p-8 bg-black/60 border border-blue-500/20 hover:border-blue-400/80 transition-all duration-500 backdrop-blur-xl hover:-translate-y-2">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400/60 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-12 h-12 bg-blue-950/50 border border-blue-500/40 flex items-center justify-center mb-6 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-blue-400 tracking-widest block mb-1">// MODULE 03</span>
            <h3 className="text-lg font-bold text-white mb-3">MAPA DE RUTAS TACNA</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Catálogo completo e interactivo con los recorridos oficiales de todas las líneas de transporte urbano de la ciudad.
            </p>
          </div>

        </div>

      </main>

      {/* --- FOOTER CIBERNÉTICO --- */}
      <footer className="relative z-20 border-t border-cyan-500/10 py-8 px-6 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
            <span>SYSTEM STATUS: NORMAL // GO-TACNA PROJECT {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-400 uppercase">// TACNA - PERÚ</span>
            <span className="text-cyan-400">[ THREE.JS + REACT ENGINE ]</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
