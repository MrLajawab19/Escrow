import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uTheme; // 0.0 for light, 1.0 for dark

varying vec2 vUv;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    float t = uTime * 0.12;

    // Define colors
    vec3 lightBase = vec3(1.0, 1.0, 1.0);
    vec3 darkBase = vec3(3.0/255.0, 7.0/255.0, 18.0/255.0); // Deep Navy
    vec3 baseColor = mix(lightBase, darkBase, uTheme);

    // Make colors significantly brighter and more vibrant/neon
    vec3 indigo = mix(vec3(99., 102., 241.)/255., vec3(129., 140., 255.)/255., uTheme); 
    vec3 violet = mix(vec3(139., 92., 246.)/255., vec3(192., 132., 252.)/255., uTheme); 
    vec3 cyan   = mix(vec3(34., 211., 238.)/255., vec3(103., 232., 249.)/255., uTheme); 
    vec3 pink   = mix(vec3(236., 72., 153.)/255., vec3(244., 114., 182.)/255., uTheme); 
    vec3 orange = mix(vec3(251., 146., 60.)/255., vec3(253., 186., 116.)/255., uTheme); 

    // Rotate coordinate system to create a diagonal flow (bottom-left to top-right)
    float angle = 0.35; 
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 rp = rot * p;

    // Define 3 main sweeping ribbons (y position varies with x and time)
    // Ribbon 1 (Main Central)
    float y1 = sin(rp.x * 0.9 + t) * 0.4 + cos(rp.x * 0.5 - t * 0.8) * 0.3;
    float d1 = abs(rp.y - y1);
    float m1 = smoothstep(0.6, 0.0, d1); // Tighter thickness for clarity

    // Ribbon 2 (Lower offset)
    float y2 = sin(rp.x * 1.1 - t * 1.1) * 0.3 + cos(rp.x * 0.6 + t * 0.9) * 0.4 - 0.4;
    float d2 = abs(rp.y - y2);
    float m2 = smoothstep(0.5, 0.0, d2);

    // Ribbon 3 (Upper offset)
    float y3 = sin(rp.x * 0.8 + t * 1.3) * 0.5 + cos(rp.x * 0.7 - t * 0.7) * 0.2 + 0.5;
    float d3 = abs(rp.y - y3);
    float m3 = smoothstep(0.7, 0.0, d3);

    // Create color gradients along the X axis for each ribbon
    // rp.x goes roughly from -2.0 to 2.0
    float gx = clamp((rp.x + 2.0) / 4.0, 0.0, 1.0);
    
    // Reduce Orange spread (ends sooner) and transition smoothly
    // C1: Orange -> Pink -> Violet -> Indigo
    vec3 c1 = mix(orange, pink, smoothstep(0.0, 0.15, gx));
    c1 = mix(c1, violet, smoothstep(0.15, 0.5, gx));
    c1 = mix(c1, indigo, smoothstep(0.5, 1.0, gx));

    // C2 (lower): Pink -> Violet -> Indigo -> Cyan
    vec3 c2 = mix(pink, violet, smoothstep(0.0, 0.4, gx));
    c2 = mix(c2, indigo, smoothstep(0.4, 0.7, gx));
    c2 = mix(c2, cyan, smoothstep(0.7, 1.0, gx));

    // C3 (upper): Violet -> Indigo -> Cyan
    vec3 c3 = mix(violet, indigo, smoothstep(0.0, 0.5, gx));
    c3 = mix(c3, cyan, smoothstep(0.5, 1.0, gx));

    // Readability mask (Keep text area clean)
    vec2 domUV = vec2(uv.x, 1.0 - uv.y);
    float readMask = smoothstep(0.2, 0.7, length(vec2((domUV.x - 0.25)*1.5, (domUV.y - 0.45)*1.2)));
    readMask += smoothstep(0.4, 0.9, domUV.x) * 0.7; // Allow color on right
    readMask += smoothstep(0.6, 1.0, domUV.y) * 0.6; // Allow color on bottom
    readMask = clamp(readMask, 0.05, 1.0); // minimum intensity

    // Blend everything
    vec3 col = baseColor;
    
    // Base opacity multiplier - increase base opacity for clarity
    float baseOp = mix(0.6, 0.95, uTheme) * readMask;

    // Layer the ribbons back to front: 3, 2, 1
    col = mix(col, c3, m3 * baseOp * 0.85);
    col = mix(col, c2, m2 * baseOp * 0.95);
    col = mix(col, c1, m1 * baseOp);

    // Add glowing ridges - sharpen slightly for better wave definition
    float r1 = smoothstep(0.15, 0.0, d1) * 0.6;
    float r2 = smoothstep(0.12, 0.0, d2) * 0.5;
    float r3 = smoothstep(0.12, 0.0, d3) * 0.4;
    
    // Use the underlying gradient color mixed with white
    vec3 hl1 = mix(c1, vec3(1.0), 0.35);
    vec3 hl2 = mix(c2, vec3(1.0), 0.35);
    vec3 hl3 = mix(c3, vec3(1.0), 0.35);
    
    float hlOp = mix(0.6, 1.0, uTheme) * readMask;
    
    col += r3 * hl3 * hlOp;
    col += r2 * hl2 * hlOp;
    col += r1 * hl1 * hlOp;

    gl_FragColor = vec4(col, 1.0);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ShaderPlane = ({ themeMode }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport, size } = useThree();

  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTheme: { value: themeMode === 'dark' ? 1.0 : 0.0 },
    }),
    []
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
      materialRef.current.uniforms.uTheme.value = themeMode === 'dark' ? 1.0 : 0.0;
    }
  }, [size, themeMode]);

  useFrame((state, delta) => {
    if (materialRef.current && !reducedMotion) {
      // Advance time for continuous fluid motion
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
};

const HeroFlowShader = () => {
  const [inView, setInView] = useState(true);
  const containerRef = useRef();
  const [webGLFailed, setWebGLFailed] = useState(false);
  
  // Read theme from html class (consistent with the rest of the app)
  const [themeMode, setThemeMode] = useState('light');

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeMode(isDark ? 'dark' : 'light');
    };
    checkTheme();
    
    // We can observe class changes using MutationObserver
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white dark:bg-navy-950" 
      aria-hidden="true"
    >
      {webGLFailed ? (
        <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-50 to-white dark:from-navy-950 dark:via-navy-900 dark:to-navy-950" />
      ) : (
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          frameloop={inView ? 'always' : 'demand'}
          onError={() => setWebGLFailed(true)}
        >
          <ShaderPlane themeMode={themeMode} />
        </Canvas>
      )}
    </div>
  );
};

export default HeroFlowShader;
