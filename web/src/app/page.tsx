"use client";

import { useState } from "react";
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

  const navHeight = 64; // px
  const TokyoStation: [number, number] = [35.681236, 139.767125];

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Map area: leave space for bottom nav so it isn't covered */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(100vh - ${navHeight}px)` }}>
        <LeafletMap center={TokyoStation} zoom={15} />
      </Box>

      {/* Bottom navigation - fixed to bottom, mobile-first */}
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
            <BottomNavigationAction label="設定" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
