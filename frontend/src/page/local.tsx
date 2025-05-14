import {CloudBackground} from "../component/fluid/cloud.tsx";
import {useEffect, useState} from "react";
import {createUseStyles} from "react-jss";
import {useRoom} from "../store/ws.ts";

const useClass = createUseStyles({
    '@global': {
        '@keyframes emerge': {
            '0%': {
                transform: 'scale(0) translate(-50%, -50%)',
                opacity: 0
            },
            '80%': {
                transform: 'scale(1.1) translate(-50%, -50%)',
                opacity: 1
            },
            '100%': {
                transform: 'scale(1) translate(-50%, -50%)',
                opacity: 1
            }
        }
    },
    container: {
        margin: "0",
        height: "100vh",
        // background: "linear-gradient(45deg, #e6e9f0, #eef1f5)",
        overflow: "hidden",
        position: "relative",
    },
    bubble: {
        position: "absolute",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        fontFamily: "'Microsoft Yahei', sans-serif",
        fontSize: "14px",
        color: "rgba(255, 255, 255, 0.9)",
        textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease",
        transform: 'translate(-50%, -50%)',
        animation: 'emerge 0.5s ease-out forwards,float 6s 0.5s ease-in-out infinite',
        background: "radial-gradient(circle at 30% 30%,rgba(255, 255, 255, 0.8) 10%,rgba(255, 255, 255, 0.3) 50%,transparent 100%)",
        border: "2px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "inset 0 -5px 15px rgba(255,255,255,0.3),0 5px 15px rgba(0,0,0,0.1)",
    }
})

interface Client {
    id: string;
    name: string;
}

interface BubblePosition {
    id: string;
    x: number;
    y: number;
    color: string;
    radius: number; // 新增半径属性
    angle: number;  // 新增角度属性
}

export const LocalSharing: React.FC = () => {
    const classes = useClass();
    const [clients, setClients] = useState<Client[]>([]);
    const [bubbles, setBubbles] = useState<BubblePosition[]>([]);
    const {register, cleanup} = useRoom();
    const BUBBLE_SIZE = 100;

    // 生成随机颜色
    const generateColor = () => {
        const hue = Math.random() * 360;
        return `hsla(${hue}, 
            ${Math.random() * 30 + 40}%, 
            ${Math.random() * 10 + 75}%, 0.9)`;
    };

    // 防碰撞位置生成
    const generatePosition = (existing: BubblePosition[]) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const maxRadius = Math.min(centerX, centerY) - BUBBLE_SIZE;

        // 初始化参数
        let radius = 0;
        let angle = Math.random() * Math.PI * 2;
        let attempts = 0;

        do {
            // 极坐标转笛卡尔坐标
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // 边界检测
            if (x < 0 || x > window.innerWidth - BUBBLE_SIZE ||
                y < 0 || y > window.innerHeight - BUBBLE_SIZE) {
                radius = 0;
                angle += Math.PI / 6;
                continue;
            }

            // 碰撞检测
            const collision = existing.some(bubble => {
                const distance = Math.sqrt(
                    Math.pow(bubble.x - x, 2) +
                    Math.pow(bubble.y - y, 2)
                );
                return distance < BUBBLE_SIZE * 1.5;
            });

            if (!collision) {
                return {
                    x,
                    y,
                    radius,
                    angle
                };
            }

            // 逐步扩大搜索半径和角度
            radius += BUBBLE_SIZE * 0.7;
            if (radius > maxRadius) {
                radius = 0;
                angle += Math.PI / 6; // 每30度尝试一次
            }

            attempts++;
        } while (attempts < 200);

        return null;
    };

    // 修改updateBubbles中的生成逻辑
    const updateBubbles = (newClients: Client[]) => {
        const newBubbles: BubblePosition[] = [];

        newClients.forEach(client => {
            const existing = bubbles.find(b => b.id === client.id);
            if (existing) {
                newBubbles.push(existing);
                return;
            }

            const position = generatePosition([...bubbles, ...newBubbles]);
            if (position) {
                newBubbles.push({
                    id: client.id,
                    ...position,
                    color: generateColor()
                });
            }
        });

        setBubbles(newBubbles);
    };

    useEffect(() => {
        // 模拟API获取数据
        const fetchData = async () => {
            // const response = await fetch('/api/clients');
            // const data = await response.json();

            await register();

            const mockData: Client[] = [
                { id: '1', name: '宁静的梦境' },
                { id: '2', name: '温暖的时光' },
                { id: '3', name: '甜蜜的旋律' },
                { id: '4', name: '柔和的花园' }
            ];
            setClients(mockData);
            updateBubbles(mockData);

            return () => cleanup();
        };
        fetchData();
    }, []);

    // 窗口尺寸变化处理
    useEffect(() => {
        const handleResize = () => {
            const validBubbles = bubbles.filter(bubble =>
                bubble.x <= window.innerWidth - BUBBLE_SIZE &&
                bubble.y <= window.innerHeight - BUBBLE_SIZE
            );
            setBubbles(validBubbles);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [bubbles]);

    // 气泡点击处理
    const handleBubbleClick = (id: string) => {
        // 实际开发中这里调用API删除
        setClients(prev => prev.filter(c => c.id !== id));
        setBubbles(prev => prev.filter(b => b.id !== id));
    };

    return <div className={classes.container}>
        <CloudBackground />
        {bubbles.map(bubble => {
            const client = clients.find(c => c.id === bubble.id);
            return client ? (
                <div
                    key={bubble.id}
                    className={classes.bubble}
                    style={{
                        left: bubble.x,
                        top: bubble.y,
                        backgroundColor: bubble.color,
                        animationDelay:
                            `${Math.random() * 0.5}s, 
                     ${0.5 + Math.random() * 2}s`
                    }}
                    onClick={() => handleBubbleClick(bubble.id)}
                >
                    {client.name}
                </div>
            ) : null;
        })}
    </div>
}