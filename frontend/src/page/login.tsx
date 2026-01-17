import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import { useAuth } from "../api/auth.ts";
import { UButton } from "../component/button/u-button.tsx";

const useClass = createUseStyles({
    container: {
        overflow: 'hidden',
        height: '100vh',
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e3f2fd",
    },
    form: {
        backgroundColor: "#C8E6C9",
        boxShadow: "inset 0 0 15px rgba(56, 142, 60, 0.15)",
        padding: "30px",
        borderRadius: "15px",
        width: "350px",
        display: "flex",
        flexDirection: "column",
    },
    title: {
        color: "#2c9678",
        marginTop: 0,
        marginBottom: "25px",
    },
    inputContainer: {
        position: 'relative',
        width: '100%',
        marginTop: '15px',
    },
    inputField: {
        width: "100%",
        padding: "11px",
        border: "2px solid #ddd",
        borderRadius: "5px",
        fontSize: "16px",
        boxSizing: "border-box",
        transition: "border-color 0.3s",
        background: "rgba(255,255,255,0.8)",
        "&:focus": {
            outline: "none",
            borderColor: "#2c9678",
        },
        "&:hover": {
            borderColor: "#2c9678",
        }
    },
    iconButton: {
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: '#666',
        "&:hover": {
            color: '#333',
        }
    },
    button: {
        marginTop: '25px',
        width: '100%',
        "& > button": {
            width: "100%",
        },
    }
})

export const Login: React.FC = () => {
    const classes = useClass()
    const { login } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const onLogin = async () => {
        try {
            await login(username, password)
            window.location.href = "/"
        } catch (_e) {

        }
    }

    return <div className={classes.container}>
        <div className={classes.form}>
            <h2 className={classes.title}>UShare</h2>

            <div className={classes.inputContainer}>
                <input
                    className={classes.inputField}
                    placeholder="请输入账号"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                {username && (
                    <button
                        className={classes.iconButton}
                        onClick={() => setUsername("")}
                        style={{ right: '10px', fontSize: '16px' }}
                    >
                        ×
                    </button>
                )}
            </div>

            <div className={classes.inputContainer}>
                <input
                    className={classes.inputField}
                    placeholder="请输入密码"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    className={classes.iconButton}
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    style={{ right: '10px', fontSize: '12px' }}
                >
                    {showPassword ? "🫣" : "🙈"}
                </button>
            </div>

            <div className={classes.button}>
                <UButton onClick={onLogin}>登录</UButton>
            </div>
        </div>
    </div>
}
