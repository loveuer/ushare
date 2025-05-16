import React, {useRef, useState} from 'react';
import {createUseStyles} from "react-jss";
import { message } from '../../../hook/message/u-message.tsx';

const useClass = createUseStyles({
    container: {
        width: "100%",
        minHeight: "260px",
        margin: "0",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
        background: "#fff",
        boxSizing: "border-box",
        padding: "20px 16px 60px 16px"
    },
    input_box: {
        width: "100%",
        minHeight: "180px",
        padding: "12px",
        boxSizing: "border-box",
        border: "none",
        resize: "vertical",
        outline: "none",
        fontFamily: "Arial, sans-serif",
        fontSize: "1.1rem",
        transition: "padding 0.3s ease",
        background: "#f8fafd",
        borderRadius: "6px"
    },
    input_has_files: {
        paddingTop: '50px',
    },
    file_list: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        padding: "8px 10px",
        background: "rgba(255, 255, 255, 0.95)",
        borderBottom: "1px solid #eee",
        display: "none",
        flexWrap: "wrap",
        gap: "6px",
        maxHeight: "60px",
        overflowY: "auto",
    },
    list_has_files: {
        display: 'flex'
    },
    "@keyframes slideIn": {
        from: {transform: "translateY(-10px)", opacity: 0},
        to: {transform: "translateY(0)", opacity: 1}
    },
    file_item: {
        display: "flex",
        alignItems: "center",
        background: "#f0f6ff",
        color: '#1661ab',
        border: "1px solid #c2d9ff",
        borderRadius: "15px",
        padding: "4px 12px",
        fontSize: "13px",
        animation: "$slideIn 0.2s ease"
    },
    delete_btn: {
        width: "16px",
        height: "16px",
        border: "none",
        background: "#ff6b6b",
        color: "white",
        borderRadius: "50%",
        marginLeft: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        "&:hover": {background: "#ff5252"},
    },
    buttons: {
        position: "absolute",
        bottom: "16px",
        right: "16px",
        display: "flex",
        gap: "12px"
    },
    action_btn: {
        padding: "10px 22px",
        background: "#4dabf7",
        color: "white",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "1rem",
        transition: "all 0.2s",
        "&:hover": {background: "#339af0", transform: "translateY(-1px)"}
    },
})

export interface SenderProps {
    onSend: (message: string, files: File[]) => void;
}

export const Sender: React.FC<SenderProps> = ({onSend}) => {
    const classes = useClass();
    const [inputMessage, setInputMessage] = useState('');
    const [files, setFiles] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(e.target.files[0]);
        } else {
            message.warning('未能选择文件');
        }
    };

    const handleSubmit = () => {
        if (!(inputMessage.trim() || files)) {
            message.warning('请输入内容或选择文件');
            return;
        }
        try {
            onSend(inputMessage, files ? [files] : []);
            setInputMessage('');
            setFiles(null);
        } catch (e) {
            message.error('发送失败，请重试');
        }
    };

    return (
        <div className={classes.container}>
            <textarea className={files?`${classes.input_box} ${classes.input_has_files}`:`${classes.input_box}`} placeholder="开始输入..."
                      onChange={handleTextInput} value={inputMessage}></textarea>
            <div className={files? `${classes.file_list} ${classes.list_has_files}` : `${classes.file_list}`}>
                {files && <div className={classes.file_item}>
                    <span>{files.name}</span>
                    <button className={classes.delete_btn} onClick={() => {
                        setFiles(null)
                    }}>×
                    </button>
                </div>}
            </div>
            <div className={classes.buttons}>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect}/>
                <button className={classes.action_btn} onClick={() => {
                    fileInputRef.current && fileInputRef.current.click()
                }}>📁 选择文件
                </button>
                <button className={classes.action_btn} onClick={handleSubmit}>✈️ 发送</button>
            </div>
        </div>
    );
};