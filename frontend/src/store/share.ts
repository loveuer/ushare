import {create} from 'zustand'

type Store = {
    file: File | null,
    setFile: (f: File | null) => void
    code: string,
    setCode: (value:string) => void
}

export const useStore = create<Store>()((set) => ({
    file: null,
    setFile: (f: File | null = null) => {
        set(state => {
            return {...state, file: f}
        })
    },
    code: '',
    setCode: (value:string= '') => {
        set(state => {
            return {...state, code: value}
        })
    }
}))