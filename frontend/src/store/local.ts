import {create} from 'zustand'
import {Resp} from "../interface/response.ts";

export interface Client {
    client_type: 'desktop' | 'mobile' | 'tablet';
    app_type: 'web';
    room: string;
    ip: number;
    name: string;
    id: string;
    register_at: string;
}

type RoomState = {
    conn: WebSocket | null
    client: Client | null
    clients: Client[]
    retryCount: number
    reconnectTimer: number | null
}

type RoomActions = {
    register: () => Promise<void>
    enter: () => Promise<void>
    list: () => Promise<void>
    cleanup: () => void
}

interface Message {
    type: 'ping' | 'self' | 'enter' | 'leave';
    time: number;
    body: any;
}

const MAX_RETRY_DELAY = 30000 // 最大重试间隔30秒
const NORMAL_CLOSE_CODE = 1000 // 正常关闭的状态码

export const useRoom = create<RoomState & RoomActions>()((set, get) => ({
    conn: null,
    client: null,
    clients: [],
    retryCount: 0,
    reconnectTimer: null,
    register: async () => {
        const api = `/api/ulocal/register`
        const res = await fetch(api, {method: 'POST'})
        const jes = await res.json() as Resp<Client>
        return set(state => {
            return {...state, client: jes.data}
        })
    },
    enter: async () => {
        const {conn, reconnectTimer} = get()

        // 清理旧连接和定时器
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()

        const api = `${window.location.protocol === 'https' ? 'wss' : 'ws'}://${window.location.host}/api/ulocal/ws?id=${get().client?.id}`
        console.log('[D] websocket api =',api)
        const newConn = new WebSocket(api)

        newConn.onopen = () => {
            set({conn: newConn, retryCount: 0}) // 重置重试计数器
        }

        newConn.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        newConn.onmessage = (event) => {
            const msg = JSON.parse(event.data) as Message;
            console.log('[D] ws msg =', msg)
            let nc: Client
            switch (msg.type) {
                case "enter":
                    nc = msg.body as Client
                    if(nc.id && nc.name && nc.id !== get().client?.id) {
                        console.log('[D] enter new client =', nc)
                        set(state => {
                            return {...state, clients: [...get().clients, nc]}
                        })
                    }
                    break
                case "leave":
                    nc = msg.body as Client
                    if(nc.id) {
                        let idx = 0;
                        let items = get().clients;
                        for (const item of items) {
                            if (item.id === nc.id) {
                                items.splice(idx, 1)
                                set(state => {
                                    return {...state, clients: items}
                                })
                               break;
                            }
                            idx++;
                        }
                    }
                    break
            }
        }

        newConn.onclose = (event) => {
            // 非正常关闭时触发重连
            if (event.code !== NORMAL_CLOSE_CODE) {
                const {retryCount} = get()
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

        set({conn: newConn, reconnectTimer: null})
    },
    list: async () => {
        const api = "/api/ulocal/clients?room="
        const res = await fetch(api + get().client?.room)
        const jes = await res.json() as Resp<Client[]>
        set(state => {
            return {...state, clients: jes.data}
        })
    },
    cleanup: () => {
        const {conn, reconnectTimer} = get()
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()
        set({conn: null, retryCount: 0, reconnectTimer: null})
    }
}))
