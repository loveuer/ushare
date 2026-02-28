import React, {useEffect, useState} from 'react';
import {createUseStyles} from 'react-jss';
import {tokenApi, ApiToken, CreateTokenRes} from '../../api/token.ts';
import {message} from '../../hook/message/u-message.tsx';
import {UButton} from '../../component/button/u-button.tsx';

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
    cardTitle: {
        color: '#2c9678',
        marginTop: 0,
        marginBottom: '16px',
        fontSize: '16px',
        fontWeight: 600,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    th: {
        backgroundColor: 'rgba(44,150,120,0.15)',
        padding: '10px 12px',
        textAlign: 'left',
        color: '#2c9678',
        fontWeight: 600,
        borderBottom: '2px solid rgba(44,150,120,0.3)',
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid rgba(44,150,120,0.2)',
        color: '#333',
    },
    trHover: {
        '&:hover': {backgroundColor: 'rgba(44,150,120,0.05)'},
    },
    emptyRow: {
        textAlign: 'center',
        color: '#888',
        padding: '24px',
    },
    actionBtn: {
        padding: '4px 12px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'opacity 0.2s',
        '&:hover': {opacity: 0.8},
    },
    deleteBtn: {
        backgroundColor: '#e53935',
        color: 'white',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    // Dialog overlay
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    dialog: {
        backgroundColor: '#C8E6C9',
        borderRadius: '15px',
        padding: '28px',
        width: '440px',
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
    dialogTitle: {
        color: '#2c9678',
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 600,
    },
    label: {
        display: 'block',
        color: '#2c9678',
        fontSize: '13px',
        marginBottom: '6px',
        fontWeight: 500,
    },
    input: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid rgba(44,150,120,0.4)',
        fontSize: '14px',
        marginBottom: '16px',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255,255,255,0.8)',
        outline: 'none',
        '&:focus': {borderColor: '#2c9678'},
    },
    dialogFooter: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: '8px 18px',
        borderRadius: '6px',
        border: '2px solid #2c9678',
        background: 'transparent',
        color: '#2c9678',
        cursor: 'pointer',
        fontSize: '14px',
        '&:hover': {backgroundColor: 'rgba(44,150,120,0.1)'},
    },
    tokenValueBox: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: '8px',
        padding: '12px 14px',
        fontFamily: 'monospace',
        fontSize: '13px',
        wordBreak: 'break-all',
        marginBottom: '12px',
        color: '#1a1a2e',
        border: '1px solid rgba(44,150,120,0.4)',
    },
    warningText: {
        color: '#e53935',
        fontSize: '12px',
        marginBottom: '16px',
    },
    copyBtn: {
        padding: '8px 18px',
        borderRadius: '6px',
        border: 'none',
        background: '#2c9678',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        '&:hover': {backgroundColor: '#1f6d5a'},
    },
    usageCard: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: '10px',
        padding: '16px 20px',
    },
    usageTitle: {
        color: '#2c9678',
        margin: '0 0 10px',
        fontSize: '14px',
        fontWeight: 600,
    },
    pre: {
        margin: '6px 0',
        padding: '10px 14px',
        backgroundColor: '#1a1a2e',
        color: '#c3e88d',
        borderRadius: '6px',
        fontSize: '13px',
        overflowX: 'auto',
        fontFamily: 'monospace',
    },
});

interface Session {
    user_id: number;
    username: string;
    role_label: string;
    permissions: string[];
}

export const SelfPage: React.FC = () => {
    const style = useStyle();
    const [session, setSession] = useState<Session | null>(null);
    const [tokens, setTokens] = useState<ApiToken[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdToken, setCreatedToken] = useState<CreateTokenRes | null>(null);

    useEffect(() => {
        fetch('/api/uauth/me')
            .then(async res => {
                if (!res.ok) {
                    window.location.href = '/login';
                    return;
                }
                const json = await res.json();
                const s: Session = json.data;
                setSession(s);
                if (!s.permissions.includes('token_manage')) {
                    message.warning('无 Token 管理权限');
                    return;
                }
                return loadTokens();
            })
            .catch(() => {
                window.location.href = '/login';
            })
            .finally(() => setLoading(false));
    }, []);

    async function loadTokens() {
        try {
            const list = await tokenApi.list();
            setTokens(list ?? []);
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '加载失败');
        }
    }

    async function handleCreate() {
        if (!newTokenName.trim()) {
            message.warning('请输入 Token 名称');
            return;
        }
        setCreating(true);
        try {
            const res = await tokenApi.create(newTokenName.trim());
            setCreatedToken(res);
            setNewTokenName('');
            setShowCreate(false);
            await loadTokens();
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '创建失败');
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(id: number, name: string) {
        if (!confirm(`确认吊销 Token「${name}」？`)) return;
        try {
            await tokenApi.delete(id);
            message.success('已吊销');
            setTokens(prev => prev.filter(t => t.id !== id));
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : '操作失败');
        }
    }

    function handleCopyToken(val: string) {
        navigator.clipboard.writeText(val)
            .then(() => message.success('已复制到剪贴板'))
            .catch(() => message.warning('复制失败，请手动复制'));
    }

    function formatDate(s: string | null) {
        if (!s) return '-';
        return new Date(s).toLocaleString();
    }

    const hasTokenPerm = session?.permissions.includes('token_manage') ?? false;

    return (
        <div className={style.container}>
            <div className={style.header}>
                <button className={style.backBtn} onClick={() => window.history.back()}>← 返回</button>
                <h2 className={style.title}>个人中心</h2>
            </div>

            {!loading && session && (
                <>
                    {/* User info card */}
                    <div className={style.card}>
                        <h3 className={style.cardTitle}>账号信息</h3>
                        <p style={{margin: '4px 0', color: '#333', fontSize: '14px'}}>
                            用户名：<strong>{session.username}</strong>
                        </p>
                        <p style={{margin: '4px 0', color: '#333', fontSize: '14px'}}>
                            角色：<strong>{session.role_label}</strong>
                        </p>
                    </div>

                    {/* Token management card */}
                    {hasTokenPerm && (
                        <div className={style.card}>
                            <div className={style.topBar}>
                                <h3 className={style.cardTitle} style={{margin: 0}}>API Token</h3>
                                <UButton onClick={() => setShowCreate(true)}>+ 新建 Token</UButton>
                            </div>

                            <table className={style.table}>
                                <thead>
                                <tr>
                                    <th className={style.th}>名称</th>
                                    <th className={style.th}>创建时间</th>
                                    <th className={style.th}>最后使用</th>
                                    <th className={style.th}>操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {tokens.length === 0 ? (
                                    <tr>
                                        <td className={style.td} colSpan={4} style={{textAlign: 'center', color: '#888'}}>
                                            暂无 Token，点击「新建 Token」创建
                                        </td>
                                    </tr>
                                ) : (
                                    tokens.map(t => (
                                        <tr key={t.id} className={style.trHover}>
                                            <td className={style.td}>{t.name}</td>
                                            <td className={style.td}>{formatDate(t.created_at)}</td>
                                            <td className={style.td}>{formatDate(t.last_used_at)}</td>
                                            <td className={style.td}>
                                                <button
                                                    className={`${style.actionBtn} ${style.deleteBtn}`}
                                                    onClick={() => handleDelete(t.id, t.name)}
                                                >
                                                    吊销
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>

                            {/* Usage guide */}
                            <div style={{marginTop: '20px'}}>
                                <div className={style.usageCard}>
                                    <p className={style.usageTitle}>使用方式（curl 示例）</p>
                                    <pre className={style.pre}>{`curl -H "Authorization: Bearer <your_token>" \\
     -T <file_path> \\
     https://<your_domain>/api/v1/upload/<filename>`}</pre>
                                    <p style={{margin: '8px 0 4px', color: '#555', fontSize: '13px'}}>返回示例：</p>
                                    <pre className={style.pre}>{`{"status":200,"data":{"code":"ABCD1234"}}`}</pre>
                                    <p style={{margin: '8px 0 4px', color: '#555', fontSize: '13px'}}>下载文件：</p>
                                    <pre className={style.pre}>{`https://<your_domain>/ushare/<code>`}</pre>
                                </div>
                            </div>
                        </div>
                    )}

                    {!hasTokenPerm && (
                        <div className={style.card}>
                            <p style={{color: '#888', margin: 0}}>当前角色无 Token 管理权限</p>
                        </div>
                    )}
                </>
            )}

            {/* Create token dialog */}
            {showCreate && (
                <div className={style.overlay} onClick={() => setShowCreate(false)}>
                    <div className={style.dialog} onClick={e => e.stopPropagation()}>
                        <h3 className={style.dialogTitle}>新建 API Token</h3>
                        <label className={style.label}>Token 名称</label>
                        <input
                            className={style.input}
                            placeholder="例：服务器上传脚本"
                            value={newTokenName}
                            onChange={e => setNewTokenName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                        <div className={style.dialogFooter}>
                            <button className={style.cancelBtn} onClick={() => setShowCreate(false)}>取消</button>
                            <UButton onClick={handleCreate} loading={creating} disabled={creating}>
                                创建
                            </UButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Newly created token display - shown only once */}
            {createdToken && (
                <div className={style.overlay} onClick={() => setCreatedToken(null)}>
                    <div className={style.dialog} onClick={e => e.stopPropagation()}>
                        <h3 className={style.dialogTitle}>Token 已创建</h3>
                        <p className={style.warningText}>
                            请立即复制并妥善保存，Token 值仅显示一次，关闭后无法再次查看！
                        </p>
                        <label className={style.label}>Token 名称：{createdToken.name}</label>
                        <div className={style.tokenValueBox}>{createdToken.token}</div>
                        <div className={style.dialogFooter}>
                            <button className={style.cancelBtn} onClick={() => setCreatedToken(null)}>关闭</button>
                            <button className={style.copyBtn} onClick={() => handleCopyToken(createdToken.token)}>
                                复制 Token
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
