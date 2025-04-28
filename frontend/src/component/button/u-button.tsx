import React, {ReactNode} from 'react';
import {createUseStyles} from "react-jss";

const useStyle = createUseStyles({
    ubutton: {
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "background-color 0.3s",
        "&:hover": {
            backgroundColor: "#45a049",
        },
        "&:disabled": {
            backgroundColor: "#a5d6a7",
            cursor: "not-allowed",
        },
    }
})
type Props = {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    style?: React.CSSProperties | undefined;
};
export const UButton: React.FC<Props> = ({onClick, children, style,disabled = false}) => {
    const classes= useStyle()
    return <button style={style} className={classes.ubutton} disabled={disabled} onClick={onClick}>
        {children}
    </button>
}