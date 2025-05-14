// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {Login} from "./page/login.tsx";
import {FileSharing} from "./page/share.tsx";
import {LocalSharing} from "./page/local.tsx";

const container = document.getElementById('root')
const root = createRoot(container!)
const router = createBrowserRouter([
    {path: "/login", element: <Login />},
    {path: "/share", element: <FileSharing />},
    {path: "*", element: <LocalSharing />},
])

root.render(
    // <StrictMode>
        <RouterProvider router={router} />
    // </StrictMode>,
)
