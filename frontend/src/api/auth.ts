import {useState} from "react";
import {message} from "../hook/message/u-message.tsx";

export interface User {
    id: number;
    username: string;
    login_at: number;
    token: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null)

    const login = async (username: string, password: string) => {
        let res = await fetch("/api/uauth/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: username, password: password}),
        })

        if(res.status !== 200) {
            message.error("账号或密码错误")
            throw new Error(await res.text())
        }

        let jes = await res.json() as User;

        setUser(jes)
    }

    return {user, login}
}