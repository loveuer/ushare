import "./share.css";
// FileSharing.tsx
import { useRef, useState } from 'react';

type FileItemProps = {
    fileName: string;
    onClear: () => void;
};

const FileItem = ({ fileName, onClear }: FileItemProps) => (
    <div className="flex items-center gap-2 my-2">
        <button
            className="w-5 h-5 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors"
            onClick={onClear}
        >
            ×
        </button>
        <span className="text-gray-700">{fileName}</span>
    </div>
);

const MiddlePanel = () => (
    <div className="relative bg-gray-200 overflow-hidden">
        <div
            className="mid-left absolute w-full h-full bg-blue-100"
            style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
        <div
            className="mid-right absolute w-full h-full bg-green-100"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
        />
    </div>
);

const UploadPanel = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        if (!selectedFile && fileInputRef.current) {
            fileInputRef.current.click();
        } else {
            // Handle upload logic
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                // Replace with actual API call
                fetch('https://your-upload-api.com/upload', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        alert(`Upload success! Code: ${data.code}`);
                        setSelectedFile(null);
                    })
                    .catch(() => alert('Upload failed'));
            }
        }
    };

    return (
        <div className="share-left flex flex-col items-center justify-center p-5 bg-blue-50 h-full">
            <div className="bg-blue-100 rounded-xl p-6 w-4/5 shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-cyan-900">上传文件</h2>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                />
                <button
                    onClick={handleFileSelect}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                    {selectedFile ? '确认上传' : '选择文件'}
                </button>
                {selectedFile && (
                    <FileItem
                        fileName={selectedFile.name}
                        onClear={() => setSelectedFile(null)}
                    />
                )}
            </div>
        </div>
    );
};

const DownloadPanel = () => {
    const [downloadCode, setDownloadCode] = useState('');

    const handleDownload = () => {
        if (!downloadCode) {
            alert('请输入下载码');
            return;
        }
        // Replace with actual download logic
        window.location.href = `https://your-download-api.com/download?code=${downloadCode}`;
    };

    return (
        <div className="share-right flex flex-col items-center justify-center p-5 bg-green-50 h-full">
            <div className="bg-green-100 rounded-xl p-6 w-4/5 shadow-inner">
                <h2 className="text-xl font-semibold mb-4 text-teal-900">下载文件</h2>
                <input
                    type="text"
                    placeholder="输入下载码"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg mb-4"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value)}
                />
                <button
                    onClick={handleDownload}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors w-full"
                >
                    下载文件
                </button>
            </div>
        </div>
    );
};

export const FileSharing = () => (
    <div className="h-screen grid grid-cols-[40%_20%_40%]">
        <UploadPanel />
        <MiddlePanel />
        <DownloadPanel />
    </div>
);