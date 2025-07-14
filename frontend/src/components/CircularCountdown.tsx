import React from "react";

interface Props {
  secondsLeft: number;
  totalSeconds?: number;
  onComplete?: () => void;
}

export default function CircularCountdown({ secondsLeft, totalSeconds = 3, onComplete }: Props) {
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  React.useEffect(() => {
    if (secondsLeft === 0 && onComplete) {
      onComplete();
    }
  }, [secondsLeft, onComplete]);

  return (
    <div style={{ width: 150, height: 150, position: "relative" }}>
      <svg width={150} height={150}>
        <circle
          stroke="#444"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={75}
          cy={75}
        />
        <circle
          stroke="#4ade80"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={75}
          cy={75}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 150,
          height: 150,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#fff",
        }}
      >
        {secondsLeft}
      </div>
    </div>
  );
}
