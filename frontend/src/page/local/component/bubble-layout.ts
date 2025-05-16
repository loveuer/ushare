import {Bubble, Client} from "./types.ts";

// 生成随机颜色
export const generateColor = () => {
    const hue = Math.random() * 360;
    return `hsla(${hue}, 
        ${Math.random() * 30 + 40}%, 
        ${Math.random() * 10 + 75}%, 0.9)`;
};

// 防碰撞位置生成
export const generateBubbles = (clients: Client[], currentUserId: string): Bubble[] => {
    if (!clients) return [];

    const BUBBLE_SIZE = 100;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const bubbles: Bubble[] = [];
    let currentRadius = 0;
    let angleStep = (2 * Math.PI) / 6; // 初始6个位置

    for (let index = 0; index < clients.length; index++) {
        let attempt = 0;
        let validPosition = false;

        if (clients[index].id === currentUserId) {
            continue;
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
                    id: clients[index].id,
                    name: clients[index].name,
                    x: x,
                    y: y,
                    color: generateColor(),
                    radius: 0,
                    angle: 0
                });

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