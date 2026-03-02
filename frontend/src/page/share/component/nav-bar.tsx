import React, {useEffect, useState} from 'react';
import {createUseStyles} from 'react-jss';

const useStyle = createUseStyles({
    nav: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
        backgroundColor: '#2c9678',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        flexShrink: 0,
    },
    brand: {
        color: 'white',
        fontWeight: 700,
        fontSize: '18px',
        letterSpacing: '1px',
        textDecoration: 'none',
    },
    links: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    link: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: '13px',
        textDecoration: 'none',
        padding: '5px 12px',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
        },
    },
    divider: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: '13px',
    },
});

export const NavBar: React.FC = () => {
    const style = useStyle();
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasTokenPerm, setHasTokenPerm] = useState(false);

    useEffect(() => {
        fetch('/api/uauth/me').then(async res => {
            if (res.ok) {
                const json = await res.json();
                const perms: string[] = json.data?.permissions ?? [];
                setIsAdmin(perms.includes('user_manage'));
                setHasTokenPerm(perms.includes('token_manage'));
            }
        }).catch(() => {});
    }, []);

    const showLinks = isAdmin || hasTokenPerm;

    return (
        <nav className={style.nav}>
            <a href="/share" className={style.brand}>UShare</a>
            {showLinks && (
                <div className={style.links}>
                    {hasTokenPerm && (
                        <a href="/self" className={style.link}>个人中心</a>
                    )}
                    {isAdmin && hasTokenPerm && (
                        <span className={style.divider}>|</span>
                    )}
                    {isAdmin && (
                        <a href="/admin" className={style.link}>管理控制台</a>
                    )}
                </div>
            )}
        </nav>
    );
};
