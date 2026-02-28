export interface ApiToken {
    id: number;
    user_id: number;
    name: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
}

export interface CreateTokenRes {
    id: number;
    name: string;
    token: string;
    created_at: string;
}

const jsonHeaders: HeadersInit = {'Content-Type': 'application/json'};

export const tokenApi = {
    list: async (): Promise<ApiToken[]> => {
        const res = await fetch('/api/token', {headers: jsonHeaders});
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '查询失败');
        }
        return (await res.json()).data;
    },

    create: async (name: string): Promise<CreateTokenRes> => {
        const res = await fetch('/api/token', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({name}),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '创建失败');
        }
        return (await res.json()).data;
    },

    delete: async (id: number): Promise<void> => {
        const res = await fetch('/api/token', {
            method: 'DELETE',
            headers: jsonHeaders,
            body: JSON.stringify({id}),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '删除失败');
        }
    },
};
