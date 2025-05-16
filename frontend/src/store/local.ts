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
    pc: RTCPeerConnection | null
    ch: RTCDataChannel | null
    candidate: RTCIceCandidate | null
    offer: RTCSessionDescription | null
    retryCount: number
    reconnectTimer: number | null
}

type RoomActions = {
    register: () => Promise<void>
    enter: () => Promise<void>
    list: () => Promise<void>
    send: (file: File) => Promise<void>
    cleanup: () => void
}

interface Message {
    type: 'ping' | 'self' | 'enter' | 'leave';
    time: number;
    body: any;
}

function setupDataChannel(ch: RTCDataChannel) {
    ch.onopen = () => console.log('通道已打开！');
    ch.onmessage = (e) => handleFileChunk(e.data);
    ch.onclose = () => console.log('通道关闭');
}

// 接收文件块
function handleFileChunk(chunk: any) {
    console.log("[D] rtc file chunk =", chunk)
}

const MAX_RETRY_DELAY = 30000 // 最大重试间隔30秒
const NORMAL_CLOSE_CODE = 1000 // 正常关闭的状态码

export const useRoom = create<RoomState & RoomActions>()((set, get) => ({
    conn: null,
    client: null,
    clients: [],
    pc: null,
    ch: null,
    candidate: null,
    offer: null,
    retryCount: 0,
    reconnectTimer: null,
    register: async () => {
        let candidate: RTCIceCandidate;
        let offer: RTCSessionDescription | null;
        const rtc = new RTCPeerConnection({iceServers: [{urls: "stun:stun.qq.com:3478"}]})
        // 处理接收方DataChannel
        rtc.ondatachannel = (e) => {
            setupDataChannel(e.channel);
        };

        const waitCandidate = new Promise<void>(resolve => {
            rtc.onicecandidate = (e) => {
                if (e.candidate) {
                    console.log('[D] candidate =', {candidate: e.candidate})
                    candidate = e.candidate
                }
                resolve();
            }
        })

        // rtc.onicecandidate = (e) => {
        //     if (e.candidate) {
        //         console.log('[D] candidate =', {candidate: e.candidate})
        //         candidate = e.candidate
        //     }
        // }

        const waitOffer = new Promise<void>(resolve => {
            rtc.onnegotiationneeded = async () => {
                await rtc.setLocalDescription(await rtc.createOffer());
                console.log("[D] offer =", {offer: rtc.localDescription})
                offer = rtc.localDescription
                resolve();
            };
        })

        // rtc.onnegotiationneeded = async () => {
        //     await rtc.setLocalDescription(await rtc.createOffer());
        //     console.log("[D] offer =", {offer: rtc.localDescription})
        //     offer = rtc.localDescription
        // };

        const ch = rtc.createDataChannel("fileTransfer", {ordered: true})

        setupDataChannel(ch)


        Promise.all([waitCandidate, waitOffer]).then(() => {
            const api = `/api/ulocal/register`
            fetch(api, {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({candidate: candidate, offer: offer})
            }).then(res => {return res.json() as unknown as Resp<Client>}).then(jes => {
                set({client: jes.data, candidate: candidate, offer: offer})
            })
        })
    },
    enter: async () => {
        const {conn, reconnectTimer} = get()

        // 清理旧连接和定时器
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()

        const api = `${window.location.protocol === 'https' ? 'wss' : 'ws'}://${window.location.host}/api/ulocal/ws?id=${get().client?.id}`
        console.log('[D] websocket api =', api)
        const newConn = new WebSocket(api)

        newConn.onopen = () => {

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
                    if (nc.id && nc.name && nc.id !== get().client?.id) {
                        console.log('[D] enter new client =', nc)
                        set(state => {
                            return {...state, clients: [...get().clients, nc]}
                        })
                    }
                    break
                case "leave":
                    nc = msg.body as Client
                    if (nc.id) {
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
        set({clients: jes.data})
    },
    send: async (file: File) => {
        const reader = new FileReader();
        const channel = get().ch!;
        reader.onload = (e) => {
            const chunkSize = 16384; // 16KB每块
            const buffer = e.target!.result! as ArrayBuffer;
            let offset = 0;
            while (offset < buffer.byteLength) {
                const chunk = buffer.slice(offset, offset + chunkSize);
                channel.send(chunk);
                offset += chunkSize;
            }
        };
        reader.readAsArrayBuffer(file);
    },
    cleanup: () => {
        const {conn, reconnectTimer} = get()
        if (reconnectTimer) clearTimeout(reconnectTimer)
        if (conn) conn.close()
        set({conn: null, retryCount: 0, reconnectTimer: null})
    }
}))
