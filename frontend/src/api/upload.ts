import { useState } from 'react';

export interface UploadSettings {
    maxDownloads: number;  // 0 = unlimited
    expiresIn: number;     // seconds
}

interface UploadRes {
    code: string
}

export const useFileUpload = () => {
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File, settings?: UploadSettings): Promise<string> => {
        setLoading(true);
        setError(null);
        setProgress(0);

        const maxDownloads = settings?.maxDownloads ?? 3;
        const expiresIn    = settings?.expiresIn    ?? 28800;

        try {
            const url = `/api/ushare/${file.name}`;

            // 1. 初始化上传
            const res1 = await fetch(url, {
                method: "PUT",
                headers: {
                    "X-File-Size":      file.size.toString(),
                    "X-Max-Downloads":  maxDownloads.toString(),
                    "X-Expires-In":     expiresIn.toString(),
                }
            });

            if (!res1.ok) {
                console.log(`[W] upload: put file not ok, status = ${res1.status}, res = ${await res1.text()}`)
                if (res1.status === 401) {
                    window.location.href = "/login?next=/share"
                    return ""
                }
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

                const res = await fetch(`/api/ushare/${code}`, {
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

                const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                setProgress(currentProgress);
            }

            return code;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { uploadFile, progress, loading, error };
};
