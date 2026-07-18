import React, { useState, useEffect } from 'react';
import { useLanguage } from '../src/contexts/LanguageContext';

export const MatchDbSyncStatus: React.FC = () => {
    const { language } = useLanguage();
    const [status, setStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
    const [lastSync, setLastSync] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const isFr = language === 'fr';

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/worldcup/sync/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                if (data.lastApiSyncMs > 0) {
                    setLastSync(data.lastApiSyncMs);
                }
                setErrorMsg(data.lastSyncError);
            }
        } catch (e) {
            console.error('Failed to fetch match sync status:', e);
            setStatus('error');
            setErrorMsg(e instanceof Error ? e.message : 'Network error');
        }
    };

    useEffect(() => {
        fetchStatus();
        // Poll every 30 seconds for background updates
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSync = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (actionLoading || status === 'syncing') return;

        setActionLoading(true);
        setStatus('syncing');
        try {
            const res = await fetch('/api/worldcup/sync', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                if (data.lastApiSyncMs > 0) {
                    setLastSync(data.lastApiSyncMs);
                }
                setErrorMsg(data.lastSyncError);
                window.dispatchEvent(new CustomEvent('worldcup-matches-synced'));
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus('error');
                setErrorMsg(data.details || 'Sync failed');
            }
        } catch (e) {
            console.error('Failed to trigger manual sync:', e);
            setStatus('error');
            setErrorMsg(e instanceof Error ? e.message : 'Network error');
        } finally {
            setActionLoading(false);
        }
    };

    // Helper to format last sync time nicely
    const formatLastSync = () => {
        if (!lastSync) return '';
        const secondsAgo = Math.floor((Date.now() - lastSync) / 1000);
        if (secondsAgo < 60) return isFr ? 'À l\'instant' : 'Just now';
        const minutesAgo = Math.floor(secondsAgo / 60);
        if (minutesAgo < 60) return isFr ? `Il y a ${minutesAgo} min` : `${minutesAgo}m ago`;
        const hoursAgo = Math.floor(minutesAgo / 60);
        return isFr ? `Il y a ${hoursAgo}h` : `${hoursAgo}h ago`;
    };

    if (status === 'syncing') {
        return (
            <div 
                id="db-sync-status-syncing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/10 select-none shadow-sm transition-all"
            >
                <span className="material-symbols-outlined notranslate text-xs animate-spin" translate="no" style={{ fontSize: '14px' }}>
                    sync
                </span>
                <span>{isFr ? 'Synchronisation...' : 'Syncing...'}</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <button
                id="db-sync-status-error"
                onClick={handleSync}
                title={errorMsg || 'Database connection error'}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                </span>
                <span className="material-symbols-outlined notranslate text-xs group-hover:animate-spin" translate="no" style={{ fontSize: '14px' }}>
                    sync_problem
                </span>
                <span>{isFr ? 'Synchro inactive (Tapoter pour relancer)' : 'Not Syncing (Tap to sync)'}</span>
            </button>
        );
    }

    return (
        <button
            id="db-sync-status-synced"
            onClick={handleSync}
            title={`${isFr ? 'Dernière synchro :' : 'Last sync:'} ${formatLastSync() || (isFr ? 'Inconnue' : 'Unknown')}`}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-sm cursor-pointer select-none"
        >
            <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>{isFr ? 'Base à jour' : 'DB Synced'}</span>
            {lastSync && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium ml-0.5 transition-colors group-hover:text-emerald-500">
                    ({formatLastSync()})
                </span>
            )}
        </button>
    );
};

export default MatchDbSyncStatus;
