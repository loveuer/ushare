import { useState } from 'react';

interface UploadRes {
    code: string
}

export const useFileUpload = () => {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File): Promise<string> => {
        setLoading(true);
        setError(null);
        setProgress(0);

        try {
            console.log(`[D] api.Upload: upload file = ${file.name}, size = ${file.size}`, file);
            const url = `/api/share/${file.name}`;

            // 1. 初始化上传
            const res1 = await fetch(url, {
                method: "PUT",
                headers: {"X-File-Size": file.size.toString()}
            });

            if (!res1.ok) {
                throw new Error("上传失败<1>");
            }

            const j1 = await res1.json() as UploadRes;
            if (!j1.code) {
                throw new Error("上传失败<2>");
            }

            // 2. 准备分片上传
            const CHUNK_SIZE = 1024 * 1024;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const code = j1.code;

            // 3. 上传分片
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                const start = chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const res = await fetch(`/api/share/${code}`, {
                    method: "POST",
                    headers: {
                        "Range": `bytes=${start}-${end - 1}`,
                        "Content-Type": "application/octet-stream"
                    },
                    body: chunk
                });

                if (!res.ok) {
                    const err = await res.text();
                    throw new Error(`上传失败<3>: ${err}`);
                }

                // 更新进度
                // const currentProgress = Number(((chunkIndex + 1) / totalChunks * 100).toFixed(2)); // 小数
                const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100); // 整数 0-100
                setProgress(currentProgress);
            }

            return code;
        } catch (err) {
            throw err; // 将错误继续抛出以便组件处理
        } finally {
            setLoading(false);
        }
    };

    return { uploadFile, progress, loading, error };
};