import { createUseStyles } from "react-jss";
import { UButton } from "../../../component/button/u-button.tsx";
import { useStore } from "../../../store/share.ts";

const useStyle = createUseStyles({
    container: {
        backgroundColor: "#e8f5e9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh",

        "@media (max-width: 768px)": {
            minHeight: "auto",
            padding: "20px 10px",
        },
    },
    form: {
        backgroundColor: "#BBDEFB",
        boxShadow: "inset 0 0 15px rgba(33, 150, 243, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 0 20px 60px",

        "@media (max-width: 768px)": {
            width: "90%",
            margin: "20px 0",
            padding: "20px",
        },
    },
    title: {
        color: '#1661ab',

        "@media (max-width: 768px)": {
            fontSize: "1.5rem",
            marginBottom: "15px",
        },
    },
    code: {
        padding: '11px',
        margin: '0',
        width: '200px',
        border: '2px solid #ddd',
        borderRadius: '5px',
        '&:active': {
            border: '2px solid #1661ab',
        },

        "@media (max-width: 768px)": {
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px',
            fontSize: '14px',
        },
    },
    inputContainer: {
        display: 'flex',
        gap: '10px',

        "@media (max-width: 768px)": {
            flexDirection: 'column',
            alignItems: 'stretch',
        },
    },
    buttonContainer: {
        display: 'flex',

        "@media (max-width: 768px)": {
            justifyContent: 'left',
        },
    },
})
export const PanelRight = () => {
    const style = useStyle()
    const { code, setCode } = useStore()

    function onCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
        setCode(e.currentTarget.value)
    }

    async function onFetchFile() {
        const url = `/ushare/${code}`
        const link = document.createElement('a');
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return <div className={style.container}>
        <div className={style.form}>
            <h2 className={style.title}>获取文件</h2>
            <div className={style.inputContainer}>
                <input
                    type="text"
                    className={style.code}
                    placeholder="输入下载码"
                    value={code}
                    onChange={onCodeChange}
                />
                <div className={style.buttonContainer}>
                    <UButton onClick={onFetchFile}>获取文件</UButton>
                </div>
            </div>
        </div>
    </div>
};
