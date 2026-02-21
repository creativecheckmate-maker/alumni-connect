import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 160 40"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <g fill="currentColor">
          <path d="M10,0 L0,0 L0,40 L10,40 L10,25 L20,40 L30,40 L20,20 L30,0 L20,0 L10,15 Z" />
          <path d="M40,0 L40,40 L50,40 L50,0 Z M60,0 L60,40 L70,40 L70,0 Z" />
          <circle cx="55" cy="20" r="5" />
        </g>
        <text
          x="75"
          y="29"
          fontFamily="'Space Grotesk', sans-serif"
          fontSize="30"
          fill="hsl(var(--foreground))"
          className="font-headline"
        >
          Nexus
        </text>
      </svg>
    </div>
  );
}
