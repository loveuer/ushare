import {createUseStyles} from "react-jss";
import {UButton} from "../../../component/button/u-button.tsx";
import React, {useState} from "react";
import {useStore} from "../../../store/share.ts";
import {message} from "../../../hook/message/u-message.tsx";
import {useFileUpload, UploadSettings} from "../../../api/upload.ts";

const useUploadStyle = createUseStyles({
    container: {
        backgroundColor: "#e3f2fd",
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
        backgroundColor: "#C8E6C9",
        boxShadow: "inset 0 0 15px rgba(56, 142, 60, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 60px 20px 0",

        "@media (max-width: 768px)": {
            width: "90%",
            margin: "20px 0",
            padding: "20px",
        },
    },
    title: {
        color: "#2c9678",

        "@media (max-width: 768px)": {
            fontSize: "1.5rem",
            marginBottom: "15px",
        },
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
        marginLeft: '10px',

        "@media (max-width: 768px)": {
            fontSize: "14px",
        },
    },
    clean: {
        borderRadius: '50%',
        cursor: 'pointer',
        '&:hover': {}
    },
    // Advanced settings
    advToggle: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        color: '#2c9678',
        fontSize: '13px',
        userSelect: 'none',
        opacity: 0.75,
        '&:hover': {opacity: 1},
    },
    advPanel: {
        marginTop: '12px',
        padding: '14px 16px',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    advRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
    },
    advLabel: {
        color: '#2c9678',
        fontSize: '13px',
        fontWeight: 500,
        flexShrink: 0,
    },
    advInput: {
        width: '80px',
        padding: '5px 8px',
        borderRadius: '5px',
        border: '1px solid rgba(44,150,120,0.4)',
        fontSize: '13px',
        textAlign: 'center',
        outline: 'none',
        backgroundColor: 'rgba(255,255,255,0.8)',
        '&:focus': {borderColor: '#2c9678'},
    },
    advSelect: {
        padding: '5px 8px',
        borderRadius: '5px',
        border: '1px solid rgba(44,150,120,0.4)',
        fontSize: '13px',
        outline: 'none',
        backgroundColor: 'rgba(255,255,255,0.8)',
        color: '#333',
        cursor: 'pointer',
        '&:focus': {borderColor: '#2c9678'},
    },
    advHint: {
        fontSize: '11px',
        color: '#888',
    },
})

const useShowStyle = createUseStyles({
    container: {
        backgroundColor: "#e3f2fd",
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
        backgroundColor: "#C8E6C9",
        boxShadow: "inset 0 0 15px rgba(56, 142, 60, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "70%",
        margin: "20px 60px 20px 0",
        position: "relative",

        "@media (max-width: 768px)": {
            width: "90%",
            margin: "20px 0",
            padding: "20px",
        },
    },
    title: {
        color: "#2c9678",
        marginTop: 0,
        marginBottom: "25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",

        "@media (max-width: 768px)": {
            fontSize: "1.5rem",
            marginBottom: "15px",
        },
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
            boxShadow: "20px 20px 60px #fff, -20px -20px 60px #fff",
        },
    },
    codeWrapper: {
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: "0 15px",
        borderRadius: "8px",
        margin: "15px 0",
        overflowX: "auto",

        "@media (max-width: 768px)": {
            padding: "0 10px",
        },
    },
    pre: {
        display: 'flex',
        flexDirection: 'row',
        color: 'black',
        alignItems: 'center',
        height: '24px',
        "& > code": {
            marginLeft: "0",
            fontSize: "14px",
            wordBreak: "break-all",

            "@media (max-width: 768px)": {
                fontSize: "12px",
            },
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

        "@media (max-width: 768px)": {
            padding: "6px 12px",
            fontSize: "12px",
        },
    },
    metaInfo: {
        fontSize: '12px',
        color: '#555',
        marginTop: '10px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
});

// Expiry options (hours) shown in the dropdown
const EXPIRY_OPTIONS = [1, 2, 4, 8, 12, 24];

export const PanelLeft = () => {
    const [code, setCode] = useState("")
    const [settings, setSettings] = useState<UploadSettings>({maxDownloads: 3, expiresIn: 8 * 3600})

    if (code) {
        return <PanelLeftShow code={code} set_code={setCode} settings={settings}/>
    }

    return <PanelLeftUpload set_code={setCode} settings={settings} setSettings={setSettings}/>
};

const PanelLeftUpload: React.FC<{
    set_code: (code: string) => void;
    settings: UploadSettings;
    setSettings: (s: UploadSettings) => void;
}> = ({set_code, settings, setSettings}) => {
    const style = useUploadStyle()
    const {file, setFile} = useStore()
    const {uploadFile, progress, loading} = useFileUpload();
    const [showAdv, setShowAdv] = useState(false);

    function onFileSelect() {
        // @ts-expect-error no types for direct DOM query
        document.querySelector('#real-file-input').click();
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFile(e.currentTarget.files ? e.currentTarget.files[0] : null)
    }

    async function onFileUpload() {
        if (!file) return;
        const code = await uploadFile(file, settings)
        set_code(code)
    }

    function onFileClean() {
        setFile(null)
    }

    function onMaxDownloadsChange(e: React.ChangeEvent<HTMLInputElement>) {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v) || v < 0) v = 0;
        if (v > 999) v = 999;
        setSettings({...settings, maxDownloads: v});
    }

    function onExpiryChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setSettings({...settings, expiresIn: parseInt(e.target.value, 10)});
    }

    return <div className={style.container}>
        <div className={style.form}>
            <h2 className={style.title}>上传文件</h2>
            {!file && !loading && <UButton onClick={onFileSelect}>选择文件</UButton>}
            {file && !loading && <UButton onClick={onFileUpload}>上传文件</UButton>}
            {loading && <UButton process={progress} loading={loading}>上传中</UButton>}
            <input type="file" className={style.file} id="real-file-input" onChange={onFileChange}/>
            {file && (
                <div className={style.preview}>
                    <div className={style.clean} onClick={onFileClean}>×</div>
                    <div className={style.name}>{file.name}</div>
                </div>
            )}

            {/* Advanced settings toggle */}
            <div className={style.advToggle} onClick={() => setShowAdv(v => !v)}>
                <span>{showAdv ? '▾' : '▸'}</span>
                <span>高级设置</span>
            </div>

            {showAdv && (
                <div className={style.advPanel}>
                    <div className={style.advRow}>
                        <span className={style.advLabel}>下载次数限制</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <input
                                type="number"
                                min={0}
                                max={999}
                                className={style.advInput}
                                value={settings.maxDownloads}
                                onChange={onMaxDownloadsChange}
                            />
                            <span className={style.advHint}>0 = 不限制</span>
                        </div>
                    </div>
                    <div className={style.advRow}>
                        <span className={style.advLabel}>过期时间</span>
                        <select
                            className={style.advSelect}
                            value={settings.expiresIn}
                            onChange={onExpiryChange}
                        >
                            {EXPIRY_OPTIONS.map(h => (
                                <option key={h} value={h * 3600}>{h} 小时</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    </div>
}

const PanelLeftShow: React.FC<{
    code: string;
    set_code: (code: string) => void;
    settings: UploadSettings;
}> = ({code, set_code, settings}) => {
    const classes = useShowStyle();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            message.success("复制成功！");
        } catch (err) {
            message.warning("复制失败，请手动选择文本复制");
        }
    };

    const expiryHours = Math.round(settings.expiresIn / 3600);
    const downloadLimit = settings.maxDownloads === 0 ? '不限' : `${settings.maxDownloads} 次`;

    return (
        <div className={classes.container}>
            <div className={classes.form}>
                <button
                    className={classes.closeButton}
                    onClick={() => set_code('')}
                    aria-label="关闭"
                >×</button>
                <h2 className={classes.title}>上传成功!</h2>

                <div className={classes.codeWrapper}>
                    <pre className={classes.pre}>
                        <code>{code}</code>
                        <button className={classes.copyButton} onClick={handleCopy}>
                            一键复制
                        </button>
                    </pre>
                </div>

                <div className={classes.metaInfo}>
                    <span className={classes.metaItem}>下载限制：{downloadLimit}</span>
                    <span className={classes.metaItem}>有效期：{expiryHours} 小时</span>
                </div>
            </div>
        </div>
    );
};
