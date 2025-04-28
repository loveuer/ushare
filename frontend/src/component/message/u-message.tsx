import {createRoot} from "react-dom/client";
import {useEffect, useState} from "react";
import {createUseStyles} from "react-jss";

const useStyle = createUseStyles({
    container: {
        position: 'fixed',
        width: '100%',
        display: 'flex',
        zIndex: 10000,
        top: '20px',
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
    },
    message: {
        width: '100%',
        maxWidth: '300px',
        background: '#fafafa',  // 浅灰背景与其他状态统一
        borderRadius: '8px',
        padding: '10px 10px 10px 20px',  // 统一左侧20px留白

        borderLeft: '4px solid #e0e0e0',  // 加粗为4px与其他状态一致
        color: '#757575',  // 中性灰文字

        boxShadow: '0 2px 6px rgba(224, 224, 224, 0.15)',  // 灰色投影
        transition: 'all 0.3s ease-in-out',  // 补全时间单位

        marginBottom: '20px',

        '&.success': {
            color: '#2e7d32',
            backgroundColor: '#f0f9eb',
            borderLeft: '4px solid #4CAF50',
            paddingLeft: '20px',
            boxShadow: '0 2px 6px rgba(76, 175, 80, 0.15)'
        },
        '&.warning': {
            color: '#faad14',  // 警告文字色
            backgroundColor: '#fffbe6', // 浅黄色背景
            borderLeft: '4px solid #ffc53d', // 琥珀色左侧标识
            paddingLeft: '20px',
            boxShadow: '0 2px 6px rgba(255, 197, 61, 0.15)' // 金色投影
        },
        '&.error': {
            color: '#f5222d',  // 错误文字色
            backgroundColor: '#fff1f0', // 浅红色背景
            borderLeft: '4px solid #ff4d4f', // 品红色左侧标识
            paddingLeft: '20px',
            boxShadow: '0 2px 6px rgba(255, 77, 79, 0.15)' // 红色投影
        }
    }
})

let el = document.querySelector("#u-message")
if (!el) {
    el = document.createElement('div')
    el.className = 'u-message'
    el.id = 'u-message'
    document.body.append(el)
}

export interface Message {
    id: number
    content: string
    duration: number
    type: 'info' | 'success' | 'warning' | 'error'
}

export interface MessageApi {
    info: (content: string, duration?: number) => void;
    warning: (content: string, duration?: number) => void;
    success: (content: string, duration?: number) => void;
    error: (content: string, duration?: number) => void;
}

const default_duration = 3000


let add: (msg: Message) => void;

const MessageContainer: React.FC = () => {
    const classes = useStyle()
    const [msgs, setMsgs] = useState<Message[]>([]);

    const remove = (id: number) => {
        setMsgs(prevMsgs => prevMsgs.filter(v => v.id !== id));
    }

    add = (msg: Message) => {
        const id = Date.now();
        setMsgs(prevMsgs => {
            const newMsgs = [{...msg, id}, ...prevMsgs];
            // 直接限制数组长度为5，移除最旧的消息（最后一项）
            if (newMsgs.length > 5) {
                newMsgs.pop();
            }
            return newMsgs;
        });

        setTimeout(() => {
            remove(id);
        }, msg.duration ?? default_duration);
    }

    return <div className={classes.container}>
        {msgs.map(m => <div key={m.id} className={`${classes.message} ${m.type}`}>{m.content}</div>)}
    </div>
}

createRoot(el).render(<MessageContainer/>)

export const message: MessageApi = {
    info: function (content: string, duration?: number): void {
        add({content: content, duration: duration, type: "info"} as Message)
    },
    warning: function (content: string, duration?: number): void {
        add({content: content, duration: duration, type: "warning"} as Message)
    },
    success: function (content: string, duration?: number): void {
        add({content: content, duration: duration, type: "success"} as Message)
    },
    error: function (content: string, duration?: number): void {
        add({content: content, duration: duration, type: "error"} as Message)
    }
}