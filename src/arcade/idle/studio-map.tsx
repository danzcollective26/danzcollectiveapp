import { IDLE_CONFIG } from "./idle-config.ts"
import type { DollLook } from "./doll-look.ts"
import { HAIRS, SHIRTS, SKINS } from "./doll-look.ts"
import type { StationProgress } from "./idle-engine.ts"
import { COCINA_PROPS, MUG_SETS } from "./cocina-look.ts"
import { SELLO_PROPS } from "./sello-look.ts"
import { SALA_PROPS } from "./sala-look.ts"
import { FASHION_PROPS } from "./fashion-look.ts"
import { MUSIC_PROPS } from "./music-look.ts"
import { PRINT_PROPS } from "./print-look.ts"
import { VIDEO_PROPS } from "./video-look.ts"
import { TEES } from "./tees.ts"
import {
  FURNITURE,
  ROOM_DOORS,
  ROOM_SIGNS,
  SEATS,
  SIDE_SEATS,
  SPAWN,
  VIEW_SCALE,
  WORLD_H,
  WORLD_W,
  anchorOf,
  canWalk,
  frontOf,
  roomPolys,
  type Loadout,
  type RoomId,
  type RoomStyle,
} from "./habbo-room.ts"

function depth(y: number, id = "") {
  return Math.round(y) + (/rug|floor/.test(id) ? -40 : 0)
}

export { SEATS, SPAWN, VIEW_SCALE, WORLD_H, WORLD_W, canWalk }

type Worker = { x: number; y: number; moving: boolean; face: number }

type StudioMapProps = {
  progress: Record<string, StationProgress | undefined>
  selectedId: string
  activeId: string | null
  percent: number
  worker: Worker
  working: boolean
  gain: string | null
  jobLabel: string | null
  bloomId: string | null
  busyIds: string[]
  look: DollLook
  loadout: Loadout
  mug: number
  rooms: Record<RoomId, RoomStyle>
  idea: string | null
  footX: number
  footY: number
  quip: { stationId: string; name: string; text: string } | null
  onStation: (id: string) => void
  sideIds: string[]
  mains: string[]
  smashed: string[]
  goods: string[]
}

const DESKS = [
  ["Luitzmi", "music", "2"],
  ["Roncero", "fashion", "1"],
  ["Cosa", "video", "0"],
  ["Mike", "print", "1"],
  ["León", "sello", "2"],
] as const

const SIDES = [
  ["Chicharro", "music", SIDE_SEATS.music.tx, SIDE_SEATS.music.ty, "2", 60],
  ["Juanfran", "fashion", SIDE_SEATS.fashion.tx, SIDE_SEATS.fashion.ty, "1", 60],
  ["Alpi", "video", SIDE_SEATS.video.tx, SIDE_SEATS.video.ty, "0", 60],
  ["Jokano", "print", SIDE_SEATS.print.tx, SIDE_SEATS.print.ty, "1", 60],
  ["Tomy", "sello", SIDE_SEATS.sello.tx, SIDE_SEATS.sello.ty, "0", 60],
] as const

const MUSIC_LIVE = ["lamp", "speaker-l", "speaker-r", "mixer", "mic", "beat", "spot", "master", "stand", "tapes", "strip", "crate", "doorlight", "drinks", "ready"]
const FASHION_LIVE = ["cut-table", "mannequin", "rolls", "sewer", "mirror", "moda-neon", "rack", "iron", "lamp-moda", "dtf", "film", "transfers", "scraps", "press-light", "tote", "threads", "fit-light", "ship-box", "tape", "mannequin-2", "curtain", "lookbook", "moda-ready"]
const VIDEO_LIVE = ["camera", "video-spot", "playback", "slate", "softbox", "bounce", "rec-light", "teleprompter", "monitor-2", "video-ready"]

export function StudioMap({
  progress,
  selectedId,
  activeId,
  percent,
  worker,
  working,
  gain,
  jobLabel,
  bloomId: _bloomId,
  busyIds,
  look,
  loadout,
  mug,
  rooms,
  idea,
  footX,
  footY,
  quip,
  onStation,
  sideIds,
  mains,
  smashed,
  goods,
}: StudioMapProps) {
  const open = (id: string) => Boolean(progress[id]?.unlocked)
  const levelOf = (id: string) => progress[id]?.level ?? 0
  const musicLevel = levelOf("music")
  const musicOn = activeId === "music"
  const fashionOn = activeId === "fashion"
  const videoOn = activeId === "video"
  const deskSrc = musicLevel >= 2 || loadout.desk === "desk-studio" ? "/idle/habbo/desk-pro.png" : "/idle/habbo/desk.png"
  const chairSrc = loadout.chair === "chair-club" ? "/idle/habbo/chair-club.png" : "/idle/habbo/chair.png"
  const plan = roomPolys(rooms)
  return (
    <div className={`studio-world is-pixel${activeId ? ` is-live is-${activeId}` : ""}`} style={{ width: WORLD_W, height: WORLD_H }}>
      <svg className="hb-rooms" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
        {plan.floors.map((poly) => (
          <polygon key={poly.id} points={poly.points} fill={poly.fill} />
        ))}
        {plan.walls.map((poly) => (
          <polygon key={poly.id} points={poly.points} fill={poly.fill} />
        ))}
        {plan.trim.map((poly) => (
          <polygon key={poly.id} points={poly.points} fill={poly.fill} />
        ))}
      </svg>
      <img
        className={`hb-sprite hb-desk${musicOn ? " is-on" : ""}${smashed.includes("music") ? " is-wreck" : ""}`}
        src={deskSrc}
        alt=""
        style={{ left: FURNITURE.desk.x, top: FURNITURE.desk.y + FURNITURE.desk.dy, zIndex: depth(FURNITURE.desk.y + FURNITURE.desk.dy) }}
      />
      {musicOn && (
        <img
          className={`hb-sprite hb-desk hb-glass${deskSrc.includes("desk-pro") ? " is-pro" : ""}`}
          src={deskSrc}
          alt=""
          style={{ left: FURNITURE.desk.x, top: FURNITURE.desk.y + FURNITURE.desk.dy, zIndex: depth(FURNITURE.desk.y + FURNITURE.desk.dy) + 2 }}
        />
      )}
      {MUSIC_PROPS.filter((prop) => musicLevel >= prop.level).map((prop) => {
        const spot = prop.anchor === "tile" && prop.tile ? frontOf(prop.tile[0], prop.tile[1]) : prop.anchor === "chair" ? FURNITURE.chair : FURNITURE.desk
        const lift = prop.anchor === "tile" ? 0 : prop.anchor === "chair" ? FURNITURE.chair.dy : FURNITURE.desk.dy
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${prop.glow ? " hb-neon" : ""}${prop.id === "onair" && musicOn ? " hb-onair" : ""}${musicOn && MUSIC_LIVE.includes(prop.id) ? " is-live" : ""}${smashed.includes("music") ? " is-wreck" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + lift + prop.dy, zIndex: depth(spot.y + lift + prop.dy, prop.id) }}
          />
        )
      })}
      {FASHION_PROPS.filter((prop) => levelOf("fashion") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${prop.id === "moda-neon" ? " hb-moda-neon" : ""}${fashionOn && FASHION_LIVE.includes(prop.id) ? " is-live" : ""}${smashed.includes("fashion") ? " is-wreck" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      {VIDEO_PROPS.filter((prop) => levelOf("video") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${prop.id === "video-neon" ? " hb-video-neon" : ""}${videoOn && VIDEO_LIVE.includes(prop.id) ? " is-live" : ""}${smashed.includes("video") ? " is-wreck" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      {PRINT_PROPS.filter((prop) => levelOf("print") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${smashed.includes("print") ? " is-wreck" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      {COCINA_PROPS.filter((prop) => levelOf("cocina") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        const src = prop.id === "kit-mugs" ? (MUG_SETS[mug] ?? MUG_SETS[0]) : prop.src
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${activeId === "cocina" && prop.id === "kit-micro" ? " is-live" : ""}`}
            src={src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      {SALA_PROPS.filter((prop) => levelOf("sala") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${activeId === "sala" && (prop.id === "sala-floor" || prop.id === "sala-console" || prop.id === "sala-ball") ? " is-live" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      {SELLO_PROPS.filter((prop) => levelOf("sello") >= prop.level).map((prop) => {
        const spot = frontOf(prop.tile[0], prop.tile[1])
        return (
          <img
            key={prop.id}
            className={`hb-sprite hb-prop hb-${prop.id}${activeId === "sello" ? " is-live" : ""}${smashed.includes("sello") ? " is-wreck" : ""}`}
            src={prop.src}
            alt=""
            style={{ left: spot.x + prop.dx, top: spot.y + prop.dy, zIndex: depth(spot.y + prop.dy, prop.id) }}
          />
        )
      })}
      <img
        className="hb-sprite hb-chair"
        src={chairSrc}
        alt=""
        style={{ left: FURNITURE.chair.x, top: FURNITURE.chair.y + FURNITURE.chair.dy, zIndex: depth(FURNITURE.chair.y + FURNITURE.chair.dy) }}
      />
      {(["fashion", "video", "print", "sello"] as const).map((id) => {
        if (!open(id)) return null
        const seat = SEATS[id]
        if (!seat) return null
        return (
          <img
            key={`seat-${id}`}
            className="hb-sprite hb-chair"
            src={chairSrc}
            alt=""
            style={{ left: seat.x, top: seat.y, zIndex: depth(seat.y) }}
          />
        )
      })}
      {SIDES.map(([name, id, tx, ty, , at]) => {
        if (levelOf(id) < at) return null
        const feet = frontOf(tx, ty)
        return (
          <img
            key={name}
            className="hb-sprite hb-chair"
            src={chairSrc}
            alt=""
            style={{ left: feet.x, top: feet.y + 6, zIndex: depth(feet.y + 6) }}
          />
        )
      })}
      {DESKS.map(([name, id, tee]) => {
        if (!mains.includes(id) || activeId === id) return null
        const seat = SEATS[id]
        if (!seat) return null
        const x = seat.drawX ?? seat.x
        const y = seat.drawY ?? seat.y - 34
        return (
          <div
            key={name}
            className="danz-idle-worker hb-avatar hb-mate"
            data-pose={seat.pose === "sit" ? "use" : seat.pose}
            data-tee={tee}
            data-moving="false"
            data-away="0"
            style={{
              left: x,
              top: y,
              zIndex: Math.round(y) + 36,
              ["--face" as string]: String(seat.face),
            }}
          >
            <em className="mate-tag">{name}</em>
          </div>
        )
      })}
      {SIDES.map(([name, id, tx, ty, tee]) => {
        if (!sideIds.includes(name)) return null
        const feet = frontOf(tx, ty)
        return (
          <div
            key={`${id}-${name}`}
            className="danz-idle-worker hb-avatar hb-mate"
            data-pose="use"
            data-tee={tee}
            data-moving="false"
            data-away="0"
            style={{
              left: feet.x + 2,
              top: feet.y - 6,
              zIndex: Math.round(feet.y - 34) + 36,
              ["--face" as string]: "-1",
            }}
          >
            <em className="mate-tag">{name}</em>
          </div>
        )
      })}
      <div className="danz-idle-worker hb-avatar hb-roamer" data-who="nico" data-pose="stand" data-tee="0" data-moving="true" data-step="0" data-away="0" style={{ display: "none" }}>
        <img data-who="mono-vest" className="hb-vest" alt="" />
        <img data-who="mono-tool" className="hb-tool" alt="" />
        <em className="mate-tag">Mono</em>
      </div>
      <div className="danz-idle-worker hb-avatar hb-roamer is-thief" data-who="thief" data-pose="stand" data-tee="1" data-moving="true" data-step="0" data-away="0" style={{ display: "none" }}>
        <em className="mate-tag">Rata</em>
      </div>
      <div className="danz-idle-worker hb-avatar hb-roamer" data-who="lux" data-pose="stand" data-tee="1" data-moving="false" data-step="0" data-away="0" style={{ display: "none" }}>
        <em className="mate-tag">Lux</em>
      </div>
      <span className="ship-spot" style={{ left: anchorOf("envios").x, top: anchorOf("envios").y }} />
      {goods.length > 0 && (
        <em className="shelf-pile" style={{ left: anchorOf("envios").x, top: anchorOf("envios").y }}>
          {goods.length}
          <small>{goods[goods.length - 1]}</small>
        </em>
      )}
      {smashed.map((id) => {
        const spot = anchorOf(id)
        return (
          <em key={`wreck-${id}`} className="wreck-sign" style={{ left: spot.x, top: spot.y }}>
            Roto
          </em>
        )
      })}
      {ROOM_DOORS.filter((door) => !open(door.id)).map((door) => {
        const point = frontOf(door.tx, door.ty)
        return <i key={`shut-${door.id}-${door.tx}`} className="door-shut" style={{ left: point.x, top: point.y }} />
      })}
      {ROOM_SIGNS.map((sign) => {
        const point = frontOf(sign.tx, sign.ty)
        return (
          <em key={sign.id} className="room-sign" style={{ left: point.x, top: point.y }}>
            {sign.name}
          </em>
        )
      })}
      {IDLE_CONFIG.stations.map((station) => {
        const unlocked = open(station.id)
        const level = levelOf(station.id)
        const active = activeId === station.id
        return (
          <button
            key={station.id}
            type="button"
            data-station={station.id}
            className={`studio-hit${unlocked ? "" : " is-locked"}${active || busyIds.includes(station.id) ? " is-working" : ""}${station.id === selectedId ? " is-on" : ""}${smashed.includes(station.id) ? " is-smashed" : ""}`}
            style={{ left: anchorOf(station.id).x, top: anchorOf(station.id).y + 28 }}
            aria-pressed={station.id === selectedId}
            onClick={() => onStation(station.id)}
          >
            <strong>{station.name}</strong>
            <em>{!unlocked ? "Cerrado" : smashed.includes(station.id) ? "Roto" : busyIds.includes(station.id) ? station.job.verb : `Nv ${level}`}</em>
            {active && (
              <span className="studio-meter">
                <i style={{ width: `${percent}%` }} />
              </span>
            )}
          </button>
        )
      })}
      <div
        className="danz-idle-worker hb-avatar"
        data-who="you"
        data-moving="false"
        data-pose="stand"
        data-tee={String(look.tee)}
        data-gender={look.gender === 1 ? "f" : "m"}
        data-hair={String(look.cut)}
        style={{
          ["--face" as string]: String(worker.face),
          ["--skin" as string]: SKINS[look.skin] ?? SKINS[1],
          ["--hair" as string]: HAIRS[look.hair] ?? HAIRS[0],
          ["--shirt" as string]: SHIRTS[look.shirt] ?? SHIRTS[0],
        }}
        aria-hidden="true"
      >
        <span className="px">
          <i className="hair" />
          <i className="head" />
          <i className="arm l" />
          <i className="arm r" />
          <i className="torso" />
          <i className="mark" style={{ backgroundImage: `url(${TEES[look.tee]?.mark ?? TEES[0].mark})` }} />
          <i className="leg l" />
          <i className="leg r" />
        </span>
      </div>
      {idea && !working && (
        <p className="thought" style={{ left: footX, top: footY - 132 }}>
          {idea}
        </p>
      )}
      {quip && (
        <p className="talk-bubble" style={{ left: footX, top: footY }}>
          <b>{quip.name}.</b> {quip.text}
        </p>
      )}
      {working && jobLabel && (
        <em className="work-bubble" style={{ left: worker.x, top: worker.y }}>
          {jobLabel}
        </em>
      )}
      {gain && (
        <em className="danz-idle-floater" style={{ left: worker.x, top: worker.y }}>
          {gain}
        </em>
      )}
    </div>
  )
}
