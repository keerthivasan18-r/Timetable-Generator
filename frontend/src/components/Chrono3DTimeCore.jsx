import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Chrono3DFallback from './Chrono3DFallback';

export default function Chrono3DTimeCore() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    // 1. WebGL Support Test
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 2. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    // 3. Camera Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 12);

    // 4. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 5. Lighting
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x080808, 1.5);
    scene.add(ambientLight);

    // Key Directional Light (White/Off-white)
    const keyLight = new THREE.DirectionalLight(0xf2f0eb, 2.2);
    keyLight.position.set(8, 14, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill Light (Muted Champagne Gold)
    const fillLight = new THREE.DirectionalLight(0xc8a878, 1.2);
    fillLight.position.set(-8, 6, 6);
    scene.add(fillLight);

    // Rim Light (Deep Emerald Green)
    const rimLight = new THREE.DirectionalLight(0x145a3c, 1.8);
    rimLight.position.set(0, -6, -8);
    scene.add(rimLight);

    // Point Light Core Glow
    const corePointLight = new THREE.PointLight(0xd8be8c, 1.5, 15);
    corePointLight.position.set(0, 1.8, 0);
    scene.add(corePointLight);

    // 6. Time Core Master Object Group
    const timeCoreGroup = new THREE.Group();
    timeCoreGroup.position.set(0, 1.8, 0);

    // A. Outer Metallic Torus Ring
    const torusGeo = new THREE.TorusGeometry(2.2, 0.18, 32, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      metalness: 0.92,
      roughness: 0.22,
      emissive: 0x8f7448,
      emissiveIntensity: 0.15
    });
    const outerRing = new THREE.Mesh(torusGeo, torusMat);
    outerRing.castShadow = true;
    outerRing.receiveShadow = true;
    timeCoreGroup.add(outerRing);

    // B. Inner Counter-Rotating Orbit Ring
    const innerTorusGeo = new THREE.TorusGeometry(1.6, 0.08, 24, 80);
    const innerTorusMat = new THREE.MeshStandardMaterial({
      color: 0xc8a878,
      metalness: 0.88,
      roughness: 0.28,
      wireframe: false
    });
    const innerRing = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    innerRing.rotation.x = Math.PI / 3;
    timeCoreGroup.add(innerRing);

    // C. Central Faceted AI Core Symbol (Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(0.85, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x101010,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xc8a878,
      emissiveIntensity: 0.3,
      flatShading: true
    });
    const aiCore = new THREE.Mesh(coreGeo, coreMat);
    aiCore.castShadow = true;
    timeCoreGroup.add(aiCore);

    // D. Small Orbital Markers (Representing Periods / Slots)
    const markerGroup = new THREE.Group();
    const markerGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x38a169,
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0x1f6b4a,
      emissiveIntensity: 0.5
    });

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
      markerGroup.add(marker);
    }
    timeCoreGroup.add(markerGroup);

    scene.add(timeCoreGroup);

    // 7. Architectural Timetable Blocks Progression
    const blocksGroup = new THREE.Group();
    blocksGroup.position.set(0, -2.2, 0);

    const blockHeights = [1.2, 1.8, 2.4, 2.0, 3.0, 1.6];
    const blockCount = blockHeights.length;
    const blockWidth = 0.9;
    const blockDepth = 0.9;
    const spacing = 1.3;
    const startX = -((blockCount - 1) * spacing) / 2;

    blockHeights.forEach((h, idx) => {
      const boxGeo = new THREE.BoxGeometry(blockWidth, h, blockDepth);
      const isHighlighted = idx === 4; // Period 5 highlight

      const boxMat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0x1c1c1c : 0x101010,
        metalness: 0.7,
        roughness: 0.45,
        emissive: isHighlighted ? 0x8f7448 : 0x050505,
        emissiveIntensity: isHighlighted ? 0.25 : 0
      });

      const blockMesh = new THREE.Mesh(boxGeo, boxMat);
      blockMesh.position.set(startX + idx * spacing, h / 2 - 1.5, (idx - blockCount / 2) * 0.2);
      blockMesh.castShadow = true;
      blockMesh.receiveShadow = true;
      blocksGroup.add(blockMesh);
    });

    scene.add(blocksGroup);

    // 8. Ground Reflection Plane
    const planeGeo = new THREE.PlaneGeometry(30, 30);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.6,
      metalness: 0.8
    });
    const groundPlane = new THREE.Mesh(planeGeo, planeMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -3.2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // 9. Mouse Tracking & Damped Camera Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetMouseX = (x / rect.width - 0.5) * 2;
      targetMouseY = (y / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 10. Reduced Motion Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 11. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Continuous slow rotators
        outerRing.rotation.z += 0.002;
        outerRing.rotation.x += 0.001;
        innerRing.rotation.y -= 0.004;
        innerRing.rotation.z += 0.002;
        aiCore.rotation.y += 0.005;
        markerGroup.rotation.z -= 0.003;

        // Floating vertical oscillation
        timeCoreGroup.position.y = 1.8 + Math.sin(elapsedTime * 0.8) * 0.15;

        // Smooth camera lerp parallax
        currentMouseX += (targetMouseX - currentMouseX) * 0.05;
        currentMouseY += (targetMouseY - currentMouseY) * 0.05;

        camera.position.x = currentMouseX * 1.2;
        camera.position.y = 2.5 - currentMouseY * 0.8;
        camera.lookAt(0, 0.5, 0);
      } else {
        camera.lookAt(0, 0.5, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  if (!webGlSupported) {
    return <Chrono3DFallback />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#050505'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
