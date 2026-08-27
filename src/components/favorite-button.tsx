"use client";

import { Star } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { toggleFavorite, useFavoriteStatus, type FavoriteItem } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { motion } from "@/styles/constants.stylex";

type FavoriteButtonProps = {
  item: FavoriteItem;
  size?: "sm" | "md" | "lg";
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  button: {
    position: "relative",
    zIndex: 20,
    cursor: "pointer",
    transitionProperty: "color, background-color, border-color, box-shadow, transform, opacity",
    transitionDuration: motion.normal,
  },
  pending: { cursor: "not-allowed", opacity: 0.5 },
  buttonSm: { width: "1.75rem", height: "1.75rem" },
  buttonMd: { width: "2rem", height: "2rem" },
  buttonLg: { width: "2.25rem", height: "2.25rem" },
  icon: { transitionProperty: "fill, color, transform", transitionDuration: motion.normal },
  iconSm: { width: "0.875rem", height: "0.875rem" },
  iconMd: { width: "1rem", height: "1rem" },
  iconLg: { width: "1.25rem", height: "1.25rem" },
  saved: { fill: "currentColor" },
});

const buttonSizes = { sm: styles.buttonSm, md: styles.buttonMd, lg: styles.buttonLg };
const iconSizes = { sm: styles.iconSm, md: styles.iconMd, lg: styles.iconLg };

export function FavoriteButton({ item, xstyle, size = "md" }: FavoriteButtonProps) {
  const status = useFavoriteStatus(item.id);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(item);
  };

  if (status === "pending") {
    return (
      <Button
        variant="ghost"
        size="icon"
        xstyle={[styles.button, buttonSizes[size], styles.pending, xstyle]}
        disabled
      >
        <Star {...stylex.props(styles.icon, iconSizes[size])} />
      </Button>
    );
  }

  const favorited = status === "saved";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      xstyle={[styles.button, buttonSizes[size], xstyle]}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Star {...stylex.props(styles.icon, iconSizes[size], favorited && styles.saved)} />
    </Button>
  );
}
