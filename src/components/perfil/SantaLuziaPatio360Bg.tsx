import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Compass, Building2, Eye, EyeOff, User as UserIcon, ZoomIn, ZoomOut } from 'lucide-react';
import admin3coracoesImg from '../../assets/images/admin_3coracoes_360_1787085202995.jpg';

interface SantaLuziaPatio360BgProps {
  children?: React.ReactNode;
}

export function SantaLuziaPatio360Bg({ children }: SantaLuziaPatio360BgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isInteractingRef = useRef(false);
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const targetLonRef = useRef(0);
  const targetLatRef = useRef(0);
  // Default wide FOV (105) for zoomed-out panoramic perspective
  const fovRef = useRef(105);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const isAutoRotateRef = useRef(true);
  const [is360Only, setIs360Only] = useState(false);

  useEffect(() => {
    isAutoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!cameraRef.current) return;
    if (direction === 'in') {
      fovRef.current = Math.max(50, fovRef.current - 12);
    } else if (direction === 'out') {
      fovRef.current = Math.min(115, fovRef.current + 12);
    } else {
      fovRef.current = 105;
    }
    cameraRef.current.fov = fovRef.current;
    cameraRef.current.updateProjectionMatrix();
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 1, 2000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Photosphere Geometry for 360 4K Wallpaper
    const sphereGeometry = new THREE.SphereGeometry(950, 180, 90);
    sphereGeometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(admin3coracoesImg, () => {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.colorSpace = THREE.SRGBColorSpace;
    });

    const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphereMesh);

    // 4. Subtle Ambient Floating Dust / Golden Particles
    const particleCount = 160;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 800;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xdfbe85,
      size: 3.5,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 5. Pointer Event Interactions
    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.closest('button') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('a') ||
          target.closest('.prevent-360-drag'))
      ) {
        return;
      }
      isInteractingRef.current = true;
      onPointerDownMouseX = e.clientX;
      onPointerDownMouseY = e.clientY;
      onPointerDownLon = lonRef.current;
      onPointerDownLat = latRef.current;
      if (wrapperRef.current) {
        wrapperRef.current.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isInteractingRef.current) return;
      lonRef.current = (onPointerDownMouseX - e.clientX) * 0.16 + onPointerDownLon;
      latRef.current = (e.clientY - onPointerDownMouseY) * 0.16 + onPointerDownLat;
    };

    const onPointerUp = () => {
      isInteractingRef.current = false;
      if (wrapperRef.current) {
        wrapperRef.current.style.cursor = 'grab';
      }
    };

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.prevent-360-drag')) {
        return;
      }
      e.preventDefault();
      fovRef.current = THREE.MathUtils.clamp(fovRef.current + e.deltaY * 0.05, 50, 115);
      if (cameraRef.current) {
        cameraRef.current.fov = fovRef.current;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    const wrapper = wrapperRef.current || container;
    wrapper.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('wheel', onWheel, { passive: false });

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotateRef.current && !isInteractingRef.current) {
        lonRef.current += 0.04;
      }

      targetLonRef.current += (lonRef.current - targetLonRef.current) * 0.1;
      targetLatRef.current += (latRef.current - targetLatRef.current) * 0.1;
      targetLatRef.current = Math.max(-85, Math.min(85, targetLatRef.current));

      const phi = THREE.MathUtils.degToRad(90 - targetLatRef.current);
      const theta = THREE.MathUtils.degToRad(targetLonRef.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      if (cameraRef.current) {
        cameraRef.current.lookAt(targetX, targetY, targetZ);
      }

      if (particleSystem) {
        particleSystem.rotation.y += 0.0006;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      wrapper.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      wrapper.removeEventListener('wheel', onWheel);

      sphereGeometry.dispose();
      sphereMaterial.dispose();
      texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full min-h-[calc(100vh-6rem)] rounded-3xl overflow-hidden border-2 border-[#c9a265]/40 shadow-2xl bg-[#090d14] cursor-grab select-none"
    >
      {/* 360 WebGL Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Vignette & Depth Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/50 pointer-events-none z-[1]" />

      {/* Top Header HUD Bar */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-40">
        <div className="flex items-center space-x-2 sm:space-x-2.5 bg-[#0b111b]/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-[#c9a265]/60 shadow-xl pointer-events-auto">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[#c9a265]/20 border border-[#c9a265] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dfbe85]" />
          </div>
          <div>
            <h4 className="text-[11px] sm:text-xs font-bold text-white font-serif flex items-center space-x-1.5">
              <span>Sede Administrativa &bull; Grupo 3corações</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#c9a265]/20 border border-[#c9a265]/60 text-[9px] font-mono text-[#dfbe85]">
                4K 360°
              </span>
            </h4>
            <p className="text-[9.5px] sm:text-[10.5px] text-slate-300">
              Centro Executivo Corporativo &bull; Diretoria
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 pointer-events-auto bg-[#0b111b]/85 backdrop-blur-md p-1 rounded-2xl border border-[#232f45] shadow-xl">
          {/* Toggle View Only 360 Mode */}
          <button
            type="button"
            onClick={() => setIs360Only((prev) => !prev)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${
              is360Only
                ? 'bg-gradient-to-r from-[#dfbe85] via-[#c9a265] to-[#a37c3f] text-[#140e06] font-extrabold border border-white/50 ring-2 ring-[#c9a265]/60'
                : 'bg-[#141c2c] text-[#dfbe85] hover:text-white border border-[#c9a265]/50 hover:bg-[#1f2b42]'
            }`}
            title={is360Only ? 'Exibir formulário do perfil' : 'Ocultar perfil e ver apenas o cenário 360°'}
          >
            {is360Only ? (
              <>
                <UserIcon className="w-3.5 h-3.5 text-[#140e06]" />
                <span>Exibir Perfil</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#dfbe85]" />
                <span>Ver Apenas 360°</span>
              </>
            )}
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1f2b42] transition-all cursor-pointer"
            title="Afastar Visão 360° (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1f2b42] transition-all cursor-pointer"
            title="Aproximar Visão 360° (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Auto Rotate Control */}
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isAutoRotate
                ? 'bg-[#c9a265] text-[#140e06] border border-white/30 shadow-md'
                : 'bg-[#141c2c] text-slate-300 hover:text-white border border-[#28374f]'
            }`}
            title={isAutoRotate ? 'Pausar Giro 360°' : 'Ativar Giro 360°'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin-slow' : ''}`} />
            <span className="hidden md:inline">
              {isAutoRotate ? 'Giro Ativo' : 'Pausado'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom HUD Bar (Hint and Return Button) */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between pointer-events-none z-40">
        <div className="flex items-center space-x-2 text-[10.5px] sm:text-[11px] text-[#dfbe85] bg-[#0c111a]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#232f45] shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-[#c9a265]" />
          <span>Arraste para girar &bull; Scroll para zoom</span>
        </div>

        {is360Only && (
          <button
            type="button"
            onClick={() => setIs360Only(false)}
            className="flex items-center space-x-1.5 text-xs font-bold text-white bg-[#0c111a]/95 hover:bg-[#1a2436] backdrop-blur-md px-4 py-2 rounded-xl border border-[#c9a265] shadow-[0_4px_20px_rgba(201,162,101,0.3)] pointer-events-auto cursor-pointer transition-all animate-pulse"
          >
            <UserIcon className="w-4 h-4 text-[#dfbe85]" />
            <span>Voltar ao Meu Perfil</span>
          </button>
        )}
      </div>

      {/* Foreground Content (Profile Card) */}
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto pointer-events-none transition-all duration-300 ${
          is360Only
            ? 'opacity-0 invisible pointer-events-none scale-90 translate-y-6'
            : 'opacity-100 visible scale-100 translate-y-0'
        }`}
      >
        <div className="w-full flex justify-center py-4">
          <div className="prevent-360-drag pointer-events-auto w-full flex justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

