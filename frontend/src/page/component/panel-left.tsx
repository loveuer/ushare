import {createUseStyles} from "react-jss";
import {UButton} from "../../component/button/u-button.tsx";
import React from "react";
import {useStore} from "../../store/share.ts";
import {message} from "../../component/message/u-message.tsx";

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

interface RespNew {
    code: string
}

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

    async function onFileUpload() {
        if (!file) {
            return
        }

        console.log(`[D] onFileUpload: upload file = ${file.name}, size = ${file.size}`, file)

        let res1 = await fetch(`/api/share/${file.name}`, {
            method: "PUT",
            headers: {"X-File-Size": file.size.toString()}
        })
        let j1 = await res1.json() as RespNew
        console.log('[D] onFileUpload: json 1 =', j1)
        if (!j1.code) {
            return
        }


        // todo: for 循环上传文件分片直到上传完成

        // 2. 分片上传配置
        const CHUNK_SIZE = 1024 * 1024 // 1MB分片
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
        const code = j1.code

        // 3. 循环上传所有分片
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, file.size)
            const chunk = file.slice(start, end)

            // 4. 构造Range头（bytes=start-end）
            const rangeHeader = `bytes=${start}-${end - 1}` // end-1因为Range是闭区间

            // 5. 上传分片
            const res = await fetch(`/api/share/${code}`, {
                method: "POST",
                headers: {
                    "Range": rangeHeader,
                    "Content-Type": "application/octet-stream" // 二进制流类型
                },
                body: chunk
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(`分片 ${chunkIndex} 上传失败: ${err}`)
            }

            console.log(`[D] 分片进度: ${chunkIndex + 1}/${totalChunks}`,
                `(${Math.round((chunkIndex + 1)/totalChunks*100)}%)`)
        }

        console.log('[D] 所有分片上传完成')
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