"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, remember }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      if (remember) localStorage.setItem("token", data.token);
      else sessionStorage.setItem("token", data.token);

      router.push("/dashboard");
    } else {
      setError("ユーザー名またはパスワードが間違っています");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        p: 3,
        bgcolor: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "white",
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <img
            src="/login/icon.png"
            alt="アプリアイコン"
            style={{ width: 100, height: 100, borderRadius: "50%" }}
          />
        </Box>

        <Typography variant="h5" component="h2" mb={2} textAlign="center">
          ログイン
        </Typography>

        {error && (
          <Typography color="error" mb={2} textAlign="center">
            {error}
          </Typography>
        )}

        <TextField
          label="ユーザー名"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          fullWidth
          required
          margin="normal"
        />

        <TextField
          label="パスワード"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          fullWidth
          required
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ alignSelf: "flex-end", mb: 2 }}>
          <a href="/forgot-password" style={{ textDecoration: "underline", color: "#1976d2" }}>
            パスワードをお忘れですか？
          </a>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
          }
          label="ログイン状態を保存する"
          sx={{ mb: 1 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? "ログイン中..." : "ログイン"}
        </Button>

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <Typography>または</Typography>
          <a href="/user_registerUI" style={{ color: "#1976d2", textDecoration: "underline" }}>
            新規登録
          </a>
        </Box>
      </Box>
    </Box>
  );
}
