export interface Role {
    id: number;
    name: string;
    label: string;
    permissions: string;
    created_at: string;
    updated_at: string;
}

export interface AdminUser {
    id: number;
    username: string;
    role_id: number;
    role: Role;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserReq {
    username: string;
    password: string;
    role_id: number;
}

export interface UpdateUserReq {
    role_id?: number;
    active?: boolean;
    password?: string;
}

const jsonHeaders: HeadersInit = {'Content-Type': 'application/json'};

export const adminApi = {
    listUsers: async (): Promise<AdminUser[]> => {
        const res = await fetch('/api/admin/users', {headers: jsonHeaders});
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '查询失败');
        }
        return (await res.json()).data;
    },

    createUser: async (req: CreateUserReq): Promise<AdminUser> => {
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(req),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '创建失败');
        }
        return (await res.json()).data;
    },

    updateUser: async (id: number, req: UpdateUserReq): Promise<AdminUser> => {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: jsonHeaders,
            body: JSON.stringify(req),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '更新失败');
        }
        return (await res.json()).data;
    },

    deleteUser: async (id: number): Promise<void> => {
        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: jsonHeaders,
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '删除失败');
        }
    },

    listRoles: async (): Promise<Role[]> => {
        const res = await fetch('/api/admin/roles', {headers: jsonHeaders});
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.msg || '查询失败');
        }
        return (await res.json()).data;
    },
};
