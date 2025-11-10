"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArticleIcon from '@mui/icons-material/Article';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Link from "next/link";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

const navHeight = 64;

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
    return (
        <div role="tabpanel" hidden={value !== index} aria-labelledby={`user-tab-${index}`}>
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
}

export default function UserPage() {
    const [tab, setTab] = useState(0);
    const [myPosts, setMyPosts] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
    const [joinedPosts, setJoinedPosts] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
    const [navValue, setNavValue] = useState(3); // index of ユーザー in bottom nav
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [pointsToUse, setPointsToUse] = useState<string>('');
    const [usePointsLoading, setUsePointsLoading] = useState(false);
    const [usePointsError, setUsePointsError] = useState<string | null>(null);
    const [usePointsSuccess, setUsePointsSuccess] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // 自分の投稿を取得
                const myPostsRes = await fetch('/api/me/posts', { credentials: 'same-origin' });
                if (!myPostsRes.ok) {
                    throw new Error('自分の投稿の取得に失敗しました');
                }
                const myPostsData = await myPostsRes.json();

                // 参加した投稿を取得
                const joinedPostsRes = await fetch('/api/me/joined', { credentials: 'same-origin' });
                if (!joinedPostsRes.ok) {
                    throw new Error('参加投稿の取得に失敗しました');
                }
                const joinedPostsData = await joinedPostsRes.json();

                // ユーザー情報（ポイント含む）を取得
                const meRes = await fetch('/api/me', { credentials: 'same-origin' });
                if (!meRes.ok) {
                    throw new Error('ユーザー情報の取得に失敗しました');
                }
                const meData = await meRes.json();

                if (mounted) {
                    setMyPosts(myPostsData);
                    setJoinedPosts(joinedPostsData);
                    setUserPoints(meData.user?.points || 0);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
                    setError(message);
                    setLoading(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleUsePoints = async () => {
        setUsePointsError(null);
        setUsePointsSuccess(null);
        
        const points = parseInt(pointsToUse, 10);
        if (!points || points <= 0) {
            setUsePointsError('有効なポイント数を入力してください');
            return;
        }

        if (points > userPoints) {
            setUsePointsError('ポイントが不足しています');
            return;
        }

        setUsePointsLoading(true);
        try {
            const res = await fetch('/api/me/use-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ points }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'ポイントの使用に失敗しました');
            }

            setUserPoints(data.remainingPoints);
            setPointsToUse('');
            setUsePointsSuccess(`${data.usedPoints}ポイントを使用しました！`);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'ポイントの使用に失敗しました';
            setUsePointsError(message);
        } finally {
            setUsePointsLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(100vh - ${navHeight}px)`, overflow: "auto" }}>
                <Paper square elevation={2} sx={{ position: "sticky", top: 0, zIndex: 1000 }}>
                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        aria-label="user-tabs"
                        variant="fullWidth"
                        sx={{ minHeight: 40 }}
                    >
                        <Tab
                            label="自分の投稿"
                            id="user-tab-0"
                            icon={<ArticleIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ textTransform: "none", minHeight: 40, px: 1 }}
                        />
                        <Tab
                            label="参加した投稿"
                            id="user-tab-1"
                            icon={<GroupIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ textTransform: "none", minHeight: 40, px: 1 }}
                        />
                        <Tab
                            label="ポイント"
                            id="user-tab-2"
                            icon={<StarIcon fontSize="small" />}
                            iconPosition="start"
                            sx={{ textTransform: "none", minHeight: 40, px: 1 }}
                        />
                    </Tabs>
                </Paper>

                <Box sx={{ p: 2 }}>
                    {loading ? (
                        <Typography>読み込み中...</Typography>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : (
                        <>
                            <TabPanel value={tab} index={0}>
                                {myPosts.length === 0 ? (
                                    <Typography>投稿がありません</Typography>
                                ) : (
                                    <List>
                                        {myPosts.map((p) => (
                                            <ListItem key={p.id} divider disablePadding>
                                                <ListItemButton component={Link} href={`/events/${p.id}`} sx={{ px: 2 }}>
                                                    <ListItemText primary={p.title} secondary={new Date(p.createdAt).toLocaleString()} />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>

                            <TabPanel value={tab} index={1}>
                                {joinedPosts.length === 0 ? (
                                    <Typography>参加した投稿がありません</Typography>
                                ) : (
                                    <List>
                                        {joinedPosts.map((p) => (
                                            <ListItem key={p.id} divider disablePadding>
                                                <ListItemButton component={Link} href={`/events/${p.id}`} sx={{ px: 2 }}>
                                                    <ListItemText primary={p.title} secondary={new Date(p.createdAt).toLocaleString()} />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </TabPanel>

                            <TabPanel value={tab} index={2}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="h6" gutterBottom>
                                            現在のポイント
                                        </Typography>
                                        <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                                            {userPoints}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            ポイント
                                        </Typography>
                                    </Paper>

                                    <Paper elevation={1} sx={{ p: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            ポイントを使う
                                        </Typography>
                                        {usePointsError && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                {usePointsError}
                                            </Alert>
                                        )}
                                        {usePointsSuccess && (
                                            <Alert severity="success" sx={{ mb: 2 }}>
                                                {usePointsSuccess}
                                            </Alert>
                                        )}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                label="使用するポイント"
                                                type="number"
                                                value={pointsToUse}
                                                onChange={(e) => setPointsToUse(e.target.value)}
                                                fullWidth
                                                InputProps={{ inputProps: { min: 1, max: userPoints } }}
                                                disabled={usePointsLoading}
                                            />
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleUsePoints}
                                                disabled={usePointsLoading || !pointsToUse}
                                                fullWidth
                                                size="large"
                                            >
                                                {usePointsLoading ? '処理中...' : 'ポイントを使う'}
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Box>
                            </TabPanel>
                        </>
                    )}
                </Box>
            </Box>

            {/* Bottom navigation copied from Home for consistent UI */}
            <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
                <Paper elevation={8} sx={{ position: "relative", zIndex: 1200 }}>
                    <BottomNavigation showLabels value={navValue} onChange={(e, v) => setNavValue(v)} sx={{ height: navHeight }}>
                        <BottomNavigationAction component={Link} href="/" label="ホーム" icon={<HomeIcon />} />
                        <BottomNavigationAction component={Link} href="/search" label="検索" icon={<SearchIcon />} />
                        <BottomNavigationAction component={Link} href="/post" label="投稿" icon={<AddCircleOutlineIcon />} />
                        <BottomNavigationAction component={Link} href="/user" label="ユーザー" icon={<PersonIcon />} />
                        <BottomNavigationAction component={Link} href="/settings" label="設定" icon={<SettingsIcon />} />
                    </BottomNavigation>
                </Paper>
            </Box>
        </Box>
    );
}
