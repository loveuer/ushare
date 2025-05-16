import {create} from 'zustand'

export interface LocalStore {
    id: string;
    name: string;
    channel?: RTCDataChannel;
    set: (id: string, name: string) => void;
    setChannel: (chan?: RTCDataChannel) => void;
}

export const useLocalStore = create<LocalStore>()((_set, _get) => ({
    id: '',
    name: '',
    set: (id: string, name: string) => {
        _set(state => {
            return {...state, id: id, name: name};
        })
    },
    setChannel: (ch?: RTCDataChannel) => {
        _set(state => {
            return {...state, channel: ch}
        })
    }
}))