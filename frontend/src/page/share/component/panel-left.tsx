import {createUseStyles} from "react-jss";
import {UButton} from "../../../component/button/u-button.tsx";
import React, {useState} from "react";
import {useStore} from "../../../store/share.ts";
import {message} from "../../../hook/message/u-message.tsx";
import {useFileUpload} from "../../../api/upload.ts";

const useUploadStyle = createUseStyles({
    container: {
        backgroundColor: "#e3f2fd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    form: {
        backgroundColor: "#C8E6C9",
        boxShadow: "inset 0 0 15px rgba(56, 142, 60, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 60px 20px 0",
        /*todo margin 不用 px*/
    },
    title: {
        color: "#2c9678"
    },
    file: {
        display: 'none',
    },
    preview: {
        marginTop: '10px',
        display: 'flex',
    },
    name: {
        color: "#2c9678",
        marginLeft: '10px'
    },
    clean: {
        borderRadius: '50%',
        cursor: 'pointer',
        '&:hover': {}
    }
})

const useShowStyle = createUseStyles({
    container: {
        backgroundColor: "#e3f2fd",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative", // 为关闭按钮提供定位基准
    },
    title: {
        color: "#2c9678",
        marginTop: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    form: {
        backgroundColor: "#C8E6C9",
        boxShadow: "inset 0 0 15px rgba(56, 142, 60, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 60px 20px 0",
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "transparent",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        cursor: "pointer",
        "&:hover": {
            // background: "#cc0000",
            boxShadow:  "20px 20px 60px #fff, -20px -20px 60px #fff",
            // boxShadow:  "20px 20px 60px #eee",
        },
    },
    codeWrapper: {
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: "0 15px",
        borderRadius: "8px",
        margin: "15px 0",
        overflowX: "auto",
    },
    pre: {
        display: 'flex',
        flexDirection: 'row',
        color: 'black',
        alignItems: 'center',
        height: '24px',
        "& > code": {
            marginLeft: "0",
        }
    },
    copyButton: {
        marginLeft: 'auto',
        background: "#2c9678",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "background 0.3s",
        "&:hover": {
            background: "#1f6d5a",
        },
    },
});

export const PanelLeft = () => {
    const [code, set_code] = useState("")

    if (code) {
        return <PanelLeftShow code={code} set_code={set_code} />
    }

    return <PanelLeftUpload  set_code={set_code}/>
};

const PanelLeftUpload: React.FC<{ set_code: (code:string) => void }> = ({set_code}) => {
    const style = useUploadStyle()
    const {file, setFile} = useStore()
    const {uploadFile, progress, loading} = useFileUpload();

    function onFileSelect() {
        // @ts-ignore
        document.querySelector('#real-file-input').click();
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFile(e.currentTarget.files ? e.currentTarget.files[0] : null)
    }

    async function onFileUpload() {
        if (!file) {
            return
        }

        const code = await uploadFile(file)
        set_code(code)
    }

    function onFileClean() {
        setFile(null)
    }

    return <div className={style.container}>
        <div className={style.form}>
            <h2 className={style.title}>上传文件</h2>
            {
                !file && !loading &&
                <UButton onClick={onFileSelect}>选择文件</UButton>
            }
            {
                file && !loading &&
                <UButton onClick={onFileUpload}>上传文件</UButton>
            }
            {
                loading &&
                <UButton process={progress} loading={loading}>上传中</UButton>
            }
            <input type="file" className={style.file} id="real-file-input" onChange={onFileChange}/>
            {
                file &&
                <div className={style.preview}>
                    <div className={style.clean} onClick={onFileClean}>×</div>
                    <div className={style.name}>{file.name}</div>
                </div>
            }
        </div>
    </div>
}

const PanelLeftShow: React.FC<{ code: string; set_code: (code: string) => void }> = ({ code, set_code }) => {
    const classes = useShowStyle();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            message.success("复制成功！");
        } catch (err) {
            message.warning("复制失败，请手动选择文本复制");
        }
    };

    return (
        <div className={classes.container}>

            <div className={classes.form}>
                <button
                    className={classes.closeButton}
                    onClick={() => set_code('')}
                    aria-label="关闭"
                >
                    ×
                </button>
                <h2 className={classes.title}>
                    上传成功!
                </h2>

                <div className={classes.codeWrapper}>
                    <pre className={classes.pre}>
                        <code>{code}</code>
                        <button className={classes.copyButton} onClick={handleCopy}>
                        一键复制
                    </button>
                    </pre>
                </div>
            </div>
        </div>
    );
};