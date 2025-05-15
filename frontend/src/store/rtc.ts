import {create} from 'zustand'

type RTCState = {
    conn: RTCPeerConnection | null
}

type RTCAction = {
    connect: () => Promise<void>
    create: () => Promise<void>
    cleanup: () => void
}

export const useRTC = create<RTCState & RTCAction>()((set, get) => ({
    conn: null,
    connect: async () => {
        const conn = new RTCPeerConnection()

        const ch = conn.createDataChannel("fileTransfer", {ordered: true})

        console.log('[D] channel =', ch)

        ch.onopen = (event) => {
            console.log('🚀🚀🚀 / rtc open event', event)
        }

        ch.onclose = (event) => {
        }

        ch.onerror = (event) => {
        }

        ch.onmessage = (event) => {
            console.log('🚀🚀🚀 / rtc message event', event)
        }

        set((state) => {
            return {...state, conn: conn}
        })
    },
    create: async () => {
        const conn = get().conn
        if (conn) conn.onicecandidate = async (event) => {
            console.log('[D] rtc local desc =', conn.localDescription)
            const offer = await conn.createOffer()
            await conn.setLocalDescription(offer)
        }
    },
    cleanup: () => {
    },
}))