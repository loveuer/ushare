import React from 'react';
import {createUseStyles} from "react-jss";
import {Bubble} from "./types.ts";

const useClass = createUseStyles({
    bubble: {
        position: "absolute",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        cursor: "pointer",
        fontFamily: "'Microsoft Yahei', sans-serif",
        fontSize: "14px",
        color: "rgba(255, 255, 255, 0.9)",
        textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
        transition: "transform 0.3s ease",
        transform: 'translate(-50%, -50%)',
        animation: 'emerge 0.5s ease-out forwards,float 6s 0.5s ease-in-out infinite',
        background: "radial-gradient(circle at 30% 30%,rgba(255, 255, 255, 0.8) 10%,rgba(255, 255, 255, 0.3) 50%,transparent 100%)",
        border: "2px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "inset 0 -5px 15px rgba(255,255,255,0.3),0 5px 15px rgba(0,0,0,0.1)",
    }
});

interface UserBubbleProps {
    bubble: Bubble;
    onClick: (bubble: Bubble) => void;
}

export const UserBubble: React.FC<UserBubbleProps> = ({bubble, onClick}) => {
    const classes = useClass();
    
    return (
        <div
            className={classes.bubble}
            style={{
                left: bubble.x,
                top: bubble.y,
                backgroundColor: bubble.color,
                animationDelay: `${Math.random() * 0.5}s, ${0.5 + Math.random() * 2}s`
            }}
            onClick={() => onClick(bubble)}
        >
            {bubble.name}
        </div>
    );
}; 