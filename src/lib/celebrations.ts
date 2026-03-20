import confetti from "canvas-confetti";

const defaults = {
  origin: { y: 0.7 },
  zIndex: 9999,
};

export const fireCelebration = (type: "goal" | "levelup" | "streak") => {
  switch (type) {
    case "goal":
      confetti({
        ...defaults,
        particleCount: 80,
        spread: 60,
        colors: ["hsl(142,76%,36%)", "hsl(48,96%,53%)", "hsl(221,83%,53%)"],
      });
      break;

    case "levelup":
      // Two bursts from sides
      confetti({
        ...defaults,
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["hsl(280,80%,60%)", "hsl(320,80%,60%)", "hsl(48,96%,53%)"],
      });
      confetti({
        ...defaults,
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["hsl(280,80%,60%)", "hsl(320,80%,60%)", "hsl(48,96%,53%)"],
      });
      break;

    case "streak":
      confetti({
        ...defaults,
        particleCount: 50,
        spread: 100,
        colors: ["hsl(25,95%,53%)", "hsl(48,96%,53%)", "hsl(0,84%,60%)"],
        shapes: ["circle"],
      });
      break;
  }
};
