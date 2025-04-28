import {createUseStyles} from "react-jss";
import {UButton} from "../../component/button/u-button.tsx";
import React from "react";
import {useStore} from "../../store/share.ts";

const useStyle = createUseStyles({
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
export const PanelLeft = () => {
    const style = useStyle()
    const {file, setFile} = useStore()

    function onFileSelect() {
        // @ts-ignore
        document.querySelector('#real-file-input').click();
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        console.log('[D] onFileChange: e =', e)
        setFile(e.currentTarget.files ? e.currentTarget.files[0] : null)
    }

    function onFileUpload() {
        console.log(`[D] onFileUpload: upload file = ${file?.name}, size = ${file?.size}`, file)
    }

    function onFileClean() {
        setFile(null)
    }

    return <div className={style.container}>
        <div className={style.form}>
            <h2 className={style.title}>上传文件</h2>
            {
                !file &&
                <UButton onClick={onFileSelect}>选择文件</UButton>
            }
            {
                file &&
                <UButton onClick={onFileUpload}>上传文件</UButton>
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
};