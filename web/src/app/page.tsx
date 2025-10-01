// MUI のアイコン表示テスト用ページ
"use client";

import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PersonIcon from "@mui/icons-material/Person";

export default function Home() {
  return (
    <main style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <HomeIcon style={{ fontSize: 48 }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Home</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <SearchIcon style={{ fontSize: 48 }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Search</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <SettingsIcon style={{ fontSize: 48 }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Settings</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <FavoriteIcon style={{ fontSize: 48, color: "#e53935" }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Favorite</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <PersonIcon style={{ fontSize: 48 }} />
          <div style={{ fontSize: 12, marginTop: 6 }}>Profile</div>
        </div>
      </div>
    </main>
  );
}
