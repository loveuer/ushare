import  { useRef, useEffect } from 'react';

export const AnimatedBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 粒子配置
    const config = {
        particleNum: 100,
        maxSpeed: 1.5,
        particleRadius: 2,
        lineWidth: 1.5,
        lineDistance: 100
    };

    type Particle = {
        x: number;
        y: number;
        speedX: number;
        speedY: number;
        color: string;
        radius: number;
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        // 设置canvas尺寸
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        // 创建粒子数组
        let particles: Particle[] = [];
        const createParticles = () => {
            particles = Array.from({ length: config.particleNum }).map(() => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speedX: (Math.random() - 0.5) * config.maxSpeed,
                speedY: (Math.random() - 0.5) * config.maxSpeed,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                radius: Math.random() * config.particleRadius + 1
            }));
        };

        // 绘制连线
        const drawLine = (p1: Particle, p2: Particle) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < config.lineDistance) {
                ctx.beginPath();
                ctx.strokeStyle = p1.color;
                ctx.lineWidth = config.lineWidth * (1 - dist / config.lineDistance);
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        };

        // 动画循环
        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 更新粒子位置
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // 边界反弹
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                // 绘制粒子
                ctx.beginPath();
                ctx.fillStyle = particle.color;
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // 绘制粒子间的连线
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    drawLine(particles[i], particles[j]);
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        // 初始化
        createParticles();
        animate();

        // 窗口resize处理
        window.addEventListener('resize', () => {
            resize();
            createParticles();
        });

        // 清理
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: -1,
                backgroundColor: '#1a1a1a'
            }}
        />
    );
};
