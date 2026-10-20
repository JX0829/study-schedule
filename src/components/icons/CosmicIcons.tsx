

interface IconProps {
  size?: number;
  className?: string;
  glowColor?: string;
}

export function IconAstronautHelmet({ size = 24, className = '', glowColor = '#00F0FF' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cosmic-helm-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F0FF" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#cosmic-helm-grad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10C7 8.34315 8.34315 7 10 7H14C15.6569 7 17 8.34315 17 10V12C17 14.2091 15.2091 16 13 16H11C8.79086 16 7 14.2091 7 12V10Z" fill="url(#cosmic-helm-grad)" fillOpacity="0.25" stroke="#00F0FF" strokeWidth="1.8" />
      <path d="M10 9.5H14" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1.2" fill={glowColor} />
      <path d="M5 19L3 21M19 19L21 21" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconEnergyCrystal({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crystal-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.6" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path d="M12 2L19 7L17 18L12 22L7 18L5 7L12 2Z" fill="url(#crystal-grad)" fillOpacity="0.25" stroke="url(#crystal-grad)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 2V22M5 7L12 11L19 7M7 18L12 11L17 18" stroke="#FDE047" strokeWidth="1.2" strokeOpacity="0.8" />
    </svg>
  );
}

export function IconChronoThruster({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="6" fill="#0EA5E9" fillOpacity="0.2" stroke="#00F0FF" strokeWidth="1.8" />
      <path d="M12 8V12L15 14" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconShieldLock({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L4 6V11.5C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11.5V6L12 3Z" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
      <rect x="9" y="11" width="6" height="5" rx="1.5" stroke="#FBBF24" strokeWidth="1.8" />
      <path d="M10 11V9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5V11" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconOrbitCheck({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#10B981" strokeWidth="2" strokeOpacity="0.6" />
      <path d="M4 12C4 7.58172 7.58172 4 12 4" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12L11 15L16 9" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStarMapCalendar({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="3" fill="#00F0FF" fillOpacity="0.15" stroke="#00F0FF" strokeWidth="2" />
      <path d="M3 10H21" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M8 2V6M16 2V6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1.2" fill="#F8FAFC" />
      <circle cx="12" cy="14" r="1.2" fill="#F8FAFC" />
      <circle cx="16" cy="14" r="1.2" fill="#F8FAFC" />
      <circle cx="8" cy="18" r="1.2" fill="#00F0FF" />
      <circle cx="12" cy="18" r="1.2" fill="#FBBF24" />
    </svg>
  );
}

export function IconPlanetBook({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" fill="#38BDF8" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="2" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" stroke="#00F0FF" strokeWidth="1.8" transform="rotate(-20 12 12)" />
      <path d="M10 10H14M10 13H13" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLaserTarget({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#2DD4BF" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="#14B8A6" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="#5EEAD4" />
      <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#5EEAD4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSatelliteOrbit({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill="#8B5CF6" fillOpacity="0.4" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="19" cy="6" r="2" fill="#C084FC" />
      <path d="M3 15C5 7 13 4 21 6" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M7 20C13 21 19 18 21 13" stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  );
}

export function IconCosmicCapsule({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="9" width="16" height="12" rx="2.5" fill="#A855F7" fillOpacity="0.2" stroke="#C084FC" strokeWidth="2" />
      <path d="M2 7H22V10H2V7Z" fill="#8B5CF6" fillOpacity="0.4" stroke="#A855F7" strokeWidth="1.8" />
      <path d="M12 7V21M8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconGalaxyWheel({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M12 3V9M12 15V21M3 12H9M15 12H21" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.6 5.6L9.8 9.8M14.2 14.2L18.4 18.4M5.6 18.4L9.8 14.2M14.2 9.8L18.4 5.6" stroke="#A855F7" strokeWidth="1.2" strokeOpacity="0.8" />
    </svg>
  );
}

export function IconCommandDeck({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#6366F1" fillOpacity="0.2" stroke="#818CF8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 6L7 9V15L12 18L17 15V9L12 6Z" stroke="#00F0FF" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="#FBBF24" />
    </svg>
  );
}

export function IconScannerEye({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12C4.5 7 8.5 4 12 4C15.5 4 19.5 7 22 12C19.5 17 15.5 20 12 20C8.5 20 4.5 17 2 12Z" stroke="#00F0FF" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#0EA5E9" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="#F8FAFC" />
    </svg>
  );
}

export function IconBlackHoleTrash({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20M9 6V4C9 3.44772 9.44772 3 10 3H14C14.5523 3 15 3.44772 15 4V6M5 6L6.5 19.5C6.6 20.3 7.3 21 8.2 21H15.8C16.7 21 17.4 20.3 17.5 19.5L19 6" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11V16M14 11V16" stroke="#FDA4AF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconLaserPen({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3L21 7L7 21H3V17L17 3Z" fill="#38BDF8" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 6L18 10M3 21L6 18" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconRocket({ size = 24, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8 4 6 8 6 12L4 16L7 17L8 19L12 18L16 19L17 17L20 16L18 12C18 8 16 4 12 2Z" fill="#0EA5E9" fillOpacity="0.25" stroke="#00F0FF" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M12 18V22M9 19L8 22M15 19L16 22" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
