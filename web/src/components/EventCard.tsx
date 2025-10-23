"use client";
import { Card, CardHeader, CardContent, CardMedia, Typography, Avatar } from "@mui/material";

export default function EventCard(props: {
  title: string;
  authorName: string;
  description?: string | null;
  imageUrl?: string | null;
}) {
  const { title, authorName, description, imageUrl } = props;
  return (
    <Card sx={{ mb: 2 }}>
      {imageUrl && <CardMedia component="img" height="180" image={imageUrl} alt={title} />}
      <CardHeader
        avatar={<Avatar>{(authorName || "U")[0]?.toUpperCase()}</Avatar>}
        title={title}
        subheader={`by ${authorName || "unknown"}`}
      />
      {description && (
        <CardContent>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </CardContent>
      )}
    </Card>
  );
}
