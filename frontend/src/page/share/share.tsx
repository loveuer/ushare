import {createUseStyles} from 'react-jss'
import {PanelLeft} from "./component/panel-left.tsx";
import {PanelRight} from "./component/panel-right.tsx";
import {PanelMid} from "./component/panel-mid.tsx";
import {NavBar} from "./component/nav-bar.tsx";

const useStyle = createUseStyles({
    "@global": {
        margin: 0,
        padding: 0,
    },
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
    },
    container: {
        flex: 1,
        display: "grid",
        gridTemplateColumns: "40% 20% 40%",
        overflow: 'hidden',

        "@media (max-width: 768px)": {
            gridTemplateColumns: "100%",
            gridTemplateRows: "auto auto",
            overflowY: "auto",
        },
    },
})

export const FileSharing = () => {
    const style = useStyle()
    return (
        <div className={style.wrapper}>
            <NavBar />
            <div className={style.container}>
                <PanelLeft />
                <PanelMid />
                <PanelRight />
            </div>
        </div>
    );
};
