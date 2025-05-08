import  { useRef, useEffect } from 'react';

export const CloudBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 完整可配置参数
    const config = {
        cloudNum: 8,            // 云朵数量
        maxSpeed: 3.0,          // 最大水平速度
        cloudSize: 100,          // 基础云朵尺寸 (新增)
        sizeVariation: 0.5,     // 尺寸随机变化率 (0-1)
        colorVariation: 20,     // 色相变化范围
        verticalOscillation: 0.5, // 垂直浮动幅度
        shapeComplexity: 5,     // 形状复杂度（组成圆形数量）
        boundaryOffset: 3       // 边界偏移倍数
    };

    type Cloud = {
        x: number;
        y: number;
        speed: number;
        circles: CloudCircle[];
        color: string;
        maxRadius: number;      // 记录云朵最大半径
    };

    type CloudCircle = {
        offsetX: number;
        offsetY: number;
        radius: number;
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        // 生成云朵形状（基于配置参数）
        const createCloudShape = () => {
            const circles: CloudCircle[] = [];
            const circleCount = 4 + Math.floor(Math.random() * config.shapeComplexity);

            for(let i = 0; i < circleCount; i++) {
                circles.push({
                    offsetX: (Math.random() - 0.5) * config.cloudSize * 1.5,
                    offsetY: (Math.random() - 0.5) * config.cloudSize * 0.8,
                    radius: config.cloudSize * (1 - config.sizeVariation + Math.random() * config.sizeVariation)
                });
            }
            return circles;
        };

        let clouds: Cloud[] = [];
        const createClouds = () => {
            clouds = Array.from({ length: config.cloudNum }).map(() => {
                const shape = createCloudShape();
                return {
                    x: Math.random() * canvas.width,
                    y: canvas.height * (0.2 + Math.random() * 0.6),
                    speed: (Math.random() * 0.5 + 0.5) * config.maxSpeed,
                    circles: shape,
                    color: `hsla(210, 30%, 95%, ${0.8 + Math.random() * 0.2})`,
                    maxRadius: Math.max(...shape.map(c => c.radius)) // 计算最大半径
                };
            });
        };

        const drawCloud = (cloud: Cloud) => {
            ctx.save();
            ctx.beginPath();

            cloud.circles.forEach(circle => {
                ctx.moveTo(cloud.x + circle.offsetX, cloud.y + circle.offsetY);
                ctx.arc(
                    cloud.x + circle.offsetX,
                    cloud.y + circle.offsetY,
                    circle.radius,
                    0,
                    Math.PI * 2
                );
            });

            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, config.cloudSize * 2
            );
            gradient.addColorStop(0, cloud.color);
            gradient.addColorStop(1, `hsla(210, 50%, 98%, 0.3)`);

            ctx.fillStyle = gradient;
            ctx.filter = `blur(${config.cloudSize * 0.2}px)`; // 模糊与尺寸关联
            ctx.fill();
            ctx.restore();
        };

        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 天空渐变背景
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#e6f3ff');
            skyGradient.addColorStop(1, '#d1e8ff');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            clouds.forEach(cloud => {
                cloud.x += cloud.speed;
                cloud.y += Math.sin(Date.now() / 1000 + cloud.x) * config.verticalOscillation;

                // 基于实际最大半径的边界检测
                const resetPosition = cloud.x > canvas.width + (cloud.maxRadius * config.boundaryOffset);
                if (resetPosition) {
                    cloud.x = -cloud.maxRadius * config.boundaryOffset;
                    // 重置时重新生成形状
                    const newShape = createCloudShape();
                    cloud.circles = newShape;
                    cloud.maxRadius = Math.max(...newShape.map(c => c.radius));
                }

                drawCloud(cloud);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        createClouds();
        animate();

        window.addEventListener('resize', () => {
            resize();
            createClouds();
        });

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
                width: '100%',
                height: '100%'
            }}
        />
    );
};