"use client";

import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArticleIcon from '@mui/icons-material/Article';
import GroupIcon from '@mui/icons-material/Group';
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
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

    useEffect(() => {
        // プレースホルダー: 実装時に API を呼び出してください
        setMyPosts([
            { id: "1", title: "自分の投稿サンプル 1", createdAt: new Date().toISOString() },
            { id: "2", title: "自分の投稿サンプル 2", createdAt: new Date().toISOString() },
        ]);
        setJoinedPosts([
            { id: "a", title: "参加した投稿サンプル A", createdAt: new Date().toISOString() },
        ]);
    }, []);

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
                    </Tabs>
                </Paper>

                <Box sx={{ p: 2 }}>
                    <TabPanel value={tab} index={0}>
                        {myPosts.length === 0 ? (
                            <Typography>投稿がありません</Typography>
                        ) : (
                            <List>
                                {myPosts.map((p) => (
                                    <ListItem key={p.id} divider>
                                        <ListItemText primary={p.title} secondary={new Date(p.createdAt).toLocaleString()} />
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
                                    <ListItem key={p.id} divider>
                                        <ListItemText primary={p.title} secondary={new Date(p.createdAt).toLocaleString()} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </TabPanel>
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
