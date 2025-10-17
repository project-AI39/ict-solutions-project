"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

export default function Home() {
  const [value, setValue] = useState(0);
  const router = useRouter(); 

  const navHeight = 64; // px
  const Tokyo: [number, number] = [35.6895, 139.6917];

  const sampleMarkers: { id: string; position: [number, number]; title: string; popup: string }[] = [
    { id: "tokyo-station", position: Tokyo, title: "東京", popup: "東京 (サンプル)" },
    { id: "shinjuku", position: [35.693840, 139.703549], title: "新宿", popup: "新宿 (サンプル)" },
    { id: "shibuya", position: [35.659108, 139.703728], title: "渋谷", popup: "渋谷 (サンプル)" },
    { id: "ueno", position: [35.712678, 139.774474], title: "上野", popup: "上野 (サンプル)" },
    { id: "ikebukuro", position: [35.728926, 139.71038], title: "池袋", popup: "池袋 (サンプル)" },
    { id: "asakusa", position: [35.714765, 139.796655], title: "浅草", popup: "浅草 (サンプル)" },
    { id: "ginza", position: [35.671706, 139.764968], title: "銀座", popup: "銀座 (サンプル)" },
    { id: "roppongi", position: [35.660399, 139.729197], title: "六本木", popup: "六本木 (サンプル)" },
    { id: "odaiba", position: [35.627222, 139.775556], title: "お台場", popup: "お台場 (サンプル)" },
    { id: "tokyo-tower", position: [35.6585805, 139.7454329], title: "東京タワー", popup: "東京タワー (サンプル)" },
  ];

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Map area */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(100vh - ${navHeight}px)` }}>
        <LeafletMap center={Tokyo} zoom={13} markers={sampleMarkers} />
      </Box>

      {/* Bottom navigation */}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Paper elevation={8} sx={{ position: "relative", zIndex: 1200 }}>
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
            sx={{ height: navHeight }}
          >
            <BottomNavigationAction label="ホーム" icon={<HomeIcon />} />
            <BottomNavigationAction label="検索" icon={<SearchIcon />} />
            <BottomNavigationAction label="投稿" icon={<AddCircleOutlineIcon />} />
            <BottomNavigationAction label="ユーザー" icon={<PersonIcon />} />
            <BottomNavigationAction
              label="設定"
              icon={<SettingsIcon />}
              onClick={() => router.push("/settings")}
            />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
