import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import { CloudBackground } from "../component/fluid/cloud.tsx";
import {useAuth} from "../api/auth.ts";

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
        position: 'relative',
    },
    login_container: {
        background: "rgba(255,255,255,.5)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        width: "350px",
        height: '100%',
        position: 'absolute',
        left: '70%',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    form: {
        height: '100%',
        width: '100%',
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'column',
        color: "#1a73e8",
        padding: '40px',
    },
    input: {
        width: '100%',
        marginTop: '20px',
        "& > input": {
            width: "calc(100% - 30px)",
            padding: "12px 15px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "16px",
            transition: "border-color 0.3s",

            "&:focus": {
                outline: "none",
                borderColor: "#1a73e8",
                boxShadow: "0 0 0 2px rgba(26, 115, 232, 0.2)",
            },
            "&:hover": {
                borderColor: "#1a73e8",
            }
        },
    },
    button: {
        marginTop: '20px',
        width: '100%',
        "& > button": {
            width: "100%",
            padding: "12px",
            background: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            transition: "background 0.3s",
            "&:hover": {
                background: "#1557b0",
            },
        },
    },

    inputContainer: {
        position: 'relative',
        width: '100%',
        marginTop: '20px',
    },
    inputField: {
        width: "calc(100% - 52px)",
        padding: "12px 35px 12px 15px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "16px",
        transition: "border-color 0.3s",
        "&:focus": {
            outline: "none",
            borderColor: "#1a73e8",
            boxShadow: "0 0 0 2px rgba(26, 115, 232, 0.2)",
        },
        "&:hover": {
            borderColor: "#1a73e8",
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
    }
})

export const Login: React.FC = () => {
    const classes = useClass()
    const {login} = useAuth()
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
        <CloudBackground/>
        <div className={classes.login_container}>
            <div className={classes.form}>
                <h2>UShare</h2>

                {/* 用户名输入框 */}
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

                {/* 密码输入框 */}
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
                        {showPassword ? "👁" : "👁"}
                    </button>
                </div>

                <div className={classes.button}>
                    <button onClick={onLogin}>登录</button>
                </div>
            </div>
        </div>
    </div>
}