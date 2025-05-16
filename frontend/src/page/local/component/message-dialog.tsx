import React, {useState} from 'react';
import {Dialog} from "../../../component/dialog/dialog.tsx";
import {ReceivedMessage} from "./types.ts";
import {createUseStyles} from "react-jss";

const useStyles = createUseStyles({
    root: {
        marginBottom: '1rem',
    },
    sender: {
        margin: '0 0 0.5rem 0',
        fontSize: '0.9rem',
        color: '#666',
    },
    msgBox: {
        background: 'rgba(255,255,255,0.96)',
        color: '#222',
        padding: '1rem',
        borderRadius: '4px',
        border: '1px solid #ddd',
        maxHeight: '400px',
        minHeight: '80px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    downloadLink: {
        color: '#007aff',
        textDecoration: 'underline',
    },
    btnRow: {
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: '8px',
    },
    copySuccess: {
        color: '#28a745',
        fontSize: '0.9rem',
        marginRight: '0.5rem',
        animation: 'fadeIn 0.3s ease-in',
    },
    copyBtn: {
        padding: '8px 16px',
        background: '#007aff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
        '&:hover': {
            background: '#0056b3',
        },
    },
    copyBtnSuccess: {
        background: '#28a745',
    },
    closeBtn: {
        padding: '8px 16px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    progressBar: {
        width: '100%',
        height: 8,
        background: '#eee',
        borderRadius: 4,
        margin: '12px 0',
        overflow: 'hidden',
    },
    progressInner: {
        height: '100%',
        background: '#4dabf7',
        transition: 'width 0.3s',
    },
});

interface MessageDialogProps {
    open: boolean;
    message: ReceivedMessage | null;
    onClose: () => void;
}

export const MessageDialog: React.FC<MessageDialogProps> = ({open, message, onClose}) => {
    const [copySuccess, setCopySuccess] = useState(false);
    const classes = useStyles();

    const handleCopyMessage = () => {
        if (message) {
            navigator.clipboard.writeText(message.text || '').then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            }).catch(() => {
                alert('复制失败，请手动复制');
            });
        }
    };

    return (
        <Dialog 
            open={open} 
            title="收到新消息" 
            onClose={onClose}
            footer={false}
        >
            <div className={classes.root}>
                <p className={classes.sender}>
                    来自: {message?.sender}
                </p>
                <div className={classes.msgBox}>
                    {message?.isFile ? (
                        <>
                            <div>📎 文件: {message.fileName} ({message.fileSize ? (message.fileSize/1024).toFixed(1) : ''} KB)</div>
                            {message.receiving ? (
                                <>
                                    <div style={{fontSize: '0.95em', color: '#888'}}>正在接收... {Math.round((message.progress||0)*100)}%</div>
                                    <div className={classes.progressBar}>
                                        <div className={classes.progressInner} style={{width: `${Math.round((message.progress||0)*100)}%`}} />
                                    </div>
                                </>
                            ) : (
                                <a href={message.fileBlobUrl} download={message.fileName} className={classes.downloadLink}>
                                    点击下载
                                </a>
                            )}
                        </>
                    ) : (
                        message?.text
                    )}
                </div>
            </div>
            <div className={classes.btnRow}>
                {copySuccess && (
                    <span className={classes.copySuccess}>
                        ✓ 已复制
                    </span>
                )}
                {!message?.isFile && (
                    <button 
                        onClick={handleCopyMessage}
                        className={copySuccess ? `${classes.copyBtn} ${classes.copyBtnSuccess}` : classes.copyBtn}
                    >
                        {copySuccess ? '已复制' : '复制消息'}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className={classes.closeBtn}
                >
                    关闭
                </button>
            </div>
        </Dialog>
    );
}; 