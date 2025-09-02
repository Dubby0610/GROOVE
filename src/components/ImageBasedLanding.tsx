import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBackgroundMusic } from '../hooks/useBackgroundMusic';

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
	// Background music hook
	const { 
		playBackgroundMusic, 
		stopBackgroundMusic, 
		pauseBackgroundMusic, 
		resumeBackgroundMusic,
		setVolume, 
		getVolume, 
		audioState 
	} = useBackgroundMusic('/sounds/groove.mp3');
	
	const [sparkles, setSparkles] = useState<Sparkle[]>([]);
	const [glitterParticles, setGlitterParticles] = useState<GlitterParticle[]>([]);
	const [isMobile, setIsMobile] = useState(false);
	const [showMusicControls, setShowMusicControls] = useState(false);
	const [isVolumeDragging, setIsVolumeDragging] = useState(false);
	const [volumeHover, setVolumeHover] = useState(false);
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

	// Start background music when component mounts
	useEffect(() => {
		// Add a small delay to ensure audio is properly initialized
		const timer = setTimeout(() => {
			playBackgroundMusic();
		}, 100);
		
		// Cleanup: stop music when component unmounts
		return () => {
			clearTimeout(timer);
			stopBackgroundMusic();
		};
	}, [playBackgroundMusic, stopBackgroundMusic]);

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

	// Handle main container click
	const handleMainClick = (e: React.MouseEvent) => {
		// Only navigate if the click is not on the music controls
		if (!(e.target as Element).closest('.music-controls')) {
			onEnterGuestMode();
		}
	};

	// Enhanced volume control handlers
	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.stopPropagation();
		const newVolume = parseFloat(e.target.value);
		setVolume(newVolume);
	};

	const handleVolumeMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsVolumeDragging(true);
	};

	const handleVolumeMouseUp = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsVolumeDragging(false);
	};

	const handleVolumeTouchStart = (e: React.TouchEvent) => {
		e.stopPropagation();
		setIsVolumeDragging(true);
	};

	const handleVolumeTouchEnd = (e: React.TouchEvent) => {
		e.stopPropagation();
		setIsVolumeDragging(false);
	};

	return (
		<div className="relative min-h-screen bg-black cursor-pointer flex items-center justify-center" onClick={handleMainClick}>
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

			{/* Enhanced Music Controls */}
			<div className="absolute top-4 right-4 z-30 music-controls" onClick={(e) => e.stopPropagation()}>
				<div className={`bg-black/80 backdrop-blur-md rounded-xl p-2 border border-purple-500/50 shadow-2xl transition-all duration-300 ${volumeHover ? 'scale-105 shadow-purple-500/30' : ''}`}>
					<div className="text-purple-300 text-xs font-semibold mb-1 text-center tracking-wider">🎵</div>
					
					{/* Enhanced Play/Pause Button */}
					<button
						onClick={(e) => {
							e.stopPropagation();
							if (audioState.isPlaying) {
								pauseBackgroundMusic();
							} else {
								resumeBackgroundMusic();
							}
						}}
						className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 mb-1 shadow-lg hover:shadow-purple-500/50 mx-auto transform hover:scale-110 active:scale-95"
					>
						{audioState.isPlaying ? '⏸️' : '▶️'}
					</button>
					
					{/* Enhanced Volume Control */}
					<div className="text-purple-300 text-xs mb-1 text-center">Vol</div>
					<div 
						className="relative"
						onMouseEnter={() => setVolumeHover(true)}
						onMouseLeave={() => setVolumeHover(false)}
					>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={getVolume()}
							onChange={handleVolumeChange}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={handleVolumeMouseDown}
							onMouseUp={handleVolumeMouseUp}
							onTouchStart={handleVolumeTouchStart}
							onTouchEnd={handleVolumeTouchEnd}
							className={`w-12 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer slider transition-all duration-200 ${isVolumeDragging ? 'scale-110' : ''}`}
							style={{
								background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${getVolume() * 100}%, #374151 ${getVolume() * 100}%, #374151 100%)`
							}}
						/>
						{/* Volume level indicator with smooth animation */}
						<div className="text-purple-300 text-xs text-center mt-1 transition-all duration-200">
							<span className={`font-mono ${isVolumeDragging ? 'text-pink-400 scale-110' : ''}`}>
								{Math.round(getVolume() * 100)}%
							</span>
						</div>
					</div>
					
					{/* Enhanced Music Status */}
					<div className="text-center mt-1">
						{audioState.isLoaded ? (
							<div className={`w-1.5 h-1.5 rounded-full mx-auto transition-all duration-300 ${audioState.isPlaying ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-purple-400'}`}></div>
						) : (
							<div className="w-1.5 h-1.5 rounded-full mx-auto bg-gray-400"></div>
						)}
					</div>
				</div>
			</div>

			{/* Guide */}
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm md:text-base z-30 select-none animate-flicker">
				Click anywhere to enter
			</div>
		</div>
	);
};