import { useCallback, useRef } from 'react';

export interface Prop {
    /** 事件处理函数（可选） */
    fn?: (event: MessageEvent) => Promise<void>;
    /** 最大重试次数（可选） */
    retry?: number;
}

export const useWebsocket = (prop?: Prop) => {
    const wsRef = useRef<WebSocket | null>(null);
    const retryCountRef = useRef(0);
    const reconnectTimerRef = useRef<number>(0);
    const currentPropRef = useRef(prop);

    // 更新最新 prop
    currentPropRef.current = prop;

    const connect = useCallback((url: string, connectProp?: Prop) => {
        // 合并 prop 优先级：connectProp > hook prop
        const mergedProp = { ...currentPropRef.current, ...connectProp };

        // 清理现有连接
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        clearTimeout(reconnectTimerRef.current);

        const createConnection = () => {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                retryCountRef.current = 0;
            };

            ws.onmessage = (event) => {
                mergedProp?.fn?.(event).catch(error => {
                    console.error('WebSocket message handler error:', error);
                });
            };

            ws.onclose = (event) => {
                const maxRetries = mergedProp?.retry ?? 0;

                if (!event.wasClean && retryCountRef.current < maxRetries) {
                    retryCountRef.current += 1;
                    const retryDelay = Math.pow(2, retryCountRef.current) * 1000;

                    reconnectTimerRef.current = setTimeout(() => {
                        createConnection();
                    }, retryDelay);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.close();
            };

            wsRef.current = ws;
        };

        createConnection();
    }, []);

    const close = useCallback(() => {
        wsRef.current?.close();
        clearTimeout(reconnectTimerRef.current);
        retryCountRef.current = currentPropRef.current?.retry || 0;
    }, []);

    return {
        connect,
        close
    };
};