import { Box, Typography, Button } from "@mui/material";
import { MiniMap } from "./MiniMap";
import { useState } from "react";
import Link from "next/link";

export function EventCard({ id, title, distance, date, lat, lng, description }) {
  const [showDetail, setShowDetail] = useState(false);

  const jpDate = new Date(date).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 2,
        border: "1px solid #ddd",
        p: 2,
        mb: 2,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
        距離：{distance}km　｜　開催日：{jpDate}
      </Typography>

      <MiniMap lat={lat} lng={lng} />

      <Button
        variant="outlined"
        fullWidth
        component={Link}
        href={`/events/${id}`}
        sx={{ mt: 1, textDecoration: "none" }}
      >
        詳細を見る ▶
      </Button>
    </Box>
  );
}
