import { memo } from 'react'

function PlayerPlane() {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Plane body */}
        <ellipse cx="50" cy="50" rx="16" ry="36" fill="#4F46E5" />
        <ellipse cx="50" cy="50" rx="8" ry="30" fill="#818CF8" opacity="0.5" />

        {/* Cockpit */}
        <ellipse cx="50" cy="22" rx="9" ry="14" fill="#1E293B" />
        <ellipse cx="50" cy="24" rx="6" ry="10" fill="#60A5FA" opacity="0.6" />

        {/* Wings */}
        <polygon points="50,40 5,58 5,65 50,52" fill="#6366F1" />
        <polygon points="50,40 95,58 95,65 50,52" fill="#6366F1" />
        <polygon points="50,44 15,56 15,60 50,50" fill="#A5B4FC" opacity="0.4" />
        <polygon points="50,44 85,56 85,60 50,50" fill="#A5B4FC" opacity="0.4" />

        {/* Tail */}
        <polygon points="50,80 32,95 32,88 50,75" fill="#6366F1" />
        <polygon points="50,80 68,95 68,88 50,75" fill="#6366F1" />

        {/* Engine glow */}
        <ellipse cx="50" cy="88" rx="6" ry="4" fill="#FCD34D" />
        <ellipse cx="50" cy="86" rx="3" ry="2" fill="white" opacity="0.8" />
      </svg>
    </div>
  )
}

export default memo(PlayerPlane)
