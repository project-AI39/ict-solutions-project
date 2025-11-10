"use client";

import * as React from "react";
import {
  AppBar, Toolbar, Typography, Container, Card, CardContent, TextField,
  Stack, Button, Snackbar, Alert, Divider, Box, List, ListItemText,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  ListItem, IconButton, InputAdornment,
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

type User = { email: string; name: string };

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "ユーザー名を入力してください。";
  if (trimmed.length < 3 || trimmed.length > 20) return "ユーザー名は3〜20文字で入力してください。";
  if (!/^[a-zA-Z0-9_ぁ-んァ-ヶｦ-ﾟ一-龥ー]+$/.test(trimmed)) {
    return "ユーザー名は英数・アンダースコア・日本語のみ使用できます。";
  }
  return null;
}

type PwErrors = { current?: string | null; next?: string | null; confirm?: string | null };
function validatePasswords(current: string, next: string, confirm: string): PwErrors {
  const errs: PwErrors = {};
  if (!current) errs.current = "現在のパスワードを入力してください。";
  if (!next) errs.next = "新しいパスワードを入力してください。";
  else if (next.length < 8) errs.next = "新しいパスワードは8文字以上で入力してください。";
  if (!confirm) errs.confirm = "確認用のパスワードを入力してください。";
  else if (next && confirm !== next) errs.confirm = "パスワードが一致しません。";
  return errs;
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = React.useState<User | null>(null);
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; type: "success" | "error" }>({ open: false, msg: "", type: "success" });
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // ダイアログ開閉
  const [nameDialogOpen, setNameDialogOpen] = React.useState(false);
  const [pwDialogOpen, setPwDialogOpen] = React.useState(false);

  // 名前
  const [nameInput, setNameInput] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);

  // パスワード
  const [pwCurrent, setPwCurrent] = React.useState("");
  const [pwNew, setPwNew] = React.useState("");
  const [pwConfirm, setPwConfirm] = React.useState("");
  const [pwErrCurrent, setPwErrCurrent] = React.useState<string | null>(null);
  const [pwErrNew, setPwErrNew] = React.useState<string | null>(null);
  const [pwErrConfirm, setPwErrConfirm] = React.useState<string | null>(null);
  const [showPw1, setShowPw1] = React.useState(false);
  const [showPw2, setShowPw2] = React.useState(false);

  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const openEmailDialog = () => {
    if (profile) setEmailInput(profile?.email ?? "");
    setEmailError(null);
    setEmailDialogOpen(true);
  };


  // 初期ユーザー取得
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (!res.ok) throw new Error("unauth");
        const { user } = await res.json();
        const u: User = { email: user.email, name: user.username };
        if (!cancelled) {
          setProfile(u);
          setNameInput(u.name);
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  // 編集開始時にサーバ値を反映
  const openNameDialog = () => {
    if (profile) setNameInput(profile.name);
    setNameError(null);
    setNameDialogOpen(true);
  };
  const openPwDialog = () => {
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwErrCurrent(null);
    setPwErrNew(null);
    setPwErrConfirm(null);
    setPwDialogOpen(true);
  };

  // 保存：名前
  async function saveName(e?: React.FormEvent) {
    e?.preventDefault();
    if (!profile) return;
    const err = validateName(nameInput);
    if (err) { setNameError(err); return; }

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: nameInput.trim() }),
      });
      if (!res.ok) throw new Error("update-failed");
      setProfile({ ...profile, name: nameInput.trim() });
      setToast({ open: true, msg: "ユーザー名を更新しました", type: "success" });
      setNameDialogOpen(false);
    } catch {
      setToast({ open: true, msg: "ユーザー名の更新に失敗しました", type: "error" });
    }
  }

  // ==== メール編集 ====

  async function saveEmail(e?: React.FormEvent) {
    e?.preventDefault();
    if (!profile) return;

    const trimmed = emailInput.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!trimmed || !isValid) {
      setEmailError("メールアドレスの形式が正しくありません。");
      return;
    }

    try {
      const res = await fetch("/api/users/change-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data?.message === "email-conflict") {
          setEmailError("このメールアドレスは既に使用されています。");
          return;
        }
        throw new Error("update-failed");
      }

      if (profile) {
        setProfile({ ...profile, email: trimmed.toLowerCase() });
      }
      setToast({ open: true, msg: "メールアドレスを更新しました", type: "success" });
      setEmailDialogOpen(false);
    } catch {
      setToast({ open: true, msg: "メールアドレスの更新に失敗しました", type: "error" });
    }
  }


  // 保存：パスワード
  async function savePassword(e?: React.FormEvent) {
    e?.preventDefault();
    const errs = validatePasswords(pwCurrent, pwNew, pwConfirm);
    setPwErrCurrent(errs.current ?? null);
    setPwErrNew(errs.next ?? null);
    setPwErrConfirm(errs.confirm ?? null);
    if (errs.current || errs.next || errs.confirm) return;

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew, confirmPassword: pwConfirm }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("change-password response:", res.status, data);

      if (!res.ok) {
        // ここは今まで通り
        const { message } = data;
        if (message?.includes("current password")) {
          setPwErrCurrent("現在のパスワードが正しくありません。");
          return;
        }
        throw new Error("change-failed");
      }

      setToast({ open: true, msg: "パスワードを更新しました", type: "success" });
      setPwDialogOpen(false);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch {
      setToast({ open: true, msg: "パスワード変更に失敗しました", type: "error" });
    }

  }

  // ログアウト & 削除
  const onLogout = async () => {
    try { await fetch("/api/logout", { method: "POST", credentials: "include" }); } catch { }
    router.replace("/login");
  };
  const onDelete = async () => {
    try {
      const res = await fetch("/api/users/me", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("delete-failed");
      setConfirmOpen(false);
      router.replace("/login");
    } catch {
      setToast({ open: true, msg: "削除に失敗しました", type: "error" });
    }
  };

  // ナビ
  const navHeight = 64;
  const routes = ["/", "/search", "/post", "/user", "/settings"];
  const indexByPath: Record<string, number> = { "/": 0, "/search": 1, "/post": 2, "/user": 3, "/settings": 4 };
  const currentIndex = indexByPath[pathname] ?? 0;
  const [navValue, setNavValue] = React.useState(currentIndex);
  React.useEffect(() => setNavValue(currentIndex), [currentIndex]);
  const handleNavChange = (_: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue);
    const to = routes[newValue];
    if (to && to !== pathname) router.push(to);
  };

  return (
    <Box sx={{ minHeight: "100dvh", position: "relative", bgcolor: "#f5f6fa", pb: `${navHeight + 8}px` }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon /><Typography variant="h6">設定</Typography>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" color="text.secondary">アカウント</Typography>

              <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
                {/* ユーザー名（表示） */}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" aria-label="edit-name" onClick={openNameDialog}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary="ユーザー名" secondary={profile?.name ?? "-"} />
                </ListItem>
                <Divider component="li" />

                {/* メールアドレス（表示） */}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" aria-label="edit-email" onClick={openEmailDialog}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary="メールアドレス" secondary={profile?.email ?? "-"} />
                </ListItem>
                <Divider component="li" />

                {/* パスワード（表示） */}
                <ListItem
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" aria-label="edit-password" onClick={openPwDialog}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary="パスワード" secondary="********" />
                </ListItem>
                <Divider component="li" />
              </List>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
                <Button onClick={onLogout} variant="outlined" startIcon={<LogoutIcon />} color="inherit" fullWidth sx={{ py: 1.1, minHeight: 48 }}>
                  ログアウト
                </Button>
                <Button onClick={() => setConfirmOpen(true)} variant="contained" color="error" startIcon={<DeleteForeverIcon />} fullWidth sx={{ py: 1.1, minHeight: 48 }}>
                  アカウントを削除
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* 名前編集ダイアログ */}
      <Dialog open={nameDialogOpen} onClose={() => setNameDialogOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={saveName}>
          <DialogTitle>ユーザー名を編集</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="新しいユーザー名"
              type="text"
              fullWidth
              autoComplete="username"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setNameError(null); }}
              error={!!nameError}
              helperText={nameError ?? "3〜20文字（英数・_・日本語可）"}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNameDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>保存</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* メール編集ダイアログ */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={saveEmail}>
          <DialogTitle>メールアドレスを編集</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="新しいメールアドレス"
              type="email"
              fullWidth
              autoComplete="email"
              value={emailInput ?? ""}
              onChange={(e) => { setEmailInput(e.target.value); setEmailError(null); }}
              error={!!emailError}
              helperText={emailError ?? ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>保存</Button>
          </DialogActions>
        </form>
      </Dialog>


      {/* パスワード編集ダイアログ */}
      <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={savePassword}>
          <DialogTitle>パスワードを変更</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField
                label="現在のパスワード"
                type={showPw1 ? "text" : "password"}
                autoComplete="current-password"
                fullWidth
                value={pwCurrent}
                onChange={(e) => { setPwCurrent(e.target.value); setPwErrCurrent(null); }}
                error={!!pwErrCurrent}
                helperText={pwErrCurrent ?? ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw1(s => !s)} size="small" aria-label="現在のパスワードの表示切替">
                        {showPw1 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
                onChange={(e) => { setPwNew(e.target.value); setPwErrNew(null); }}
                error={!!pwErrNew}
                helperText={pwErrNew ?? ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw2(s => !s)} size="small" aria-label="新しいパスワードの表示切替">
                        {showPw2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
                onChange={(e) => { setPwConfirm(e.target.value); setPwErrConfirm(null); }}
                error={!!pwErrConfirm}
                helperText={pwErrConfirm ?? ""}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPwDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>保存</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* アカウント削除確認 */}
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
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.type} sx={{ width: "100%" }}>
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* ボトムナビ */}
      <Box sx={{ position: "fixed", left: 0, right: 0, bottom: 0 }}>
        <Paper elevation={8} sx={{ position: "relative", zIndex: 1200 }}>
          <BottomNavigation value={navValue} onChange={handleNavChange} showLabels sx={{ height: navHeight }}>
            <BottomNavigationAction label="ホーム" icon={<HomeIcon />} />
            <BottomNavigationAction label="検索" icon={<SearchIcon />} />
            <BottomNavigationAction label="投稿" icon={<AddCircleOutlineIcon />} />
            <BottomNavigationAction label="ユーザー" icon={<PersonIcon />} />
            <BottomNavigationAction label="設定" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
