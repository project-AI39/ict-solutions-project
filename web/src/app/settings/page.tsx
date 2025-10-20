"use client";

import * as React from "react";
import {
  AppBar, Toolbar, Typography, Container, Card, CardContent, TextField,
  Stack, Button, Snackbar, Alert, Divider, Box, List, ListItemText,
  ListItemButton, InputAdornment, Collapse, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";

import LogoutIcon from "@mui/icons-material/Logout";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonIcon from "@mui/icons-material/Person";

import { useRouter, usePathname } from "next/navigation";
import { z } from "zod";
import { profileUpdateSchema, passwordChangeSchema } from "@/lib/validators/user";

type User = { email: string; name: string };

// ---- ローカル保存用ユーティリティ ----
const PROFILE_KEY = "demoProfile";
const PW_HASH_KEY = "demoPwHash";

// SHA-256 ハッシュ（デモ用）
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  // 初期プロファイル
  const [profile, setProfile] = React.useState<User>({ email: "demo@example.com", name: "デモユーザー" });
  const [toast, setToast] = React.useState<{open:boolean; msg:string; type:"success"|"error"}>({ open:false, msg:"", type:"success" });
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  type Editing = "none" | "name" | "password";
  const [editing, setEditing] = React.useState<Editing>("none");

  // 起動時に localStorage から読み込み。無ければデフォルト＋初期パスワード hash を保存
  React.useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setProfile(JSON.parse(p));
      if (!localStorage.getItem(PW_HASH_KEY)) {
        sha256Hex("pass1234").then(h => localStorage.setItem(PW_HASH_KEY, h));
      }
    } catch {}
  }, []);

  // ---- 手動バリデーション用の state ----
  const nameOnlySchema = profileUpdateSchema.pick({ name: true });

  const [nameInput, setNameInput] = React.useState(profile.name);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const [pwCurrent, setPwCurrent] = React.useState("");
  const [pwNew, setPwNew] = React.useState("");
  const [pwConfirm, setPwConfirm] = React.useState("");
  const [pwErrCurrent, setPwErrCurrent] = React.useState<string | null>(null);
  const [pwErrNew, setPwErrNew] = React.useState<string | null>(null);
  const [pwErrConfirm, setPwErrConfirm] = React.useState<string | null>(null);

  // 編集開始時に現値をフォームへ反映
  React.useEffect(() => {
    if (editing === "name") {
      setNameInput(profile.name);
      setNameError(null);
    }
    if (editing === "password") {
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      setPwErrCurrent(null);
      setPwErrNew(null);
      setPwErrConfirm(null);
    }
  }, [editing, profile]);

  const [showPw1, setShowPw1] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);

  // ---- 保存（すべてローカル処理） ----
  function persistProfile(next: User) {
    setProfile(next);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
  }

  async function saveName(e?: React.FormEvent) {
    e?.preventDefault();
    setNameError(null);

    const parsed = nameOnlySchema.safeParse({ name: nameInput });
    if (!parsed.success) {
      // 最初のエラーメッセージを表示
      const msg = parsed.error.issues[0]?.message ?? "無効な入力です";
      setNameError(msg);
      return;
    }

    const next = { ...profile, name: parsed.data.name };
    persistProfile(next);
    setToast({ open:true, msg:"ユーザー名を更新しました", type:"success" });
    setEditing("none");
  }

  async function savePassword(e?: React.FormEvent) {
    e?.preventDefault();

    // 既存のフィールドエラーをクリア
    setPwErrCurrent(null);
    setPwErrNew(null);
    setPwErrConfirm(null);

    // Zod バリデーション（confirm の一致などはスキーマ側にある前提）
    const parsed = passwordChangeSchema.safeParse({
      changePassword: true,
      currentPassword: pwCurrent,
      newPassword: pwNew,
      confirm: pwConfirm,
    });

    if (!parsed.success) {
      // 各フィールドに対応付けて表示
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "currentPassword") setPwErrCurrent(issue.message);
        if (path === "newPassword") setPwErrNew(issue.message);
        if (path === "confirm") setPwErrConfirm(issue.message);
      }
      return;
    }

    // 現在パスワードの照合
    try {
      const currentHash = localStorage.getItem(PW_HASH_KEY) || "";
      const inputHash   = await sha256Hex(parsed.data.currentPassword);
      if (currentHash && inputHash !== currentHash) {
        setPwErrCurrent("現在のパスワードが正しくありません");
        return;
      }
      const newHash = await sha256Hex(parsed.data.newPassword);
      localStorage.setItem(PW_HASH_KEY, newHash);

      setToast({ open:true, msg:"パスワードを更新しました", type:"success" });
      setEditing("none");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch {
      setToast({ open:true, msg:"パスワード変更に失敗しました", type:"error" });
    }
  }

  // ログアウト/削除（ローカルのみ）
  const onLogout = async () => {
    router.replace("/login");
  };
  const onDelete = async () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(PW_HASH_KEY);
      setConfirmOpen(false);
      router.replace("/login");
    } catch {
      setToast({ open:true, msg:"削除に失敗しました", type:"error" });
    }
  };

  // ---- 行UI ----
  const Row = ({
    label, value, onEdit, isEditing, children,
  }: { label: string; value: React.ReactNode; onEdit: () => void; isEditing: boolean; children: React.ReactNode }) => (
    <>
      <ListItemButton onClick={onEdit} sx={{ alignItems: "flex-start" }}>
        <ListItemText primary={label} secondary={value} />
        <EditIcon fontSize="small" />
      </ListItemButton>
      <Collapse in={isEditing} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2, pb: 2 }}>{children}</Box>
      </Collapse>
      <Divider component="li" />
    </>
  );

  // ---- ボトムナビ ----
  const navHeight = 64;
  const routes = ["/", "/search", "/post", "/user", "/settings"];
  const indexByPath: Record<string, number> = { "/":0, "/search":1, "/post":2, "/user":3, "/settings":4 };
  const currentIndex = indexByPath[pathname] ?? 0;
  const [navValue, setNavValue] = React.useState(currentIndex);
  React.useEffect(() => setNavValue(currentIndex), [currentIndex]);
  const handleNavChange = (_: any, newValue: number) => {
    setNavValue(newValue);
    const to = routes[newValue];
    if (to && to !== pathname) router.push(to);
  };

  return (
    <Box sx={{ minHeight:"100dvh", position:"relative", bgcolor:"#f5f6fa", pb:`${navHeight + 8}px` }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom:1, borderColor:"divider" }}>
        <Toolbar>
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon /><Typography variant="h6">設定</Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs:2.5, sm:3 } }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.secondary">アカウント</Typography>

              <List sx={{ bgcolor:"background.paper", borderRadius:2 }}>
                {/* ▼ メールアドレス行は削除しました */}

                {/* ユーザー名 */}
                <Row
                  label="ユーザー名"
                  value={profile.name || "-"}
                  onEdit={() => setEditing(editing === "name" ? "none" : "name")}
                  isEditing={editing === "name"}
                >
                  <form onSubmit={saveName}>
                    <Stack spacing={1.5}>
                      <TextField
                        label="新しいユーザー名"
                        autoComplete="username"
                        fullWidth
                        value={nameInput}
                        onChange={(e) => { setNameInput(e.target.value); setNameError(null); }}
                        error={!!nameError}
                        helperText={nameError ?? "3〜20文字など、スキーマ条件に従って入力"}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon/>} sx={{ minHeight:44 }}>保存</Button>
                        <Button onClick={() => setEditing("none")} color="inherit" sx={{ minHeight:44 }}>キャンセル</Button>
                      </Stack>
                    </Stack>
                  </form>
                </Row>

                {/* パスワード */}
                <Row
                  label="パスワード"
                  value="********"
                  onEdit={() => setEditing(editing === "password" ? "none" : "password")}
                  isEditing={editing === "password"}
                >
                  <form onSubmit={savePassword}>
                    <Stack spacing={1.5}>
                      <TextField
                        label="現在のパスワード"
                        type={showPw1 ? "text" : "password"}
                        autoComplete="current-password"
                        fullWidth
                        value={pwCurrent}
                        onChange={(e)=>{ setPwCurrent(e.target.value); setPwErrCurrent(null); }}
                        error={!!pwErrCurrent}
                        helperText={pwErrCurrent ?? ""}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button onClick={()=>setShowPw1(s=>!s)} color="inherit" sx={{ minWidth:0, px:1 }}>
                                {showPw1 ? <VisibilityOff/> : <Visibility/>}
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="新しいパスワード（8文字以上）"
                        type={showPw2 ? "text" : "password"}
                        autoComplete="new-password"
                        fullWidth
                        value={pwNew}
                        onChange={(e)=>{ setPwNew(e.target.value); setPwErrNew(null); }}
                        error={!!pwErrNew}
                        helperText={pwErrNew ?? ""}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button onClick={()=>setShowPw2(s=>!s)} color="inherit" sx={{ minWidth:0, px:1 }}>
                                {showPw2 ? <VisibilityOff/> : <Visibility/>}
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="新しいパスワード（確認）"
                        type={showPw2 ? "text" : "password"}
                        autoComplete="new-password"
                        fullWidth
                        value={pwConfirm}
                        onChange={(e)=>{ setPwConfirm(e.target.value); setPwErrConfirm(null); }}
                        error={!!pwErrConfirm}
                        helperText={pwErrConfirm ?? ""}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon/>} sx={{ minHeight:44 }}>保存</Button>
                        <Button onClick={() => setEditing("none")} color="inherit" sx={{ minHeight:44 }}>キャンセル</Button>
                      </Stack>
                    </Stack>
                  </form>
                </Row>
              </List>

              <Divider sx={{ my: 1 }} />

              <Stack direction={{ xs:"column", sm:"row" }} spacing={1.5} sx={{ pb: 1 }}>
                <Button onClick={onLogout} variant="outlined" startIcon={<LogoutIcon/>} color="inherit" fullWidth sx={{ py:1.1, minHeight:48 }}>
                  ログアウト
                </Button>
                <Button onClick={() => setConfirmOpen(true)} variant="contained" color="error" startIcon={<DeleteForeverIcon/>} fullWidth sx={{ py:1.1, minHeight:48 }}>
                  アカウントを削除
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* 削除確認 */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>アカウント削除の確認</DialogTitle>
        <DialogContent>本当に削除しますか？この操作は元に戻せません。</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button onClick={onDelete} color="error" variant="contained">削除する</Button>
        </DialogActions>
      </Dialog>

      {/* トースト */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2400}
        onClose={() => setToast(t=>({ ...t, open:false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}
      >
        <Alert onClose={() => setToast(t=>({ ...t, open:false }))} severity={toast.type} sx={{ width:"100%" }}>
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* ボトムナビ */}
      <Box sx={{ position:"fixed", left:0, right:0, bottom:0 }}>
        <Paper elevation={8} sx={{ position:"relative", zIndex:1200 }}>
          <BottomNavigation value={navValue} onChange={handleNavChange} showLabels sx={{ height: navHeight }}>
            <BottomNavigationAction label="ホーム" icon={<HomeIcon/>} />
            <BottomNavigationAction label="検索" icon={<SearchIcon/>} />
            <BottomNavigationAction label="投稿" icon={<AddCircleOutlineIcon/>} />
            <BottomNavigationAction label="ユーザー" icon={<PersonIcon/>} />
            <BottomNavigationAction label="設定" icon={<SettingsIcon/>} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
