import React, {useEffect} from 'react';
import {createUseStyles} from "react-jss"; // 使用 CSS Modules

const useClass = createUseStyles({
    backdrop: {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        maxHeight: '100%',
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        opacity: 0,
        transition: "opacity 0.3s ease-in-out",
        pointerEvents: "none",
        zIndex: 1000,
        overflow: 'hidden',
    },
    visible: {opacity: 1, pointerEvents: "auto"},
    drawer_content: {
        background: "white",
        borderRadius: "8px 8px 0 0",
        transition: "transform 0.3s ease-in-out",
        overflow: "auto",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)"
    }
})

export interface DrawerProps {
    isOpen: boolean;
    close: () => void;
    onClose?: () => void;
    height?: string;
    width?: string;
    children?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
                                                  isOpen,
                                                  close,
                                                  onClose,
                                                  height = '300px',
                                                  width = '100%',
                                                  children
                                              }) => {
    const classes = useClass();
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
               close()
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen, onClose]);

    return (
        <div
            className={`${classes.backdrop} ${isOpen ? classes.visible : ''}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={classes.drawer_content}
                style={{
                    height,
                    width,
                    transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};
