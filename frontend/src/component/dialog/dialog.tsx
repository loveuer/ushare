import React, { useEffect, useRef, ReactNode } from 'react';
import {createUseStyles} from "react-jss";

const useClass = createUseStyles({
    dialog: {
        border: "none",
        borderRadius: "8px",
        padding: "2rem 3rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        maxWidth: "90%",
        width: "500px",
        opacity: 0,
        transform: "translateY(-20px)",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        "&[open]": { opacity: 1, transform: "translateY(0)" },
        "&::backdrop": {
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)"
        },
        background: "rgba(212,212,212,0.85)",
        backdropFilter: "blur(8px)",
    },
    dialog_content: {
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column"
    },
    dialog_header: {
        fontSize: "1.5rem",
        fontWeight: 600,
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid #eee"
    },
    dialog_body: { marginBottom: "1.5rem" },
    dialog_footer: { display: "flex", justifyContent: "flex-end" },
    close_button: {
        padding: "8px 16px",
        background: "#007aff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        "&:hover": { background: "#0062cc" }
    },
})

export interface DialogProps {
    /** 对话框是否打开 */
    open: boolean;
    /** 对话框标题 */
    title?: string;
    /** 对话框内容 */
    children: ReactNode;
    /** 关闭对话框时的回调 */
    onClose: () => void;
    /** 自定义样式类名 */
    className?: string;
    /** 是否显示底部footer（关闭按钮） */
    footer?: boolean;
}

/**
 * 使用 HTML 原生 dialog 元素的模态对话框组件
 */
export const Dialog: React.FC<DialogProps> = ({
                                                  open,
                                                  title,
                                                  children,
                                                  onClose,
                                                  className = '',
                                                  footer = true,
                                              }) => {
    const classes = useClass();
    const dialogRef = useRef<HTMLDivElement>(null);

    // ESC 键关闭
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // 遮罩点击关闭
    const handleMaskClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === dialogRef.current) {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            ref={dialogRef}
            className={className}
            style={{
                position: 'fixed',
                zIndex: 1100,
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={handleMaskClick}
        >
            <article className={classes.dialog} style={{opacity: 1, transform: 'translateY(0)'}}>
                {title && <header className={classes.dialog_header}>{title}</header>}
                <div className={classes.dialog_body}>
                    {children}
                </div>
                {footer !== false && (
                    <footer className={classes.dialog_footer}>
                        <button
                            className={classes.close_button}
                            onClick={onClose}
                            aria-label="关闭对话框"
                        >
                            关闭
                        </button>
                    </footer>
                )}
            </article>
        </div>
    );
};