import React from 'react';
import {Dialog} from '../../../component/dialog/dialog.tsx';
import {Sender} from './sender.tsx';

interface SendDialogProps {
    open: boolean;
    onSend: (msg: string, files: File[]) => void;
    onClose: () => void;
    name: string;
}

export const SendDialog: React.FC<SendDialogProps> = ({open, onSend, onClose, name}) => {
    return (
        <Dialog open={open} title={`发送消息给${name}`} onClose={onClose}>
            <Sender onSend={onSend} />
        </Dialog>
    );
}; 