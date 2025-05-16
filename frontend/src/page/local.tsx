import {CloudBackground} from "../component/fluid/cloud.tsx";
import {useEffect} from "react";
import {createUseStyles} from "react-jss";
import {Client, useRoom} from "../store/local.ts";

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
    title: {
        width: '100%',
        display: "flex",
        justifyContent: "center",
        color: '#1661ab',
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


interface Bubble {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    radius: number; // 新增半径属性
    angle: number;  // 新增角度属性
}

export const LocalSharing: React.FC = () => {
    const classes = useClass();
    const {register, enter, list, cleanup, client, clients} = useRoom();

    // 生成随机颜色
    const generateColor = () => {
        const hue = Math.random() * 360;
        return `hsla(${hue}, 
            ${Math.random() * 30 + 40}%, 
            ${Math.random() * 10 + 75}%, 0.9)`;
    };

    // 防碰撞位置生成
    const generateBubbles = (cs: Client[]) => {
        if (!cs) return []

        const BUBBLE_SIZE = 100;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const bubbles: Bubble[] = [];
        let currentRadius = 0;
        let angleStep = (2 * Math.PI) / 6; // 初始6个位置

        for (let index = 0; index < cs.length; index++) {
            let attempt = 0;
            let validPosition = false;

            if (cs[index].id == client?.id) {
                continue
            }

            while (!validPosition && attempt < 100) {
                // 螺旋布局算法
                const angle = angleStep * (index + attempt);
                const radius = currentRadius + (attempt * BUBBLE_SIZE * 0.8);

                // 极坐标转笛卡尔坐标
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                // 边界检测
                const inBounds = x >= 0 && x <= window.innerWidth - BUBBLE_SIZE &&
                    y >= 0 && y <= window.innerHeight - BUBBLE_SIZE;

                // 碰撞检测
                const collision = bubbles.some(pos => {
                    const distance = Math.sqrt(
                        Math.pow(pos.x - x, 2) +
                        Math.pow(pos.y - y, 2)
                    );
                    return distance < BUBBLE_SIZE * 1.5;
                });

                if (inBounds && !collision) {
                    bubbles.push({
                        id: cs[index].id,
                        name: cs[index].name,
                        x: x,
                        y: y,
                        color: generateColor(),
                    } as Bubble);

                    // 动态调整布局参数
                    currentRadius = Math.max(currentRadius, radius);
                    angleStep = (2 * Math.PI) / Math.max(6, bubbles.length * 0.7);
                    validPosition = true;
                }

                attempt++;
            }
        }

        return bubbles;
    };

    useEffect(() => {
        register().then(() => {
            setTimeout(() => {
                enter().then(() => {
                    list().then()
                })
            }, 600)
        });
        return () => cleanup();
    }, []);

    // 气泡点击处理
    const handleBubbleClick = async (id: string) => {
        console.log('[D] click bubble!!!', id)
    };

    return <div className={classes.container}>
        <CloudBackground/>
        <h1 className={classes.title}>{client?.name}</h1>
        {clients && generateBubbles(clients).map(bubble => {
            // const client = clients.find(c => c.id === bubble.id);
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
                    {bubble.name}
                </div>
            ) : null;
        })}
    </div>
}