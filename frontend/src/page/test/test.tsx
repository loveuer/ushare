import {useState} from "react";
import {createUseStyles} from "react-jss";

const useClass = createUseStyles({
    container: {}
})
export const TestPage = () => {
    const classes = useClass()
    const [_open, setOpen] = useState<boolean>(false)

    const handleOpen = () => {
        setOpen(true)
    }

    return <div className={classes.container}>
        <button onClick={handleOpen}>open</button>
    </div>
}