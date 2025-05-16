import {CloudBackground} from "../../component/fluid/cloud.tsx";
import {useEffect, useRef, useState, useCallback} from "react";
import {createUseStyles} from "react-jss";
import {useWebsocket} from "../../hook/websocket/u-ws.tsx";
import {Resp} from "../../interface/response.ts";
import {useLocalStore} from "../../store/local.ts";
import {UserBubble} from "./component/user-bubble.tsx";
import {MessageDialog} from "./component/message-dialog.tsx";
import {RTCHandler, RTCHandlerCallbacks} from "./component/rtc-handler.ts";
import {generateBubbles} from "./component/bubble-layout.ts";
import {Client, ReceivedMessage} from "./component/types.ts";
import {SendDialog} from "./component/send-dialog.tsx";
import {message} from "../../hook/message/u-message.tsx";

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
        },
        '@keyframes fadeIn': {
            '0%': {
                opacity: 0,
                transform: 'translateY(-10px)'
            },
            '100%': {
                opacity: 1,
                transform: 'translateY(0)'
            }
        }
    },
    container: {
        margin: "0",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
    },
    title: {
        width: '100%',
        display: "flex",
        justifyContent: "center",
        color: '#1661ab',
    }
});

export const LocalSharing: React.FC = () => {
    const classes = useClass();
    const {id, name, set, } = useLocalStore();
    const [_rtc, setRTC] = useState<RTCPeerConnection>();
    const rtcRef = useRef<RTCPeerConnection | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const {connect, close} = useWebsocket({});
    const [open, setOpen] = useState<{ send: boolean; receive: boolean }>({send: false, receive: false});
    const [receivedMessage, setReceivedMessage] = useState<ReceivedMessage | null>(null);
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [receivingFile, setReceivingFile] = useState<ReceivedMessage | null>(null);

    // RTC处理器的回调函数 - 使用useCallback确保稳定性
    const onChannelOpen = useCallback((type: 'sender' | 'receiver') => {
        console.log(`[D] Channel opened: ${type}`);
        setOpen(val => ({...val, [type]: true}));
    }, []);

    const onMessageReceived = useCallback((message: ReceivedMessage) => {
        if (message.isFile && message.receiving) {
            setReceivingFile(message);
        } else if (message.isFile && !message.receiving) {
            setReceivingFile(null);
            setReceivedMessage(message);
            setShowMessageDialog(true);
        } else {
            setReceivedMessage(message);
            setShowMessageDialog(true);
        }
    }, []);

    const onChannelClose = useCallback(() => {
        console.log('[D] Channel closed');
        setOpen({send: false, receive: false});
    }, []);

    const rtcCallbacks: RTCHandlerCallbacks = {
        onChannelOpen,
        onMessageReceived,
        onChannelClose
    };

    // 创建RTC处理器实例 - 使用useRef确保实例稳定
    const rtcHandlerRef = useRef<RTCHandler | null>(null);
    
    // 更新RTC处理器的回调函数
    useEffect(() => {
        if (rtcHandlerRef.current) {
            rtcHandlerRef.current.updateCallbacks(rtcCallbacks);
        }
    }, [rtcCallbacks]);

    const updateClients = async () => {
        setTimeout(async () => {
            const res = await fetch(`/api/ulocal/clients`);
            const jes = await res.json() as Resp<Client[]>;
            setClients(jes.data);
        }, 500);
    };

    const handleWSEvent = async (e: MessageEvent) => {
        const msgData = JSON.parse(e.data);
        
        if (msgData.type === "enter" || msgData.type === "leave") {
            await updateClients();
            return;
        }
        
        // 其他RTC相关事件由RTC处理器处理
        if (rtcHandlerRef.current) {
            try {
                await rtcHandlerRef.current.handleWSEvent(e);
            } catch (err) {
                message.error('通信异常，请刷新页面');
            }
        } else {
            message.error('内部错误：通信模块未初始化');
        }
    };

    const handleBubbleClick = async (bubble: any) => {
        setOpen({send: true, receive: false});
        if (rtcHandlerRef.current) {
            try {
                await rtcHandlerRef.current.handleBubbleClick(bubble.id, id);
            } catch (e) {
                message.error('建立连接失败，请重试');
            }
        } else {
            message.error('内部错误：通信模块未初始化');
            console.error('[E] RTC handler is null!');
        }
    };

    const handleSend = (msg: string, files: File[]) => {
        if (rtcHandlerRef.current) {
            try {
                rtcHandlerRef.current.sendMessage(msg, files, name);
            } catch (e) {
                message.error('发送失败，请重试');
            }
        } else {
            message.error('内部错误：通信模块未初始化');
        }
    };

    const handleCloseMessageDialog = () => {
        setShowMessageDialog(false);
        setReceivedMessage(null);
    };


    useEffect(() => {
        const fn = async () => {
            const response = await fetch('/api/ulocal/register', {method: 'POST'});
            const data = ((await response.json()) as Resp<{ id: string; name: string }>).data;
            set(data.id, data.name);
            connect(`/api/ulocal/ws?id=${data.id}`, {fn: handleWSEvent});
            await updateClients();

            const _rtc = new RTCPeerConnection();
            rtcRef.current = _rtc;
            setRTC(_rtc);

            // 在RTC连接创建后立即创建处理器实例
            rtcHandlerRef.current = new RTCHandler(rtcRef, rtcCallbacks);

            return () => {
                close();
                if (rtcRef.current) {
                    rtcRef.current.close();
                }
            };
        };
        fn();
    }, []);

    const bubbles = generateBubbles(clients, id);

    useEffect(() => {
        if (receivingFile && receivingFile.isFile && !receivingFile.receiving) {
            setReceivingFile(null);
            setReceivedMessage(receivingFile);
            setShowMessageDialog(true);
        }
    }, [receivingFile]);

    return (
        <div className={classes.container}>
            <CloudBackground/>
            <h1 className={classes.title}>
                {name}
                {/* <span> - {id}</span> */}
            </h1>
            
            {bubbles.map(bubble => (
                <UserBubble 
                    key={bubble.id} 
                    bubble={bubble} 
                    onClick={handleBubbleClick}
                />
            ))}
            
            <SendDialog
                open={open.send}
                onSend={handleSend}
                onClose={() => setOpen({send: false, receive: false})}
                name={name}
            />
            
            {/* 文件接收进度弹窗 */}
            {receivingFile && (
                <MessageDialog
                    open={true}
                    message={receivingFile}
                    onClose={() => setReceivingFile(null)}
                />
            )}
            
            <MessageDialog 
                open={showMessageDialog}
                message={receivedMessage}
                onClose={handleCloseMessageDialog}
            />
        </div>
    );
};