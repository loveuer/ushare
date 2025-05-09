import {createUseStyles} from "react-jss";
import {UButton} from "../../component/button/u-button.tsx";
import {useStore} from "../../store/share.ts";

const useStyle = createUseStyles({
    container: {
        backgroundColor: "#e8f5e9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    form: {
        backgroundColor: "#BBDEFB",
        boxShadow: "inset 0 0 15px rgba(33, 150, 243, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 0 20px 60px",
        /*todo margin 不用 px*/
    },
    title: {
        color: '#1661ab', // 靛青
    },
    code: {
        padding: '11px',
        margin: '20px 0',
        width: '200px',
        border: '2px solid #ddd',
        borderRadius: '5px',
        '&:active': {
            border: '2px solid #1661ab',
        }
    }
})
export const PanelRight = () => {
    const style = useStyle()
    const {code, setCode} = useStore()

    function onCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
        setCode(e.currentTarget.value)
    }

    async function onFetchFile() {
        const url = `/ushare/${code}`
        console.log('[D] onFetchFile: url =', url)
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return <div className={style.container}>
        <div className={style.form}>
            <h2 className={style.title}>获取文件</h2>
            <div>
                <input
                    type="text"
                    className={style.code}
                    placeholder="输入下载码"
                    value={code}
                    onChange={onCodeChange}
                />
                <UButton style={{marginLeft: '10px'}} onClick={onFetchFile}>获取文件</UButton>
            </div>
        </div>
    </div>
};
