import React, {useEffect, useState} from 'react';
import {createUseStyles} from 'react-jss';
import {adminApi, AdminUser, Role, UpdateUserReq} from '../../api/admin.ts';
import {message} from '../../hook/message/u-message.tsx';
import {UButton} from '../../component/button/u-button.tsx';

const PERM_LABELS: Record<string, string> = {
    user_manage: '用户管理',
    upload: '上传文件',
    token_manage: 'Token管理',
};

const useStyle = createUseStyles({
    container: {
        minHeight: '100vh',
        backgroundColor: '#e3f2fd',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Arial, sans-serif",
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
    },
    backBtn: {
        background: 'transparent',
        border: '2px solid #2c9678',
        color: '#2c9678',
        borderRadius: '6px',
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s',
        '&:hover': {backgroundColor: 'rgba(44,150,120,0.1)'},
    },
    title: {
        color: '#2c9678',
        margin: 0,
        fontSize: '22px',
        fontWeight: 600,
    },
    card: {
        backgroundColor: '#C8E6C9',
        boxShadow: 'inset 0 0 15px rgba(56, 142, 60, 0.15)',
        borderRadius: '15px',
        padding: '24px',
        marginBottom: '24px',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    cardTitle: {
        color: '#2c9678',
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    th: {
        backgroundColor: 'rgba(44,150,120,0.15)',
        color: '#2c9678',
        padding: '10px 14px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 600,
    },
    td: {
        padding: '10px 14px',
        borderBottom: '1px solid rgba(44,150,120,0.1)',
        fontSize: '14px',
        color: '#333',
    },
    badgeActive: {
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: '#c8e6c9',
        color: '#2e7d32',
    },
    badgeInactive: {
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: '#ffcdd2',
        color: '#c62828',
    },
    actionBtn: {
        background: 'transparent',
        border: '1px solid #2c9678',
        color: '#2c9678',
        borderRadius: '4px',
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: '12px',
        marginRight: '6px',
        transition: 'background-color 0.2s',
        '&:hover': {backgroundColor: 'rgba(44,150,120,0.1)'},
    },
    deleteBtn: {
        background: 'transparent',
        border: '1px solid #c62828',
        color: '#c62828',
        borderRadius: '4px',
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'background-color 0.2s',
        '&:hover': {backgroundColor: 'rgba(198,40,40,0.08)'},
    },
    permTag: {
        display: 'inline-block',
        backgroundColor: 'rgba(44,150,120,0.15)',
        color: '#2c9678',
        borderRadius: '10px',
        padding: '2px 8px',
        fontSize: '12px',
        marginRight: '4px',
        marginBottom: '2px',
    },
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dialog: {
        backgroundColor: '#C8E6C9',
        boxShadow: '0 8px 32px rgba(44,150,120,0.2)',
        borderRadius: '15px',
        padding: '28px',
        width: '400px',
        maxWidth: '90vw',
        boxSizing: 'border-box',
    },
    dialogTitle: {
        color: '#2c9678',
        margin: '0 0 20px',
        fontSize: '16px',
        fontWeight: 600,
    },
    formRow: {
        marginBottom: '14px',
    },
    label: {
        display: 'block',
        color: '#2c9678',
        fontSize: '13px',
        marginBottom: '5px',
        fontWeight: 500,
    },
    input: {
        width: '100%',
        padding: '9px 11px',
        border: '2px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.8)',
        transition: 'border-color 0.2s',
        '&:focus': {outline: 'none', borderColor: '#2c9678'},
    },
    select: {
        width: '100%',
        padding: '9px 11px',
        border: '2px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.8)',
        transition: 'border-color 0.2s',
        '&:focus': {outline: 'none', borderColor: '#2c9678'},
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    dialogActions: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginTop: '20px',
    },
    cancelBtn: {
        background: 'transparent',
        border: '2px solid #aaa',
        color: '#666',
        borderRadius: '5px',
        padding: '8px 18px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'border-color 0.2s',
        '&:hover': {borderColor: '#888'},
    },
    dangerBtn: {
        backgroundColor: '#c62828',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '8px 18px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s',
        '&:hover': {backgroundColor: '#b71c1c'},
    },
    emptyTip: {
        textAlign: 'center',
        color: '#999',
        padding: '24px',
        fontSize: '14px',
    },
});

type DialogMode = 'create' | 'edit';

interface DialogState {
    open: boolean;
    mode: DialogMode;
    user?: AdminUser;
    username: string;
    password: string;
    roleId: number;
    active: boolean;
}

const emptyDialog = (defaultRoleId = 0): DialogState => ({
    open: false,
    mode: 'create',
    username: '',
    password: '',
    roleId: defaultRoleId,
    active: true,
});

export const AdminPage: React.FC = () => {
    const classes = useStyle();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState<DialogState>(emptyDialog());
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

    const loadData = async () => {
        try {
            const [u, r] = await Promise.all([adminApi.listUsers(), adminApi.listRoles()]);
            setUsers(u ?? []);
            setRoles(r ?? []);
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch('/api/uauth/me').then(res => {
            if (res.status === 401) {
                window.location.href = '/login?next=/admin';
            } else if (res.status === 403) {
                message.error('权限不足');
            } else {
                loadData();
            }
        }).catch(() => {
            window.location.href = '/login?next=/admin';
        });
    }, []);

    const openCreate = () => {
        const defaultRoleId = roles.find(r => r.name === 'user')?.id ?? roles[0]?.id ?? 0;
        setDialog({...emptyDialog(defaultRoleId), open: true, mode: 'create'});
    };

    const openEdit = (user: AdminUser) => {
        setDialog({
            open: true,
            mode: 'edit',
            user,
            username: user.username,
            password: '',
            roleId: user.role_id,
            active: user.active,
        });
    };

    const closeDialog = () => setDialog(emptyDialog());

    const handleSave = async () => {
        if (dialog.mode === 'create') {
            if (!dialog.username.trim()) return message.warning('请输入用户名');
            if (!dialog.password) return message.warning('请输入密码');
            if (!dialog.roleId) return message.warning('请选择角色');
        }
        setSaving(true);
        try {
            if (dialog.mode === 'create') {
                await adminApi.createUser({
                    username: dialog.username.trim(),
                    password: dialog.password,
                    role_id: dialog.roleId,
                });
                message.success('创建成功');
            } else if (dialog.user) {
                const req: UpdateUserReq = {};
                if (dialog.roleId !== dialog.user.role_id) req.role_id = dialog.roleId;
                if (dialog.active !== dialog.user.active) req.active = dialog.active;
                if (dialog.password) req.password = dialog.password;
                await adminApi.updateUser(dialog.user.id, req);
                message.success('更新成功');
            }
            closeDialog();
            await loadData();
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '操作失败');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminApi.deleteUser(deleteTarget.id);
            message.success('删除成功');
            setDeleteTarget(null);
            await loadData();
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '删除失败');
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <button className={classes.backBtn} onClick={() => window.location.href = '/share'}>
                    ← 返回
                </button>
                <h2 className={classes.title}>管理控制台</h2>
            </div>

            {/* Users */}
            <div className={classes.card}>
                <div className={classes.cardHeader}>
                    <h3 className={classes.cardTitle}>用户管理</h3>
                    <UButton onClick={openCreate}>添加用户</UButton>
                </div>
                {loading ? (
                    <div className={classes.emptyTip}>加载中...</div>
                ) : (
                    <table className={classes.table}>
                        <thead>
                        <tr>
                            <th className={classes.th}>ID</th>
                            <th className={classes.th}>用户名</th>
                            <th className={classes.th}>角色</th>
                            <th className={classes.th}>状态</th>
                            <th className={classes.th}>创建时间</th>
                            <th className={classes.th}>操作</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td className={classes.td} colSpan={6}>
                                    <div className={classes.emptyTip}>暂无用户</div>
                                </td>
                            </tr>
                        ) : users.map(u => (
                            <tr key={u.id}>
                                <td className={classes.td}>{u.id}</td>
                                <td className={classes.td}>{u.username}</td>
                                <td className={classes.td}>{u.role?.label ?? '-'}</td>
                                <td className={classes.td}>
                                    <span className={u.active ? classes.badgeActive : classes.badgeInactive}>
                                        {u.active ? '启用' : '禁用'}
                                    </span>
                                </td>
                                <td className={classes.td}>
                                    {new Date(u.created_at).toLocaleDateString('zh-CN')}
                                </td>
                                <td className={classes.td}>
                                    <button className={classes.actionBtn} onClick={() => openEdit(u)}>编辑</button>
                                    <button className={classes.deleteBtn} onClick={() => setDeleteTarget(u)}>删除</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Roles */}
            <div className={classes.card}>
                <div className={classes.cardHeader}>
                    <h3 className={classes.cardTitle}>角色权限</h3>
                </div>
                <table className={classes.table}>
                    <thead>
                    <tr>
                        <th className={classes.th}>角色</th>
                        <th className={classes.th}>权限</th>
                    </tr>
                    </thead>
                    <tbody>
                    {roles.map(r => (
                        <tr key={r.id}>
                            <td className={classes.td}>{r.label}</td>
                            <td className={classes.td}>
                                {r.permissions.split(',')
                                    .map(p => p.trim())
                                    .filter(Boolean)
                                    .map(p => (
                                        <span key={p} className={classes.permTag}>
                                            {PERM_LABELS[p] ?? p}
                                        </span>
                                    ))}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            {dialog.open && (
                <div className={classes.overlay} onClick={e => e.target === e.currentTarget && closeDialog()}>
                    <div className={classes.dialog}>
                        <h3 className={classes.dialogTitle}>
                            {dialog.mode === 'create' ? '添加用户' : `编辑用户: ${dialog.user?.username}`}
                        </h3>

                        {dialog.mode === 'create' && (
                            <div className={classes.formRow}>
                                <label className={classes.label}>用户名</label>
                                <input
                                    className={classes.input}
                                    placeholder="请输入用户名"
                                    value={dialog.username}
                                    onChange={e => setDialog(d => ({...d, username: e.target.value}))}
                                />
                            </div>
                        )}

                        <div className={classes.formRow}>
                            <label className={classes.label}>
                                {dialog.mode === 'create' ? '密码' : '新密码（留空则不修改）'}
                            </label>
                            <input
                                className={classes.input}
                                type="password"
                                placeholder={dialog.mode === 'create' ? '请输入密码' : '留空不修改'}
                                value={dialog.password}
                                onChange={e => setDialog(d => ({...d, password: e.target.value}))}
                            />
                        </div>

                        <div className={classes.formRow}>
                            <label className={classes.label}>角色</label>
                            <select
                                className={classes.select}
                                value={dialog.roleId}
                                onChange={e => setDialog(d => ({...d, roleId: Number(e.target.value)}))}
                            >
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {dialog.mode === 'edit' && (
                            <div className={classes.formRow}>
                                <label className={classes.label}>状态</label>
                                <div className={classes.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        id="active-check"
                                        checked={dialog.active}
                                        onChange={e => setDialog(d => ({...d, active: e.target.checked}))}
                                    />
                                    <label htmlFor="active-check" style={{color: '#555', fontSize: '14px', cursor: 'pointer'}}>
                                        {dialog.active ? '启用' : '禁用'}
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className={classes.dialogActions}>
                            <button className={classes.cancelBtn} onClick={closeDialog}>取消</button>
                            <UButton onClick={handleSave} loading={saving}>
                                {dialog.mode === 'create' ? '创建' : '保存'}
                            </UButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Dialog */}
            {deleteTarget && (
                <div className={classes.overlay} onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
                    <div className={classes.dialog}>
                        <h3 className={classes.dialogTitle}>确认删除</h3>
                        <p style={{color: '#555', marginTop: 0, marginBottom: '20px', fontSize: '14px'}}>
                            确定要删除用户 <strong>{deleteTarget.username}</strong> 吗？此操作不可撤销。
                        </p>
                        <div className={classes.dialogActions}>
                            <button className={classes.cancelBtn} onClick={() => setDeleteTarget(null)}>取消</button>
                            <button className={classes.dangerBtn} onClick={handleDelete}>确认删除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
