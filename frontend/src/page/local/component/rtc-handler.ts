import { WSMessage, ReceivedMessage} from "./types.ts";
import {useLocalStore} from "../../../store/local.ts";

// 文件接收缓存
const fileReceiveCache: Record<string, {chunks: ArrayBuffer[], total: number, received: number, name: string, size: number, sender: string, timestamp: number}> = {};

export const handleFileChunk = (chunk: any, onFileReceived: (msg: import("./types").ReceivedMessage) => void) => {
    if (chunk.type === 'file') {
        // 文件元信息，初始化缓存
        fileReceiveCache[chunk.name + '_' + chunk.timestamp] = {
            chunks: new Array(chunk.totalChunks),
            total: chunk.totalChunks,
            received: 0,
            name: chunk.name,
            size: chunk.size,
            sender: chunk.sender,
            timestamp: chunk.timestamp
        };
        // 首次弹出进度
        onFileReceived({
            sender: chunk.sender,
            timestamp: chunk.timestamp,
            fileName: chunk.name,
            fileSize: chunk.size,
            isFile: true,
            progress: 0,
            receiving: true
        });
    } else if (chunk.type === 'file-chunk') {
        const key = chunk.name + '_' + chunk.timestamp;
        const cache = fileReceiveCache[key];
        if (cache) {
            // 将 data 数组还原为 ArrayBuffer
            const uint8 = new Uint8Array(chunk.data);
            cache.chunks[chunk.chunkIndex] = uint8.buffer;
            cache.received++;
            // 实时回调进度
            if (cache.received < cache.total) {
                onFileReceived({
                    sender: cache.sender,
                    timestamp: cache.timestamp,
                    fileName: cache.name,
                    fileSize: cache.size,
                    isFile: true,
                    progress: cache.received / cache.total,
                    receiving: true
                });
            }
        }
    } else if (chunk.type === 'file-end') {
        const key = chunk.name + '_' + chunk.timestamp;
        const cache = fileReceiveCache[key];
        if (cache && cache.received === cache.total) {
            const blob = new Blob(cache.chunks);
            const url = URL.createObjectURL(blob);
            onFileReceived({
                sender: cache.sender,
                timestamp: cache.timestamp,
                fileName: cache.name,
                fileSize: cache.size,
                fileBlobUrl: url,
                isFile: true,
                progress: 1,
                receiving: false
            });
            delete fileReceiveCache[key];
        } else if (cache) {
            // 分块未齐全，提示异常
            onFileReceived({
                sender: cache.sender,
                timestamp: cache.timestamp,
                fileName: cache.name,
                fileSize: cache.size,
                isFile: true,
                progress: cache.received / cache.total,
                receiving: true,
                text: '文件分块未齐全，接收失败'
            });
        }
    }
};

export interface RTCHandlerCallbacks {
    onChannelOpen: (type: 'sender' | 'receiver') => void;
    onMessageReceived: (message: ReceivedMessage) => void;
    onChannelClose: () => void;
}

export class RTCHandler {
    private rtcRef: React.MutableRefObject<RTCPeerConnection | null>;
    private callbacks: RTCHandlerCallbacks;

    constructor(rtcRef: React.MutableRefObject<RTCPeerConnection | null>, callbacks: RTCHandlerCallbacks) {
        this.rtcRef = rtcRef;
        this.callbacks = callbacks;
    }

    // 更新回调函数的方法
    updateCallbacks = (newCallbacks: RTCHandlerCallbacks) => {
        this.callbacks = newCallbacks;
    };

    setupDataChannel = async (ch: RTCDataChannel, type: 'sender' | 'receiver') => {
        ch.onopen = () => {
            console.log(`[D] 通道已打开！类型: ${type}`);
            this.callbacks.onChannelOpen(type);
            useLocalStore.getState().setChannel(ch);
        };

        ch.onmessage = (e) => {
            // console.log('[D] Received message:', e.data);
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'message') {
                    // 处理文本消息
                    const message: ReceivedMessage = {
                        text: data.content,
                        timestamp: Date.now(),
                        sender: data.sender || '未知用户'
                    };
                    this.callbacks.onMessageReceived(message);
                } else if (data.type === 'file' || data.type === 'file-chunk' || data.type === 'file-end') {
                    // 处理文件相关消息
                    handleFileChunk(data, this.callbacks.onMessageReceived);
                }
            } catch (error) {
                // 如果不是JSON格式，当作普通文本处理
                const message: ReceivedMessage = {
                    text: e.data,
                    timestamp: Date.now(),
                    sender: '未知用户'
                };
                this.callbacks.onMessageReceived(message);
            }
        };

        ch.onclose = () => {
            console.log('[D] 通道关闭');
            this.callbacks.onChannelClose();
            useLocalStore.getState().setChannel();
        };
    };

    handleBubbleClick = async (bubbleId: string, currentUserId: string) => {
        const current_rtc = this.rtcRef.current;
        if (!current_rtc) return;

        current_rtc.onnegotiationneeded = async () => {
            const offer = await current_rtc.createOffer();
            await current_rtc.setLocalDescription(offer);
            const data = {
                id: bubbleId,
                from: currentUserId,
                offer: offer,
            };
            await fetch('/api/ulocal/offer', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
        };

        current_rtc.onicecandidate = async (e) => {
            await fetch('/api/ulocal/candidate', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({candidate: e.candidate, id: currentUserId})
            });
        };

        const ch = current_rtc.createDataChannel('local', {ordered: true});
        await this.setupDataChannel(ch, 'sender');
    };

    handleWSEvent = async (e: MessageEvent) => {
        let current_id: string;
        let current_rtc: RTCPeerConnection | null;
        const msg = JSON.parse(e.data) as WSMessage;
        // console.log('[D] ws event msg =', msg);

        switch (msg.type) {
            case "enter":
            case "leave":
                // 这些事件由父组件处理
                return;
            case "offer":
                const offer_data = msg.data as { id: string; from: string; offer: RTCSessionDescriptionInit };
                current_id = useLocalStore.getState().id;
                if (offer_data.id !== current_id) {
                    console.warn(`[W] wrong offer id, want = ${current_id}, got = ${offer_data.id}, data =`, offer_data);
                    return;
                }

                current_rtc = this.rtcRef.current;
                if (!current_rtc) {
                    console.warn('[W] rtc undefined');
                    return;
                }

                await current_rtc.setRemoteDescription(offer_data.offer);
                const answer = await current_rtc.createAnswer();
                if (!answer) {
                    console.log('[W] answer undefined');
                    return;
                }

                await current_rtc.setLocalDescription(answer);

                current_rtc.ondatachannel = (e) => {
                    this.setupDataChannel(e.channel, 'receiver');
                };

                await fetch('/api/ulocal/answer', {
                    method: 'POST',
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({id: offer_data.from, answer: answer})
                });
                return;

            case "answer":
                const answer_data = msg.data as { answer: RTCSessionDescriptionInit; id: string };
                current_id = useLocalStore.getState().id;
                if (answer_data.id !== current_id) {
                    console.warn(`[W] wrong answer id, want = ${current_id}, got = ${answer_data.id}, data =`, answer_data);
                }

                current_rtc = this.rtcRef.current;
                if (!current_rtc) {
                    console.warn('[W] rtc undefined');
                    return;
                }

                await current_rtc.setRemoteDescription(answer_data.answer);
                return;

            case "candidate":
                const candidate_data = msg.data as { candidate: RTCIceCandidateInit };
                current_rtc = this.rtcRef.current;
                if (!current_rtc) {
                    console.warn('[W] rtc undefined');
                    return;
                }
                if (!candidate_data.candidate) {
                    return;
                }
                await current_rtc.addIceCandidate(candidate_data.candidate);
                return;
        }
    };

    sendMessage = (msg: string, files: File[], senderName: string) => {
        const ch = useLocalStore.getState().channel;
        const CHUNK_SIZE = 64 * 1024; // 64KB
        const BUFFERED_AMOUNT_THRESHOLD = 1 * 1024 * 1024; // 1MB
        if (ch && ch.readyState === 'open') {
            if (msg.trim()) {
                // 发送文本消息
                const messageData = {
                    type: 'message',
                    content: msg,
                    sender: senderName,
                    timestamp: Date.now()
                };
                ch.send(JSON.stringify(messageData));
            }

            if (files && files.length > 0) {
                files.forEach(file => {
                    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                    const timestamp = Date.now();
                    // 先发送文件元信息
                    const fileData = {
                        type: 'file',
                        name: file.name,
                        size: file.size,
                        sender: senderName,
                        timestamp,
                        totalChunks
                    };
                    ch.send(JSON.stringify(fileData));

                    let offset = 0;
                    let chunkIndex = 0;
                    const reader = new FileReader();

                    const sendNextChunk = () => {
                        if (offset >= file.size) {
                            // 分块全部发送完毕，发送 file-end
                            ch.send(JSON.stringify({
                                type: 'file-end',
                                name: file.name,
                                timestamp,
                            }));
                            return;
                        }
                        if (ch.bufferedAmount > BUFFERED_AMOUNT_THRESHOLD) {
                            ch.addEventListener('bufferedamountlow', sendNextChunk, { once: true });
                            return;
                        }
                        const slice = file.slice(offset, offset + CHUNK_SIZE);
                        reader.onload = (e) => {
                            if (e.target?.result) {
                                ch.send(JSON.stringify({
                                    type: 'file-chunk',
                                    name: file.name,
                                    timestamp,
                                    chunkIndex,
                                    totalChunks,
                                    data: Array.from(new Uint8Array(e.target.result as ArrayBuffer)),
                                }));
                                offset += CHUNK_SIZE;
                                chunkIndex++;
                                sendNextChunk();
                            }
                        };
                        reader.readAsArrayBuffer(slice);
                    };
                    sendNextChunk();
                });
            }
        }
    };
} 