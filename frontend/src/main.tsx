import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {Login} from "./page/login.tsx";
import {FileSharing} from "./page/share.tsx";

const container = document.getElementById('root')
const root = createRoot(container!)
const router = createBrowserRouter([
    {path: "/login", element: <Login />},
    {path: "*", element: <FileSharing />},
])

root.render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
