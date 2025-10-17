// src/components/EventCard.tsx
import { Box, Typography, Button } from "@mui/material";
import { MiniMap } from "./MiniMap";
import { useState } from "react";

export function EventCard({ title, distance, date, lat, lng, description }) {
  const [showDetail, setShowDetail] = useState(false);

  const jpDate = new Date(date).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Box sx={{ width: "100%", borderRadius: 2, border: "1px solid #ddd", p: 2, mb: 2, backgroundColor: "#fff" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
        距離：{distance}km　｜　開催日：{jpDate}
      </Typography>

      <MiniMap lat={lat} lng={lng} />

      <Button
        variant="outlined"
        fullWidth
        sx={{ mt: 1 }}
        onClick={() => setShowDetail(!showDetail)}
      >
        詳細を見る ▶
      </Button>

      {showDetail && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: "1px solid #aaa",
            borderRadius: 1,
            backgroundColor: "#f9f9f9",
            transition: "all 0.3s ease",
          }}
        >
          {description || "詳細情報がここに表示されます。"}
        </Box>
      )}
    </Box>
  );
}
