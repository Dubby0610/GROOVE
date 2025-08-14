import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ImageBasedLandingProps {
	onEnterGuestMode: () => void;
}

interface Sparkle {
	id: number;
	x: number;
	y: number;
	size: number;
	opacity: number;
	delay: number;
	duration: number;
	rotation: number;
	scale: number;
	type: 'star' | 'cross' | 'diamond';
}

interface GlitterParticle {
	id: number;
	x: number;
	y: number;
	size: number;
	opacity: number;
	delay: number;
	color: string;
	animationType: 'pulse' | 'twinkle' | 'glow' | 'shimmer';
	movement: 'static' | 'float' | 'drift';
}

export const ImageBasedLanding: React.FC<ImageBasedLandingProps> = ({ onEnterGuestMode }) => {
	const [sparkles, setSparkles] = useState<Sparkle[]>([]);
	const [glitterParticles, setGlitterParticles] = useState<GlitterParticle[]>([]);
	const [isMobile, setIsMobile] = useState(false);
	const animationFrameRef = useRef<number>();
	const lastTimeRef = useRef(0);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const generateSparkles = useCallback(() => {
		const newSparkles: Sparkle[] = [];
		const types: ('star' | 'cross' | 'diamond')[] = ['star', 'cross', 'diamond'];
		const count = isMobile ? 30 : 60; // reduced
		for (let i = 0; i < count; i++) {
			newSparkles.push({
				id: i,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 4 + 2,
				opacity: Math.random() * 0.9 + 0.1,
				delay: Math.random() * 4000,
				duration: Math.random() * 5000 + 3000,
				rotation: Math.random() * 360,
				scale: Math.random() * 0.6 + 0.8,
				type: types[Math.floor(Math.random() * types.length)]
			});
		}
		setSparkles(newSparkles);
	}, [isMobile]);

	const generateGlitterParticles = useCallback(() => {
		const colors = ['#ffffff', '#f0f8ff', '#e6f3ff'];
		const animationTypes: ('pulse' | 'twinkle' | 'glow' | 'shimmer')[] = ['pulse', 'twinkle', 'glow', 'shimmer'];
		const movements: ('static' | 'float' | 'drift')[] = ['static', 'float', 'drift'];
		const count = isMobile ? 180 : 400; // reduced
		const newParticles: GlitterParticle[] = [];
		for (let i = 0; i < count; i++) {
			newParticles.push({
				id: i,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 2.5 + 0.8,
				opacity: Math.random() * 0.7 + 0.2,
				delay: Math.random() * 3000,
				color: colors[Math.floor(Math.random() * colors.length)],
				animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)],
				movement: movements[Math.floor(Math.random() * movements.length)]
			});
		}
		setGlitterParticles(newParticles);
	}, [isMobile]);

	useEffect(() => {
		generateSparkles();
		generateGlitterParticles();
	}, [generateSparkles, generateGlitterParticles]);

	useEffect(() => {
		const animate = (currentTime: number) => {
			if (currentTime - lastTimeRef.current > 16) {
				setSparkles(prev => prev.map(sparkle => ({
					...sparkle,
					opacity: Math.sin((currentTime + sparkle.delay) / 1000) * 0.4 + 0.6,
					rotation: (sparkle.rotation + 0.7) % 360,
					scale: Math.sin((currentTime + sparkle.delay) / 1500) * 0.25 + 0.9
				})));

				setGlitterParticles(prev => prev.map(particle => ({
					...particle,
					opacity: Math.sin((currentTime + particle.delay) / 1200) * 0.3 + 0.45,
					x: particle.movement === 'drift' ? (particle.x + Math.sin(currentTime / 2000 + particle.delay / 1000) * 0.08) % 100 : particle.x,
					y: particle.movement === 'float' ? (particle.y + Math.sin(currentTime / 2800 + particle.delay / 1000) * 0.12) % 100 : particle.y
				})));

				lastTimeRef.current = currentTime;
			}
			animationFrameRef.current = requestAnimationFrame(animate);
		};
		animationFrameRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
		};
	}, []);

	const getAnimationClass = (type: string) => {
		switch (type) {
			case 'pulse': return 'animate-pulse';
			case 'twinkle': return 'animate-twinkle';
			case 'glow': return 'animate-glow';
			case 'shimmer': return 'animate-shimmer';
			default: return 'animate-pulse';
		}
	};

	const renderSparkle = (sparkle: Sparkle) => {
		switch (sparkle.type) {
			case 'star':
				return (
					<>
						<div className="w-full h-full bg-white rounded-full animate-ping" />
						<div className="absolute inset-0 w-full h-full bg-cyan-200 rounded-full animate-pulse" />
						<div className="absolute inset-0 w-full h-full border border-white rounded-full animate-pulse" />
						<div className="absolute inset-0 w-full h-full">
							<div className="absolute top-1/2 left-0 w-full h-px bg-white opacity-80 transform -translate-y-1/2" />
							<div className="absolute top-0 left-1/2 w-px h-full bg-white opacity-80 transform -translate-x-1/2" />
						</div>
					</>
				);
			case 'cross':
				return (
					<>
						<div className="w-full h-full bg-white rounded-full animate-ping" />
						<div className="absolute inset-0 w-full h-full">
							<div className="absolute top-1/2 left-0 w-full h-px bg-white transform -translate-y-1/2" />
							<div className="absolute top-0 left-1/2 w-px h-full bg-white transform -translate-x-1/2" />
						</div>
					</>
				);
			case 'diamond':
				return (
					<>
						<div className="w-full h-full bg-white rounded-full animate-ping" />
						<div className="absolute inset-0 w-full h-full border border-white rounded-full animate-pulse" />
					</>
				);
			default:
				return <div className="w-full h-full bg-white rounded-full animate-ping" />;
		}
	};

	return (
		<div className="relative min-h-screen bg-black cursor-pointer flex items-center justify-center" onClick={onEnterGuestMode}>
			{/* Full-screen white dots & sparkles overlay */}
			<div className="absolute inset-0 pointer-events-none z-20">
				{glitterParticles.map((particle) => (
					<div
						key={particle.id}
						className={`absolute rounded-full glitter-particle ${getAnimationClass(particle.animationType)}`}
						style={{
							left: `${particle.x}%`,
							top: `${particle.y}%`,
							width: `${particle.size}px`,
							height: `${particle.size}px`,
							backgroundColor: particle.color,
							opacity: particle.opacity,
							animationDelay: `${particle.delay}ms`,
							animationDuration: `${Math.random() * 3500 + 1800}ms`,
							boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
						}}
					/>
				))}
				{sparkles.map((sparkle) => (
					<div
						key={sparkle.id}
						className="absolute"
						style={{
							left: `${sparkle.x}%`,
							top: `${sparkle.y}%`,
							width: `${sparkle.size}px`,
							height: `${sparkle.size}px`,
							opacity: sparkle.opacity,
							animationDelay: `${sparkle.delay}ms`,
							transform: `rotate(${sparkle.rotation}deg) scale(${sparkle.scale})`
						}}
					>
						{renderSparkle(sparkle)}
					</div>
				))}
			</div>

			{/* Centered 16:9 image container */}
			<div className="relative z-10 w-screen md:w-[90vw] lg:w-[80vw] max-w-[1400px] mx-auto aspect-[16/9]">
				<img src="/imgs/landing.png" alt="Nightclub Landing" className="absolute inset-0 w-full h-full object-contain" />
			</div>

			{/* Guide */}
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm md:text-base z-30 select-none animate-flicker">
				Click anywhere to enter
			</div>
		</div>
	);
};
