"use client";

import React, { useState, useMemo } from "react";

// Official Google Fonts Noto Animated Emoji hex mapping
// Source: https://googlefonts.github.io/noto-emoji-animation/
export const NOTO_ANIMATED_MAP: Record<string, string> = {
  // Common Habit & Focus Emojis
  "📚": "1f4da", // Books / Reading
  "💪": "1f4aa", // Muscle / Workout
  "🔥": "1f525", // Fire / Streak
  "⚡": "26a1", // Lightning / Energy
  "💧": "1f4a7", // Water drop / Hydration
  "🎯": "1f3af", // Target / Goals
  "🏆": "1f3c6", // Trophy / Achievement
  "🥇": "1f947", // 1st Place Medal
  "✨": "2728", // Sparkles / Magic
  "🌟": "1f31f", // Glowing Star
  "⭐": "2b50", // Star
  "🎉": "1f389", // Party Popper
  "✅": "2705", // Check Mark
  "💡": "1f4a1", // Light bulb / Idea
  "⏰": "23f0", // Alarm Clock
  "☕": "2615", // Coffee / Tea
  "🍎": "1f34e", // Red Apple / Nutrition
  "🥗": "1f957", // Green Salad
  "🌱": "1f331", // Seedling / Growth
  "🌿": "1f33f", // Herb
  "🚀": "1f680", // Rocket / Launch
  "💎": "1f48e", // Gem / Diamond
  "👑": "1f451", // Crown
  "🧠": "1f9e0", // Brain / Learning
  "👀": "1f440", // Eyes / Focus
  "✍️": "270d_fe0f", // Writing Hand
  "🎵": "1f3b6", // Musical Notes
  "🎶": "1f3b6", // Musical Notes
  "☀️": "1f31e", // Sun with Face / Morning
  "🌙": "1f31b", // Moon / Evening / Sleep
  "👟": "1f45f", // Running Shoe / Steps
  "🏃": "1f45f", // Runner
  "🏃‍♂️": "1f45f", // Runner Male
  "🏃‍♀️": "1f45f", // Runner Female
  "🚫": "274c", // Cross Mark / No Bad Habits
  "❌": "274c", // Cross Mark
  "❤️": "2764_fe0f", // Red Heart / Health
  "🤔": "1f914", // Thinking Face
  "🥳": "1f973", // Partying Face
  "😎": "1f60e", // Sunglasses
  "🤓": "1f913", // Nerd
  "😇": "1f607", // Smiling Halo
  "⚔️": "1f525", // Swords / Halberd Action
  "🛡️": "2728", // Shield
};

interface AnimatedEmojiProps {
  emoji: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function getNotoAnimatedEmojiUrl(emoji: string): string | null {
  const hex = NOTO_ANIMATED_MAP[emoji];
  if (!hex) return null;
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${hex}/512.webp`;
}

// Global CSS keyframe fallbacks for custom animations
export const ANIMATED_EMOJI_STYLES = `
@keyframes halberd-float-levitate {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-4px) rotate(3deg); }
}

@keyframes halberd-pulse-flex {
  0%, 100% { transform: scale(1) rotate(0deg); }
  35% { transform: scale(1.18) rotate(-6deg); }
  70% { transform: scale(1.08) rotate(2deg); }
}

@keyframes halberd-sparkle-twinkle {
  0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 2px rgba(250, 204, 21, 0.5)); }
  50% { transform: scale(1.22) rotate(14deg); filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.9)); }
}
`;

export default function AnimatedEmoji({
  emoji,
  size = 24,
  className = "",
  style = {},
}: AnimatedEmojiProps) {
  const [imageError, setImageError] = useState(false);
  const animatedUrl = useMemo(() => getNotoAnimatedEmojiUrl(emoji), [emoji]);

  const dimension = typeof size === "number" ? `${size}px` : size;

  if (animatedUrl && !imageError) {
    return (
      <span
        className={`halberd-noto-animated-emoji ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: dimension,
          height: dimension,
          flexShrink: 0,
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "none",
          ...style,
        }}
      >
        <img
          src={animatedUrl}
          alt={emoji}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
          }}
        />
      </span>
    );
  }

  // Graceful CSS-animated fallback if animated WebP is not in map or fails to load
  return (
    <span
      className={`halberd-animated-emoji-fallback ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: dimension,
        lineHeight: 1,
        userSelect: "none",
        WebkitUserSelect: "none",
        pointerEvents: "none",
        animation: "halberd-float-levitate 2.5s ease-in-out infinite",
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
        ...style,
      }}
    >
      <style>{ANIMATED_EMOJI_STYLES}</style>
      {emoji}
    </span>
  );
}
