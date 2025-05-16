import {createUseStyles} from 'react-jss'
import {PanelLeft} from "./component/panel-left.tsx";
import {PanelRight} from "./component/panel-right.tsx";
import {PanelMid} from "./component/panel-mid.tsx";

const useStyle = createUseStyles({
    "@global": {
        margin: 0,
        padding: 0,
    },
    container: {
        margin: 0,
        height: "100vh",
        display: "grid",
        gridTemplateColumns: "40% 20% 40%",
    },
})

export const FileSharing = () => {
    const style = useStyle()
        return <div className={style.container}>
        <PanelLeft />
        <PanelMid/>
        <PanelRight/>
    </div>
};