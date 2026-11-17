// Official Nostelle Fragrances Version C (Flat Monochrome) Brand Lockup & N-in-bottle Mark

interface NostelleLogoProps {
  className?: string;
  showSubline?: boolean;
  variant?: 'full' | 'mark';
}

export function NostelleLogo({
  className = '',
  showSubline = true,
  variant = 'full',
}: NostelleLogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 44 54"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        {/* Tilted lifted cap */}
        <rect
          x="10"
          y="3"
          width="8.5"
          height="5.5"
          rx="1.2"
          transform="rotate(-34 10 3)"
          fill="currentColor"
        />
        {/* Atomizer nozzle */}
        <rect x="19" y="10" width="6" height="4.5" rx="0.8" fill="currentColor" />
        {/* Rounded-shoulder bottle framing N */}
        <path
          d="M17.5 15.5C11.5 15.5 7 20 7 26V44.5C7 47.8 9.7 50.5 13 50.5H27C30.3 50.5 33 47.8 33 44.5V26C33 20 28.5 15.5 22.5 15.5"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <text
          x="20"
          y="40.5"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="24"
          fontWeight="600"
          fill="currentColor"
        >
          N
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 360 116"
      fill="none"
      className={className}
      role="img"
      aria-label="Nostelle Fragrances by Peejay's Luxury"
    >
      {/* Lifted tilted cap */}
      <rect
        x="18"
        y="12"
        width="13"
        height="8.5"
        rx="1.5"
        transform="rotate(-36 18 12)"
        fill="currentColor"
      />
      {/* Atomizer neck */}
      <rect x="33.5" y="19" width="8.5" height="6.5" rx="1" fill="currentColor" />

      {/* Crisp Version C two-line spray mist sweeping across the wordmark */}
      <path
        d="M44 22.5C95 27 148 39 204 28C240 21 268 18 294 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M44 24.5C96 34 152 47 212 37C246 31 278 27 310 30"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.82"
      />

      {/* Rounded-shoulder bottle outline framing the N */}
      <path
        d="M32 26.5C22.5 26.5 16 32.5 16 42V76C16 81.5 20.5 86 26 86H39.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M43 26.5C51.5 26.5 57.5 32 57.5 41V82"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      {/* Wordmark: Nostelle */}
      <text
        x="37"
        y="74"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="43"
        fontWeight="600"
        fill="currentColor"
      >
        N
      </text>
      <text
        x="62"
        y="74"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="54"
        fontWeight="600"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        ostelle
      </text>

      {showSubline && (
        <>
          <text
            x="248"
            y="91"
            textAnchor="middle"
            fontFamily="'Poppins', sans-serif"
            fontSize="11.5"
            fontWeight="500"
            letterSpacing="4.2"
            fill="currentColor"
          >
            FRAGRANCES
          </text>
          <text
            x="248"
            y="104"
            textAnchor="middle"
            fontFamily="'Poppins', sans-serif"
            fontSize="7.2"
            fontWeight="500"
            letterSpacing="1.6"
            fill="currentColor"
            opacity="0.82"
          >
            BY PEEJAY&apos;S LUXURY
          </text>
        </>
      )}
    </svg>
  );
}
