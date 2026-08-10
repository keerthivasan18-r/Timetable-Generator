import React, { useEffect, useRef } from 'react';

export default function ChronoCanvasBackground({ theme = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for subtle ambient parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating Ambient Glass Orbs
    const isDark = theme === 'dark';
    const orbs = [
      {
        x: width * 0.2,
        y: height * 0.2,
        radius: isDark ? 300 : 320,
        vx: 0.3,
        vy: 0.2,
        color: isDark ? 'rgba(200, 168, 120, 0.025)' : 'rgba(0, 113, 227, 0.05)',
      },
      {
        x: width * 0.8,
        y: height * 0.3,
        radius: isDark ? 340 : 360,
        vx: -0.2,
        vy: 0.3,
        color: isDark ? 'rgba(20, 90, 60, 0.025)' : 'rgba(94, 92, 230, 0.04)',
      },
      {
        x: width * 0.5,
        y: height * 0.8,
        radius: isDark ? 360 : 380,
        vx: 0.25,
        vy: -0.2,
        color: isDark ? 'rgba(216, 190, 140, 0.02)' : 'rgba(52, 199, 89, 0.03)',
      },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // 1. Draw Orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -100 || orb.x > width + 100) orb.vx *= -1;
        if (orb.y < -100 || orb.y > height + 100) orb.vy *= -1;

        // Mouse influence offset
        const offsetX = (mouseX - width / 2) * 0.04;
        const offsetY = (mouseY - height / 2) * 0.04;

        const gradient = ctx.createRadialGradient(
          orb.x + offsetX,
          orb.y + offsetY,
          0,
          orb.x + offsetX,
          orb.y + offsetY,
          orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x + offsetX, orb.y + offsetY, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw Nothing OS subtle dot grid
      const dotSpacing = 32;
      const dotRadius = theme === 'dark' ? 0.8 : 0.9;
      const dotColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';

      ctx.fillStyle = dotColor;
      for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
          // Distance from mouse for subtle dot glow
          const dx = x - mouseX;
          const dy = y - mouseY;
          const distSq = dx * dx + dy * dy;

          if (distSq < 140 * 140) {
            const opacity = (1 - Math.sqrt(distSq) / 140) * (theme === 'dark' ? 0.15 : 0.12);
            ctx.fillStyle = theme === 'dark' ? `rgba(255, 255, 255, ${0.04 + opacity})` : `rgba(0, 113, 227, ${0.04 + opacity})`;
          } else {
            ctx.fillStyle = dotColor;
          }

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
