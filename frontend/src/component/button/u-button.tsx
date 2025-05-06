import React, {ReactNode} from 'react';
import {createUseStyles} from 'react-jss';

const useStyle = createUseStyles({
    ubutton: {
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "background-color 0.3s",
        position: 'relative',
        overflow: 'hidden',
        "&:hover": {
            backgroundColor: "#45a049",
        },
        "&:disabled": {
            backgroundColor: "#a5d6a7",
            cursor: "not-allowed",
        },
    },
    loadingContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    spinner: {
        animation: '$spin 1s linear infinite',
        border: '2px solid white',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        width: '16px',
        height: '16px',
    },
    '@keyframes spin': {
        '0%': {transform: 'rotate(0deg)'},
        '100%': {transform: 'rotate(360deg)'},
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '3px',
        backgroundColor: 'rgba(255,255,255,0.5)',
        width: '100%',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'white',
        transition: 'width 0.3s ease',
    },
});


type Props = {
    onClick?: () => void;
    children: ReactNode;
    disabled?: boolean;
    style?: React.CSSProperties;
    loading?: boolean;
    process?: number;
};

export const UButton: React.FC<Props> = ({
                                             onClick,
                                             children,
                                             disabled = false,
                                             style,
                                             loading,
                                             process
                                         }) => {
    const classes = useStyle();

    return (
        <button
            style={style}
            className={classes.ubutton}
            disabled={disabled || loading}
            onClick={onClick}
        >
            {/* 显示加载状态或默认内容 */}
            {loading ? (
                <div className={classes.loadingContent}>
                    <span className={classes.spinner}/>
                    {children}
                    {process && `(${process}%)`}
                </div>
            ) : children}

            {/* 显示进度条 */}
            {process !== undefined && (
                <div className={classes.progressBar}>
                    <div
                        className={classes.progressFill}
                        style={{width: `${Math.min(Math.max(process, 0), 100)}%`}}
                    />
                </div>
            )}
        </button>
    );
};