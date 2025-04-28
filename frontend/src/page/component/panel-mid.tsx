import {createUseStyles} from "react-jss";

const useStyle = createUseStyles({
    container: {
        position: "relative",
        overflow: "hidden",
    },
    left: {
        backgroundColor: "#e3f2fd",
        position: "absolute",
        width: "100%",
        height: "100%",
        clipPath: 'polygon(0 0, 100% 0, 0 100%)'
    },
    right: {
        backgroundColor: "#e8f5e9",
        position: "absolute",
        width: "100%",
        height: "100%",
         clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
    },
})
export const PanelMid = () => {
    const style = useStyle()
    return <div className={style.container}>
        <div className={style.left}></div>
        <div className={style.right}></div>
    </div>
};
