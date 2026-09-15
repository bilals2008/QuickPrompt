/**
 * Windows 11 / Fluent style folder icons, drawn by hand.
 *
 * Structure mirrors the Fluent folder: a darker back flap, a seam line, then
 * the front pocket in full colour. The folder body uses `currentColor` so the
 * colour picker in Settings tints it; emblems live on a white badge with their
 * own accent colour, the way Windows 11 folder icons do.
 *
 * Keeps the same component contract as a Tabler icon (`size`, `style`,
 * `className`) so `FolderGlyph` and `resolveFolderIcon` work unchanged.
 */

const BACK =
  "M4 11C4 9.34 5.34 8 7 8H17.5L21.5 12H41C42.66 12 44 13.34 44 15V39C44 40.66 42.66 42 41 42H7C5.34 42 4 40.66 4 39V11Z"

const FRONT =
  "M4 16.5C4 14.84 5.34 13.5 7 13.5H41C42.66 13.5 44 14.84 44 16.5V39C44 40.66 42.66 42 41 42H7C5.34 42 4 40.66 4 39V16.5Z"

const SEAM = "M4 16H44V17H4V16Z"

// Front pocket tilted forward, for the open-folder variant.
const OPEN_FLAP =
  "M4 20.5H45.2L40.4 39.4A2.4 2.4 0 0 1 38.1 41H9.4A2.6 2.6 0 0 1 6.8 38.4Z"

const STROKE = {
  fill: "none",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
}

// Emblems are authored in a 12x12 space and translated onto the badge.
const EMBLEMS = {
  star: <path d="M6 1.6 7.35 4.42 10.45 4.7 8.1 6.86 8.72 9.9 6 8.42 3.28 9.9 3.9 6.86 1.55 4.7 4.65 4.42Z" fill="#f5b301" />,

  heart: (
    <path
      d="M6 10.3S1.7 7.4 1.7 4.75A2.55 2.55 0 0 1 6 3.1a2.55 2.55 0 0 1 4.3 1.65C10.3 7.4 6 10.3 6 10.3Z"
      fill="#ef4444"
    />
  ),

  lock: (
    <>
      <path d="M4.3 5.7V4.4a1.7 1.7 0 0 1 3.4 0v1.3" stroke="#e59b2e" {...STROKE} />
      <rect x="3" y="5.6" width="6" height="4.5" rx="1" fill="#e59b2e" />
    </>
  ),

  code: (
    <>
      <path d="M4.3 3.4 1.5 6l2.8 2.6" stroke="#3b82f6" {...STROKE} />
      <path d="M7.7 3.4 10.5 6l-2.8 2.6" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  music: (
    <>
      <path d="M4.6 9.2V3.3l4.2-.9v5.5" stroke="#ec4899" {...STROKE} />
      <circle cx="3.1" cy="9.2" r="1.5" fill="#ec4899" />
      <circle cx="7.3" cy="7.9" r="1.5" fill="#ec4899" />
    </>
  ),

  photo: (
    <>
      <rect x="1.5" y="2.7" width="9" height="6.6" rx="1.2" stroke="#14b8a6" {...STROKE} />
      <circle cx="4.1" cy="5" r="0.85" fill="#14b8a6" />
      <path d="M2.2 8.7 4.6 6.4l1.9 1.8 1.4-1.3 1.9 1.8" stroke="#14b8a6" {...STROKE} />
    </>
  ),

  cloud: (
    <path
      d="M3.6 9.2h5a2.2 2.2 0 0 0 .3-4.4 3 3 0 0 0-5.8.9A2 2 0 0 0 3.6 9.2Z"
      fill="#3b82f6"
    />
  ),

  download: (
    <>
      <path d="M6 2.2v5" stroke="#3b82f6" {...STROKE} />
      <path d="M4 5.2 6 7.2l2-2" stroke="#3b82f6" {...STROKE} />
      <path d="M2.6 9.7h6.8" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  check: <path d="M2.6 6.4 5 8.8 9.6 3.2" stroke="#22c55e" {...STROKE} />,

  clock: (
    <>
      <circle cx="6" cy="6" r="4.3" stroke="#3b82f6" {...STROKE} />
      <path d="M6 3.6V6l1.8 1.1" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  note: (
    <>
      <path d="M3 3.4h6" stroke="#3b82f6" {...STROKE} />
      <path d="M3 6h6" stroke="#3b82f6" {...STROKE} />
      <path d="M3 8.6h3.8" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  users: (
    <>
      <circle cx="6" cy="4.4" r="1.9" stroke="#0ea5e9" {...STROKE} />
      <path d="M2.7 9.8a3.3 3.3 0 0 1 6.6 0" stroke="#0ea5e9" {...STROKE} />
    </>
  ),

  dollar: (
    <>
      <path d="M6 2v8" stroke="#16a34a" {...STROKE} />
      <path
        d="M7.9 4.1c0-.8-.9-1.4-1.9-1.4s-1.9.5-1.9 1.4.9 1.2 1.9 1.5 1.9.6 1.9 1.5-.9 1.4-1.9 1.4-1.9-.6-1.9-1.4"
        stroke="#16a34a"
        {...STROKE}
      />
    </>
  ),

  briefcase: (
    <>
      <rect x="1.5" y="3.8" width="9" height="5.8" rx="1.1" stroke="#b45309" {...STROKE} />
      <path d="M4.4 3.8V3a1 1 0 0 1 1-1h1.2a1 1 0 0 1 1 1v.8" stroke="#b45309" {...STROKE} />
    </>
  ),

  book: (
    <>
      <path
        d="M6 3.6C5.2 2.9 4.1 2.6 2.3 2.6v5.8c1.8 0 2.9.3 3.7 1 .8-.7 1.9-1 3.7-1V2.6c-1.8 0-2.9.3-3.7 1Z"
        stroke="#b45309"
        {...STROKE}
      />
      <path d="M6 3.6v5.8" stroke="#b45309" {...STROKE} />
    </>
  ),

  flag: (
    <>
      <path d="M3.6 10V2.2" stroke="#ef4444" {...STROKE} />
      <path d="M3.6 2.8h5.1L7.6 4.6l1.1 1.8H3.6" stroke="#ef4444" {...STROKE} />
    </>
  ),

  plus: (
    <>
      <path d="M6 2.4v7.2" stroke="#22c55e" {...STROKE} />
      <path d="M2.4 6h7.2" stroke="#22c55e" {...STROKE} />
    </>
  ),

  cross: (
    <>
      <path d="M3 3 9 9" stroke="#ef4444" {...STROKE} />
      <path d="M9 3 3 9" stroke="#ef4444" {...STROKE} />
    </>
  ),

  search: (
    <>
      <circle cx="5.2" cy="5.2" r="3.2" stroke="#3b82f6" {...STROKE} />
      <path d="M7.6 7.6 10 10" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  sync: (
    <>
      <path d="M9.5 6a3.5 3.5 0 1 1-1-2.5" stroke="#14b8a6" {...STROKE} />
      <path d="M9.6 2.2v2.6H7" stroke="#14b8a6" {...STROKE} />
    </>
  ),

  camera: (
    <>
      <rect x="1.5" y="3.5" width="9" height="6" rx="1.2" stroke="#8b5cf6" {...STROKE} />
      <circle cx="6" cy="6.5" r="1.8" stroke="#8b5cf6" {...STROKE} />
      <path d="M3.8 3.5l.7-1.3h3l.7 1.3" stroke="#8b5cf6" {...STROKE} />
    </>
  ),

  globe: (
    <>
      <circle cx="6" cy="6" r="4.2" stroke="#06b6d4" {...STROKE} />
      <ellipse cx="6" cy="6" rx="2" ry="4.2" stroke="#06b6d4" {...STROKE} />
      <path d="M1.8 6h8.4" stroke="#06b6d4" {...STROKE} />
    </>
  ),

  pin: (
    <>
      <path d="M6 1.8v5.5" stroke="#f43f5e" {...STROKE} />
      <circle cx="6" cy="9.5" r="1.2" fill="#f43f5e" />
      <path d="M4 5.5h4" stroke="#f43f5e" {...STROKE} />
    </>
  ),

  fire: (
    <>
      <path d="M6 1.5c0 2.5-2.5 3.5-2.5 5.5a3 3 0 0 0 5 0c0-2-2.5-3-2.5-5.5Z" stroke="#f97316" {...STROKE} />
      <path d="M6 5.5c0 1.2-1 1.8-1 2.6a1.2 1.2 0 0 0 2 0c0-.8-1-1.4-1-2.6Z" fill="#f97316" />
    </>
  ),

  paint: (
    <>
      <circle cx="6" cy="7" r="3.5" stroke="#a855f7" {...STROKE} />
      <path d="M6 3.5V1.8" stroke="#a855f7" {...STROKE} />
      <path d="M8.5 4.5l1-1" stroke="#a855f7" {...STROKE} />
      <path d="M3.5 4.5l-1-1" stroke="#a855f7" {...STROKE} />
    </>
  ),

  prompt: (
    <>
      <path d="M2 3h8a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1H5l-2.5 2V9H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="#6366f1" {...STROKE} />
      <path d="M3.5 5.5h5" stroke="#6366f1" {...STROKE} />
      <path d="M3.5 7.5h3" stroke="#6366f1" {...STROKE} />
    </>
  ),

  apikey: (
    <>
      <circle cx="4.5" cy="6" r="2.5" stroke="#eab308" {...STROKE} />
      <path d="M7 6h3.5" stroke="#eab308" {...STROKE} />
      <path d="M9 4.5v3" stroke="#eab308" {...STROKE} />
    </>
  ),

  token: (
    <>
      <path d="M6 1.5l4 2.2v4.4L6 10.3 2 8.1V3.7Z" stroke="#14b8a6" {...STROKE} />
      <path d="M4.2 6l1.2 1.2 2.4-2.4" stroke="#14b8a6" {...STROKE} />
    </>
  ),

  card: (
    <>
      <rect x="1" y="2.5" width="10" height="7.5" rx="1.2" stroke="#3b82f6" {...STROKE} />
      <path d="M1 5h10" stroke="#3b82f6" {...STROKE} />
      <path d="M2.5 7.5h3" stroke="#3b82f6" {...STROKE} />
    </>
  ),

  tag: (
    <>
      <path d="M1.5 6V2.5a1 1 0 0 1 1-1H6l4.5 4.5-4.5 4.5Z" stroke="#f43f5e" {...STROKE} />
      <circle cx="4" cy="4" r="0.8" fill="#f43f5e" />
    </>
  ),

  model: (
    <>
      <circle cx="6" cy="5" r="3.5" stroke="#8b5cf6" {...STROKE} />
      <path d="M3 8.5c0 1.7 1.3 3 3 3s3-1.3 3-3" stroke="#8b5cf6" {...STROKE} />
      <circle cx="6" cy="5" r="1.2" fill="#8b5cf6" />
    </>
  ),

  attachment: (
    <>
      <path d="M7.5 5.5v4a2 2 0 0 1-4 0v-4a1.5 1.5 0 0 1 3 0v3.5" stroke="#0ea5e9" {...STROKE} />
      <path d="M7.5 3v7.5a2.5 2.5 0 0 1-5 0V5" stroke="#0ea5e9" {...STROKE} />
    </>
  ),
}

function FolderSvg({ size = 16, style, className, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Back flap darkened with an overlay so `currentColor` stays tintable. */
function FolderShape() {
  return (
    <>
      <path d={BACK} fill="currentColor" />
      <path d={BACK} fill="#000000" fillOpacity="0.22" />
      <path d={SEAM} fill="#000000" fillOpacity="0.15" />
      <path d={FRONT} fill="currentColor" />
    </>
  )
}

function Badge({ children }) {
  return (
    <g transform="translate(18 22)">
      <circle cx="6" cy="6.6" r="8" fill="#000000" fillOpacity="0.16" />
      <circle cx="6" cy="6" r="8" fill="#ffffff" />
      {children}
    </g>
  )
}

function makeFolderIcon(emblem) {
  function EmblemedFolderIcon({ size = 16, style, className }) {
    return (
      <FolderSvg size={size} style={style} className={className}>
        <FolderShape />
        {emblem && <Badge>{emblem}</Badge>}
      </FolderSvg>
    )
  }
  return EmblemedFolderIcon
}

/** Plain closed folder — the Explorer default. */
export const FolderPlainIcon = makeFolderIcon(null)

/** Two folders stacked, for collections that hold subfolders. */
export function FolderStackIcon({ size = 16, style, className }) {
  return (
    <FolderSvg size={size} style={style} className={className}>
      <g transform="translate(-2.5 -2.5)" opacity="0.45">
        <FolderShape />
      </g>
      <FolderShape />
    </FolderSvg>
  )
}

/** Open folder with the front pocket tilted forward. */
export function FolderOpenIcon({ size = 16, style, className }) {
  return (
    <FolderSvg size={size} style={style} className={className}>
      <path d={BACK} fill="currentColor" />
      <path d={BACK} fill="#000000" fillOpacity="0.22" />
      <path d={OPEN_FLAP} fill="currentColor" />
    </FolderSvg>
  )
}

export const FolderPlusIcon = makeFolderIcon(EMBLEMS.plus)
export const FolderCrossIcon = makeFolderIcon(EMBLEMS.cross)
export const FolderSearchIcon = makeFolderIcon(EMBLEMS.search)
export const FolderSyncIcon = makeFolderIcon(EMBLEMS.sync)
export const FolderStarIcon = makeFolderIcon(EMBLEMS.star)
export const FolderHeartIcon = makeFolderIcon(EMBLEMS.heart)
export const FolderLockIcon = makeFolderIcon(EMBLEMS.lock)
export const FolderCodeIcon = makeFolderIcon(EMBLEMS.code)
export const FolderBookIcon = makeFolderIcon(EMBLEMS.book)
export const FolderNoteIcon = makeFolderIcon(EMBLEMS.note)
export const FolderBriefcaseIcon = makeFolderIcon(EMBLEMS.briefcase)
export const FolderUsersIcon = makeFolderIcon(EMBLEMS.users)
export const FolderMusicIcon = makeFolderIcon(EMBLEMS.music)
export const FolderPhotoIcon = makeFolderIcon(EMBLEMS.photo)
export const FolderCloudIcon = makeFolderIcon(EMBLEMS.cloud)
export const FolderDownloadIcon = makeFolderIcon(EMBLEMS.download)
export const FolderDollarIcon = makeFolderIcon(EMBLEMS.dollar)
export const FolderClockIcon = makeFolderIcon(EMBLEMS.clock)
export const FolderCheckIcon = makeFolderIcon(EMBLEMS.check)
export const FolderFlagIcon = makeFolderIcon(EMBLEMS.flag)
export const FolderCameraIcon = makeFolderIcon(EMBLEMS.camera)
export const FolderGlobeIcon = makeFolderIcon(EMBLEMS.globe)
export const FolderPinIcon = makeFolderIcon(EMBLEMS.pin)
export const FolderFireIcon = makeFolderIcon(EMBLEMS.fire)
export const FolderPaintIcon = makeFolderIcon(EMBLEMS.paint)
export const FolderPromptIcon = makeFolderIcon(EMBLEMS.prompt)
export const FolderApikeyIcon = makeFolderIcon(EMBLEMS.apikey)
export const FolderTokenIcon = makeFolderIcon(EMBLEMS.token)
export const FolderCardIcon = makeFolderIcon(EMBLEMS.card)
export const FolderTagIcon = makeFolderIcon(EMBLEMS.tag)
export const FolderModelIcon = makeFolderIcon(EMBLEMS.model)
export const FolderAttachmentIcon = makeFolderIcon(EMBLEMS.attachment)
