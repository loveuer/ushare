import { create } from 'zustand'

type RoomState = {
    conn: WebSocket | null
    retryCount: number
    reconnectTimer: number | null
}

type RoomActions = {
    register: () => Promise<void>
    cleanup: () => void
}

const MAX_RETRY_DELAY = 30000 // 最大重试间隔30秒
const NORMAL_CLOSE_CODE = 1000 // 正常关闭的状态码

export const useRoom = create<RoomState & RoomActions>()((set, get) => ({
    conn: null,
    retryCount: 0,
    reconnectTimer: null,

    register: async () => {
        const { conn, reconnectTimer } = get()

        // 清理旧连接和定时器
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
        const wsUrl = protocol + window.location.host + '/api/ulocal/registry'
        const newConn = new WebSocket(wsUrl)

        newConn.onopen = () => {
            console.log('WebSocket connected')
            set({ conn: newConn, retryCount: 0 }) // 重置重试计数器
        }

        newConn.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        newConn.onmessage = (event) => {
           console.log("[D] websocket message =", event)
        }

        newConn.onclose = (event) => {
            // 非正常关闭时触发重连
            if (event.code !== NORMAL_CLOSE_CODE) {
                const { retryCount } = get()
                const nextRetry = retryCount + 1
                const delay = Math.min(1000 * Math.pow(2, nextRetry), MAX_RETRY_DELAY)

                const timer = setTimeout(() => {
                    get().register()
                }, delay)

                set({
                    retryCount: nextRetry,
                    reconnectTimer: timer,
                    conn: null
                })
            }
        }

        set({ conn: newConn, reconnectTimer: null })
    },

    cleanup: () => {
        const { conn, reconnectTimer } = get()
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()
        set({ conn: null, retryCount: 0, reconnectTimer: null })
    }
}))
