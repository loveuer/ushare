export interface Bubble {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    radius: number;
    angle: number;
}

export interface WSMessage {
    data: any;
    time: number;
    type: "register" | "enter" | "leave" | "offer" | "answer" | "candidate"
}

export interface Client {
    client_type: 'desktop' | 'mobile' | 'tablet';
    app_type: 'web';
    ip: number;
    name: string;
    id: string;
    register_at: string;
    offer: RTCSessionDescription;
    candidate: RTCIceCandidateInit;
}

export interface ReceivedMessage {
    text?: string;
    timestamp: number;
    sender: string;
    fileName?: string;
    fileSize?: number;
    fileBlobUrl?: string;
    isFile?: boolean;
    progress?: number; // 0-1
    receiving?: boolean; // 是否正在接收
} 