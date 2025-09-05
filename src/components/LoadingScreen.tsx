import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

interface LoadingScreenProps {
  audioFile?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface OrbitingDot {
  angle: number;
  radius: number;
  size: number;
  color: string;
  speed: number;
  x: number;
  y: number;
}

interface EnergyRing {
  radius: number;
  thickness: number;
  color: string;
  rotation: number;
  speed: number;
  alpha: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  audioFile
}) => {
  const [audioStarted, setAudioStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const orbitingDotsRef = useRef<OrbitingDot[]>([]);
  const energyRingsRef = useRef<EnergyRing[]>([]);
  const timeRef = useRef(0);

  // Initialize canvas and all systems
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with trails
    const initParticles = () => {
      particlesRef.current = [];
      const colors = [
        '#8B5CF6', '#EC4899', '#3B82F6', '#06B6D4', '#F59E0B', '#10B981', '#F472B6', '#A78BFA'
      ];
      
      for (let i = 0; i < 200; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 4 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.9 + 0.1,
          life: Math.random() * 200,
          maxLife: 200,
          trail: []
        });
      }
    };

    // Initialize orbiting dots
    const initOrbitingDots = () => {
      orbitingDotsRef.current = [];
      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#06B6D4', '#F59E0B'];
      
      for (let i = 0; i < 5; i++) {
        orbitingDotsRef.current.push({
          angle: (i / 5) * Math.PI * 2,
          radius: 120,
          size: 6 + Math.random() * 4,
          color: colors[i],
          speed: 0.02 + Math.random() * 0.01,
          x: 0,
          y: 0
        });
      }
    };

    // Initialize energy rings
    const initEnergyRings = () => {
      energyRingsRef.current = [];
      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#06B6D4', '#F59E0B'];
      
      for (let i = 0; i < 6; i++) {
        energyRingsRef.current.push({
          radius: 60 + i * 30,
          thickness: 2 + Math.random() * 2,
          color: colors[i % colors.length],
          rotation: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.01,
          alpha: 0.3 - i * 0.05
        });
      }
    };

    initParticles();
    initOrbitingDots();
    initEnergyRings();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.016; // 60fps

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Update and draw particles with trails
      particlesRef.current.forEach((particle) => {
        // Add current position to trail
        particle.trail.push({ x: particle.x, y: particle.y, alpha: particle.alpha });
        if (particle.trail.length > 10) {
          particle.trail.shift();
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;

        // Add some attraction to center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          particle.vx += (dx / distance) * 0.001;
          particle.vy += (dy / distance) * 0.001;
        }

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Reset particle if life is over
        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.life = particle.maxLife;
          particle.alpha = Math.random() * 0.9 + 0.1;
          particle.trail = [];
        }

        // Draw particle trail
        particle.trail.forEach((point, index) => {
          const trailAlpha = (index / particle.trail.length) * particle.alpha * 0.5;
          ctx.save();
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.alpha * (particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update and draw orbiting dots
      orbitingDotsRef.current.forEach((dot) => {
        dot.angle += dot.speed;
        dot.x = centerX + Math.cos(dot.angle) * dot.radius;
        dot.y = centerY + Math.sin(dot.angle) * dot.radius;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = dot.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw energy rings
      energyRingsRef.current.forEach((ring) => {
        ring.rotation += ring.speed;
        
        ctx.save();
        ctx.globalAlpha = ring.alpha;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.thickness;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ring.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Central pulsing orb with advanced effects
      const pulseSize = 25 + Math.sin(timeRef.current * 4) * 8;
      const glowSize = pulseSize + 20;
      
      // Outer glow
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
      outerGlow.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
      outerGlow.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
      outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
      
      ctx.save();
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Main orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.3, 'rgba(236, 72, 153, 0.8)');
      gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.7)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
      
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#8B5CF6';
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner core
      const coreSize = pulseSize * 0.4;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize);
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      coreGradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
      
      ctx.save();
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Energy waves
      for (let i = 0; i < 8; i++) {
        const waveRadius = 80 + Math.sin(timeRef.current * 3 + i) * 30;
        const waveAlpha = 0.1 + Math.sin(timeRef.current * 2 + i) * 0.1;
        
        ctx.save();
        ctx.globalAlpha = waveAlpha;
        ctx.strokeStyle = `hsl(${240 + i * 20}, 80%, 70%)`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${240 + i * 20}, 80%, 70%)`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Advanced GSAP animations for UI elements
  useEffect(() => {
    const masterTimeline = gsap.timeline({ repeat: -1 });
    
    // Create complex animation sequence
    masterTimeline
      // Central orb pulsing
      .to('.central-orb', {
        scale: 1.3,
        duration: 2,
        ease: 'power2.inOut'
      })
      .to('.central-orb', {
        scale: 1,
        duration: 2,
        ease: 'power2.inOut'
      })
      // Add rotation to central orb
      .to('.central-orb', {
        rotation: 360,
        duration: 8,
        ease: 'none'
      }, 0);

    // Animate loading dots with complex patterns
    gsap.to('.loading-dot', {
      y: -15,
      scale: 1.2,
      duration: 0.8,
      stagger: {
        amount: 1,
        from: 'random'
      },
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });

    // Add rotation to dots
    gsap.to('.loading-dot', {
      rotation: 360,
      duration: 3,
      stagger: 0.2,
      repeat: -1,
      ease: 'none'
    });

    // Animate audio button with advanced effects
    if (audioFile && !audioStarted) {
      gsap.fromTo('.audio-button', 
        { 
          scale: 0.5, 
          opacity: 0, 
          y: 50,
          rotation: -10
        },
        { 
          scale: 1, 
          opacity: 1, 
          y: 0,
          rotation: 0,
          duration: 1.2, 
          ease: 'back.out(1.7)' 
        }
      );

      // Add continuous hover effect
      gsap.to('.audio-button', {
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }

    // Add ambient background animations
    gsap.to('.ambient-bg-1', {
      opacity: 0.3,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });

    gsap.to('.ambient-bg-2', {
      opacity: 0.2,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
      delay: 1
    });

    return () => {
      masterTimeline.kill();
    };
  }, [audioFile, audioStarted]);

  // AUTO-START DJ Barry audio when component mounts - MAKE IT PERSIST GLOBALLY
  useEffect(() => {
    if (audioFile && !audioStarted) {
      console.log('🎵 AUTO-STARTING DJ Barry audio:', audioFile);
      
      // Check if we already have a global DJ Barry audio playing
      if ((window as any).djBarryAudio && !(window as any).djBarryAudio.ended) {
        console.log('✅ DJ Barry audio already playing globally - reusing');
        setAudioStarted(true);
        return;
      }
      
      // Create GLOBAL audio object that persists after component unmounts
      const audio = new Audio(audioFile);
      audio.volume = 0.7;
      audio.loop = false; // Play once fully
      
      // Store globally so it doesn't stop when LoadingScreen unmounts
      (window as any).djBarryAudio = audio;
      
      // Add event listener to mark as finished when it ends
      audio.addEventListener('ended', () => {
        console.log('✅ DJ Barry audio finished playing completely');
        (window as any).djBarryAudio = null;
      });
      
      audio.play()
        .then(() => {
          console.log('✅ DJ Barry audio AUTO-PLAYING! Will continue after loading screen...');
          setAudioStarted(true);
        })
        .catch((error) => {
          console.log('⚠️ DJ Barry autoplay blocked, showing button:', error.message);
          // If autoplay fails, user can click button
        });
    }
  }, [audioFile, audioStarted]);

  // Manual audio starter - fallback if autoplay blocked
  const startDJBarryAudio = () => {
    if (audioFile && !audioStarted) {
      console.log('🎵 MANUAL START DJ Barry audio:', audioFile);
      
      const audio = new Audio(audioFile);
      audio.volume = 0.7;
      audio.loop = false;
      
      // Store globally
      (window as any).djBarryAudio = audio;
      
      // Add event listener to mark as finished when it ends
      audio.addEventListener('ended', () => {
        console.log('✅ DJ Barry audio finished playing completely');
        (window as any).djBarryAudio = null;
      });
      
      audio.play()
        .then(() => {
          console.log('✅ DJ Barry audio PLAYING! Will continue after loading screen...');
          setAudioStarted(true);
        })
        .catch((error) => {
          console.error('❌ DJ Barry audio failed:', error);
          alert('Audio failed to play: ' + error.message);
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Canvas for particle system */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Central pulsing orb */}
        <div className="relative mb-8">
          <div className="central-orb w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full shadow-2xl shadow-purple-500/50"></div>
          <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-2 w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-60"></div>
        </div>

        {/* Audio button if needed */}
        {audioFile && !audioStarted && (
          <div className="mb-6">
            <button
              onClick={startDJBarryAudio}
              className="audio-button px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold rounded-full shadow-2xl hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/50"
            >
              🎵 Start Audio
            </button>
          </div>
        )}

        {/* Animated dots */}
        <div className="flex justify-center space-x-3">
          <div className="loading-dot w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full"></div>
          <div className="loading-dot w-3 h-3 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full"></div>
        </div>
      </div>

      {/* Ambient light effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="ambient-bg-1 absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-500/15 via-transparent to-blue-500/15"></div>
        <div className="ambient-bg-2 absolute top-0 right-0 w-full h-full bg-gradient-to-b from-pink-500/12 via-transparent to-purple-500/12"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-cyan-500/8 via-transparent to-transparent"></div>
      </div>
    </div>
  );
};