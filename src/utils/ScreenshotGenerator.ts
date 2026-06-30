/**
 * Programmatic progress card image generator using HTML5 Canvas.
 * Generates a beautiful cosmic-themed sharing card containing player stats.
 */

import { UserStats } from "../types";
import { getRank } from "../components/StatsDashboard";

export function generateProgressCard(stats: UserStats): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas 2D context"));
        return;
      }

      // 1. Draw Background Gradient (Cosmic Slate Theme)
      const bgGrad = ctx.createRadialGradient(400, 240, 50, 400, 240, 500);
      bgGrad.addColorStop(0, "#1c1e4c"); // Deep midnight indigo
      bgGrad.addColorStop(1, "#060714"); // Dark void
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 480);

      // 2. Draw Decorative Tech Grid Lines & Crosshairs
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 40; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 40; y < 480; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Glow spots (radial lights)
      const glow1 = ctx.createRadialGradient(150, 240, 0, 150, 240, 200);
      glow1.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glow1.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 800, 480);

      const glow2 = ctx.createRadialGradient(650, 350, 0, 650, 350, 180);
      glow2.addColorStop(0, "rgba(168, 85, 247, 0.1)");
      glow2.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 800, 480);

      // Outer bounding double border
      ctx.strokeStyle = "rgba(99, 102, 241, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 760, 440);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 26, 748, 428);

      // Tech-borders corners accents
      ctx.fillStyle = "#6366f1";
      const cs = 12; // corner line length
      // TL
      ctx.fillRect(18, 18, cs, 4);
      ctx.fillRect(18, 18, 4, cs);
      // TR
      ctx.fillRect(782 - cs, 18, cs, 4);
      ctx.fillRect(778, 18, 4, cs);
      // BL
      ctx.fillRect(18, 458, cs, 4);
      ctx.fillRect(18, 462 - cs, 4, cs);
      // BR
      ctx.fillRect(782 - cs, 458, cs, 4);
      ctx.fillRect(778, 462 - cs, 4, cs);

      // 3. Header Text
      ctx.fillStyle = "rgba(165, 180, 252, 0.5)";
      ctx.font = "bold 11px monospace, sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("FOCUS SANCTUM // PERSISTENT STATE ARCHIVE", 45, 55);

      // Character Name
      const nickname = stats.nickname || "Focus Sanctum";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.letterSpacing = "0px";
      ctx.fillText(nickname, 45, 95);

      // Rank Display Badge
      const rankText = getRank(stats.level);
      ctx.font = "bold 11px monospace, sans-serif";
      const rankWidth = ctx.measureText(rankText).width;
      
      // Draw Rank Badge background
      ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
      ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(45, 112, rankWidth + 16, 22, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#818cf8";
      ctx.fillText(rankText, 53, 126);

      // 4. LEVEL ARC & GRAPHIC (Left side)
      const cx = 200;
      const cy = 280;
      const r = 70;

      // Draw outer circle track
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Draw XP progress arc
      const xpRatio = Math.min(stats.xp / stats.xpToNextLevel, 1);
      ctx.strokeStyle = "#6366f1"; // Indigo
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * xpRatio);
      ctx.stroke();

      // Inner Circle Glow
      const levelGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, r - 5);
      levelGlow.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      levelGlow.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = levelGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
      ctx.fill();

      // Level Title Text
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("LEVEL", cx, cy - 20);

      // Level Big Number
      ctx.fillStyle = "#fcd34d"; // Amber Gold
      ctx.font = "black 52px monospace, system-ui, sans-serif";
      ctx.fillText(stats.level.toString(), cx, cy + 18);

      // XP string below number
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "medium 11px monospace, sans-serif";
      ctx.fillText(`${stats.xp}/${stats.xpToNextLevel} XP`, cx, cy + 38);

      // 5. STATS GRID (Right side)
      ctx.textAlign = "left";
      const sx = 390;
      const sy = 160;
      const dy = 70;

      const statItems = [
        { label: "STREAK SCORE", value: `${stats.streak} Days`, desc: "Continuous daily mental logins" },
        { label: "FOCUS DURATION", value: `${stats.totalFocusMinutes} Minutes`, desc: "Total deep-focus work logged" },
        { label: "TASKS ACCOMPLISHED", value: `${stats.completedTasksCount} Completed`, desc: "Major items executed in full" },
        { label: "MICRO-STEPS CLIPPED", value: `${stats.completedSubstepsCount} Substeps`, desc: "Micro-commitments checked off" },
      ];

      statItems.forEach((item, idx) => {
        const itemY = sy + idx * dy;

        // Visual Bullet node
        ctx.fillStyle = "#818cf8";
        ctx.beginPath();
        ctx.arc(sx, itemY + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "bold 9px monospace, sans-serif";
        ctx.letterSpacing = "2px";
        ctx.fillText(item.label, sx + 18, itemY);

        // Value
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px system-ui, sans-serif";
        ctx.letterSpacing = "0px";
        ctx.fillText(item.value, sx + 18, itemY + 20);

        // Description text
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillText(item.desc, sx + 18, itemY + 34);

        // Grid separator line
        if (idx < statItems.length - 1) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx + 18, itemY + 44);
          ctx.lineTo(740, itemY + 44);
          ctx.stroke();
        }
      });

      // Footer watermarks
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "bold 9px monospace, sans-serif";
      ctx.letterSpacing = "1.5px";
      ctx.fillText("DIGITAL MIND HARMONIZATION // BUILD 1.0.0", 45, 435);

      ctx.textAlign = "right";
      ctx.fillText("PROVE YOUR FOCUS. STAY HYPERACTIVE.", 755, 435);

      // Return Data URL
      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}
