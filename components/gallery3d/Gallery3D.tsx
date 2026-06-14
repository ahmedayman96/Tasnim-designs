"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Environment } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { artworks, type Artwork } from "@/lib/artworks";
import RoomPreview from "@/components/room-preview/RoomPreview";

/* ------------------------------------------------------------------ */
/* Room dimensions                                                     */
/* ------------------------------------------------------------------ */
const ROOM = { width: 13, depth: 26, height: 4.6 };
const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;
const EYE = 1.6; // camera / eye height
const ART_Y = EYE; // hang paintings centred at eye level

/* Movement bounds (keep the player off the walls) */
const BOUND_X = HALF_W - 1;
const BOUND_Z = HALF_D - 1;

/* ------------------------------------------------------------------ */
/* Layout: spread the artworks across the two long side walls          */
/* ------------------------------------------------------------------ */
interface Placed {
    art: Artwork;
    position: [number, number, number];
    rotationY: number;
}

function buildLayout(): Placed[] {
    const left = artworks.filter((_, i) => i % 2 === 0);
    const right = artworks.filter((_, i) => i % 2 === 1);

    const spaceZ = (count: number, i: number) => {
        if (count <= 1) return 0;
        const span = Math.min(ROOM.depth - 10, count * 7); // usable run along the wall
        return -span / 2 + span * (i / (count - 1));
    };

    const placed: Placed[] = [];
    left.forEach((art, i) =>
        placed.push({
            art,
            position: [-HALF_W + 0.15, 0, spaceZ(left.length, i)],
            rotationY: Math.PI / 2, // face +x (into room)
        }),
    );
    right.forEach((art, i) =>
        placed.push({
            art,
            position: [HALF_W - 0.15, 0, spaceZ(right.length, i)],
            rotationY: -Math.PI / 2, // face -x (into room)
        }),
    );
    return placed;
}

/* ------------------------------------------------------------------ */
/* Engraved plaque texture (title + price) drawn on a 2D canvas        */
/* ------------------------------------------------------------------ */
function makePlaque(art: Artwork): THREE.Texture {
    const w = 512;
    const h = 150;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#15140f";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c9a55a";
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "600 38px Georgia, 'Playfair Display', serif";
    ctx.fillText(art.title, w / 2, 56);

    ctx.fillStyle = "#c4bfb4";
    ctx.font = "300 22px Inter, system-ui, sans-serif";
    ctx.fillText(`${art.medium} · ${art.size}`, w / 2, 90);

    ctx.fillStyle = "#c9a55a";
    ctx.font = "600 30px Georgia, serif";
    ctx.fillText(`$${art.price.toLocaleString()}`, w / 2, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

/* ------------------------------------------------------------------ */
/* A single framed artwork with a spotlight and a plaque               */
/* ------------------------------------------------------------------ */
function ArtFrame({
    placed,
    onSelect,
    dragRef,
}: {
    placed: Placed;
    onSelect: (a: Artwork) => void;
    dragRef: React.MutableRefObject<{ dist: number }>;
}) {
    const { art, position, rotationY } = placed;
    const tex = useTexture(art.image);
    const [hovered, setHovered] = useState(false);

    // Preserve the artwork's real aspect ratio
    const img = tex.image as HTMLImageElement | undefined;
    const aspect = img && img.width && img.height ? img.width / img.height : 1;
    const H = 1.7;
    const W = Math.min(3.2, H * aspect);
    const plaqueY = ART_Y - H / 2 - 0.2; // sits just below the frame

    const plaque = useMemo(() => makePlaque(art), [art]);

    useEffect(() => {
        document.body.style.cursor = hovered ? "pointer" : "default";
        return () => {
            document.body.style.cursor = "default";
        };
    }, [hovered]);

    // direction the painting faces (room-ward), used to place its spotlight
    const facing = useMemo(
        () => new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY)),
        [rotationY],
    );
    const lightPos = useMemo(
        () =>
            new THREE.Vector3(position[0], 4.4, position[2]).add(
                facing.clone().multiplyScalar(2.2),
            ),
        [position, facing],
    );
    const target = useMemo(() => {
        const o = new THREE.Object3D();
        o.position.set(position[0], ART_Y, position[2]);
        return o;
    }, [position]);

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* outer wooden frame */}
            <mesh position={[0, ART_Y, 0.04]} castShadow>
                <boxGeometry args={[W + 0.22, H + 0.22, 0.08]} />
                <meshStandardMaterial color="#2a2114" metalness={0.2} roughness={0.6} />
            </mesh>
            {/* gilded inner lip */}
            <mesh position={[0, ART_Y, 0.08]}>
                <boxGeometry args={[W + 0.1, H + 0.1, 0.05]} />
                <meshStandardMaterial color="#c9a55a" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* the artwork */}
            <mesh
                position={[0, ART_Y, 0.12]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (dragRef.current.dist > 6) return; // was a look-drag, not a click
                    onSelect(art);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={() => setHovered(false)}
            >
                <planeGeometry args={[W, H]} />
                <meshStandardMaterial
                    map={tex}
                    roughness={0.85}
                    metalness={0}
                    emissive={hovered ? "#c9a55a" : "#000000"}
                    emissiveIntensity={hovered ? 0.12 : 0}
                />
            </mesh>
            {/* plaque */}
            <mesh position={[0, plaqueY, 0.08]}>
                <planeGeometry args={[1.2, 0.36]} />
                <meshBasicMaterial map={plaque} transparent />
            </mesh>

            {/* picture spotlight */}
            <primitive object={target} />
            <spotLight
                position={lightPos}
                target={target}
                angle={0.5}
                penumbra={0.7}
                intensity={26}
                distance={10}
                color="#fff4e0"
                castShadow
            />
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* The room shell                                                      */
/* ------------------------------------------------------------------ */
function Room() {
    const wall = "#26232a";
    return (
        <group>
            {/* floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[ROOM.width, ROOM.depth]} />
                <meshStandardMaterial color="#211c16" metalness={0.2} roughness={0.4} />
            </mesh>
            {/* ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, 0]}>
                <planeGeometry args={[ROOM.width, ROOM.depth]} />
                <meshStandardMaterial color="#141318" roughness={1} />
            </mesh>
            {/* left wall */}
            <mesh position={[-HALF_W, ROOM.height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[ROOM.depth, ROOM.height]} />
                <meshStandardMaterial color={wall} roughness={0.95} />
            </mesh>
            {/* right wall */}
            <mesh position={[HALF_W, ROOM.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[ROOM.depth, ROOM.height]} />
                <meshStandardMaterial color={wall} roughness={0.95} />
            </mesh>
            {/* far wall */}
            <mesh position={[0, ROOM.height / 2, -HALF_D]} receiveShadow>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial color={wall} roughness={0.95} />
            </mesh>
            {/* near wall (behind start) */}
            <mesh position={[0, ROOM.height / 2, HALF_D]} rotation={[0, Math.PI, 0]} receiveShadow>
                <planeGeometry args={[ROOM.width, ROOM.height]} />
                <meshStandardMaterial color={wall} roughness={0.95} />
            </mesh>

            {/* warm runner down the centre of the floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[3, ROOM.depth - 2]} />
                <meshStandardMaterial color="#3a2618" roughness={0.9} />
            </mesh>

            {/* soft ceiling lights down the hall, each with a visible glowing fixture */}
            {[-11, -4, 3, 10].map((z) => (
                <group key={z} position={[0, ROOM.height - 0.05, z]}>
                    <pointLight position={[0, -0.4, 0]} intensity={11} distance={16} color="#fff1d8" />
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[2.4, 0.5]} />
                        <meshBasicMaterial color="#ffe9c2" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/* ------------------------------------------------------------------ */
/* Device-orientation (gyroscope) → camera quaternion                  */
/* Based on the classic three.js DeviceOrientationControls math.       */
/* ------------------------------------------------------------------ */
interface OrientState {
    enabled: boolean;
    hasReading: boolean;
    alpha: number; // degrees
    beta: number;
    gamma: number;
    orient: number; // screen orientation, degrees
    offset: number; // alpha captured when enabled, so view starts down the hall
}

const _zee = new THREE.Vector3(0, 0, 1);
const _orientEuler = new THREE.Euler();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° around x
const DEG = Math.PI / 180;

function applyDeviceQuaternion(quaternion: THREE.Quaternion, o: OrientState) {
    const alpha = (o.alpha - o.offset) * DEG;
    const beta = o.beta * DEG;
    const gamma = o.gamma * DEG;
    const orient = o.orient * DEG;
    _orientEuler.set(beta, alpha, -gamma, "YXZ");
    quaternion.setFromEuler(_orientEuler);
    quaternion.multiply(_q1); // camera looks at the horizon when the phone is upright
    quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient)); // account for screen rotation
}

/* ------------------------------------------------------------------ */
/* First-person player: phone-tilt or drag to look, WASD / joystick    */
/* ------------------------------------------------------------------ */
function Player({
    moveRef,
    dragRef,
    orientRef,
}: {
    moveRef: React.MutableRefObject<{ x: number; y: number }>;
    dragRef: React.MutableRefObject<{ dist: number }>;
    orientRef: React.MutableRefObject<OrientState>;
}) {
    const { camera, gl } = useThree();
    const keys = useRef<Record<string, boolean>>({});
    const look = useRef({ yaw: 0, pitch: 0 });
    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    const fwd = useRef(new THREE.Vector3());
    const right = useRef(new THREE.Vector3());
    const dir = useRef(new THREE.Vector3());

    useEffect(() => {
        camera.rotation.order = "YXZ";
        camera.position.set(0, EYE, BOUND_Z - 1);
        const dom = gl.domElement;

        const kd = (e: KeyboardEvent) => {
            keys.current[e.code] = true;
        };
        const ku = (e: KeyboardEvent) => {
            keys.current[e.code] = false;
        };
        const pd = (e: PointerEvent) => {
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
            dragRef.current.dist = 0;
        };
        const pm = (e: PointerEvent) => {
            if (!dragging.current) return;
            const dx = e.clientX - last.current.x;
            const dy = e.clientY - last.current.y;
            last.current = { x: e.clientX, y: e.clientY };
            dragRef.current.dist += Math.abs(dx) + Math.abs(dy);
            const s = 0.0045;
            look.current.yaw -= dx * s;
            look.current.pitch -= dy * s;
            const lim = Math.PI / 2 - 0.15;
            look.current.pitch = Math.max(-lim, Math.min(lim, look.current.pitch));
        };
        const pu = () => {
            dragging.current = false;
        };

        window.addEventListener("keydown", kd);
        window.addEventListener("keyup", ku);
        dom.addEventListener("pointerdown", pd);
        window.addEventListener("pointermove", pm);
        window.addEventListener("pointerup", pu);
        return () => {
            window.removeEventListener("keydown", kd);
            window.removeEventListener("keyup", ku);
            dom.removeEventListener("pointerdown", pd);
            window.removeEventListener("pointermove", pm);
            window.removeEventListener("pointerup", pu);
        };
    }, [camera, gl, dragRef]);

    useFrame((_, delta) => {
        // apply look — phone gyroscope if enabled, otherwise drag/keyboard yaw+pitch
        const o = orientRef.current;
        if (o.enabled && o.hasReading) {
            applyDeviceQuaternion(camera.quaternion, o);
        } else {
            camera.rotation.set(look.current.pitch, look.current.yaw, 0);
        }
        camera.updateMatrixWorld();

        // forward / right along the floor plane
        camera.getWorldDirection(fwd.current);
        fwd.current.y = 0;
        fwd.current.normalize();
        right.current.crossVectors(fwd.current, camera.up).normalize();

        const k = keys.current;
        let mz = 0;
        let mx = 0;
        if (k["KeyW"] || k["ArrowUp"]) mz += 1;
        if (k["KeyS"] || k["ArrowDown"]) mz -= 1;
        if (k["KeyD"] || k["ArrowRight"]) mx += 1;
        if (k["KeyA"] || k["ArrowLeft"]) mx -= 1;
        mz += moveRef.current.y;
        mx += moveRef.current.x;

        const mag = Math.min(1, Math.hypot(mx, mz));
        if (mag > 0.001) {
            dir.current.set(0, 0, 0);
            dir.current.addScaledVector(fwd.current, mz);
            dir.current.addScaledVector(right.current, mx);
            dir.current.normalize();
            camera.position.addScaledVector(dir.current, 3.4 * delta * mag);
        }

        camera.position.x = Math.max(-BOUND_X, Math.min(BOUND_X, camera.position.x));
        camera.position.z = Math.max(-BOUND_Z, Math.min(BOUND_Z, camera.position.z));
        camera.position.y = EYE;
    });

    return null;
}

/* ------------------------------------------------------------------ */
/* On-screen joystick (touch devices)                                  */
/* ------------------------------------------------------------------ */
function Joystick({ moveRef }: { moveRef: React.MutableRefObject<{ x: number; y: number }> }) {
    const base = useRef<HTMLDivElement>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });

    const handle = (clientX: number, clientY: number) => {
        const el = base.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const max = r.width / 2;
        const d = Math.hypot(dx, dy);
        if (d > max) {
            dx = (dx / d) * max;
            dy = (dy / d) * max;
        }
        setKnob({ x: dx, y: dy });
        moveRef.current = { x: dx / max, y: -dy / max }; // up = forward
    };

    const reset = () => {
        setKnob({ x: 0, y: 0 });
        moveRef.current = { x: 0, y: 0 };
    };

    return (
        <div
            ref={base}
            onTouchStart={(e) => handle(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handle(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={reset}
            style={{
                position: "absolute",
                left: 28,
                bottom: 36,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(201,165,90,0.08)",
                border: "1px solid rgba(201,165,90,0.35)",
                touchAction: "none",
                pointerEvents: "auto",
                zIndex: 20,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 52,
                    height: 52,
                    marginLeft: -26,
                    marginTop: -26,
                    borderRadius: "50%",
                    background: "rgba(201,165,90,0.55)",
                    transform: `translate(${knob.x}px, ${knob.y}px)`,
                }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main exported component                                             */
/* ------------------------------------------------------------------ */
export default function Gallery3D() {
    const moveRef = useRef({ x: 0, y: 0 });
    const dragRef = useRef({ dist: 0 });
    const layout = useMemo(buildLayout, []);
    const [selected, setSelected] = useState<Artwork | null>(null);
    const [previewArt, setPreviewArt] = useState<Artwork | null>(null);
    const [isTouch, setIsTouch] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [motionOn, setMotionOn] = useState(false);
    const [motionError, setMotionError] = useState<string | null>(null);
    const orientRef = useRef<OrientState>({
        enabled: false,
        hasReading: false,
        alpha: 0,
        beta: 0,
        gamma: 0,
        orient: 0,
        offset: 0,
    });

    useEffect(() => {
        setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
        const t = setTimeout(() => setShowHint(false), 6000);
        return () => clearTimeout(t);
    }, []);

    const onOrient = useCallback((e: DeviceOrientationEvent) => {
        if (e.alpha == null) return;
        const o = orientRef.current;
        if (!o.hasReading) {
            o.offset = e.alpha; // first reading sets "forward" down the hall
            o.hasReading = true;
        }
        o.alpha = e.alpha;
        o.beta = e.beta ?? 0;
        o.gamma = e.gamma ?? 0;
        o.orient = window.screen?.orientation?.angle ?? 0;
    }, []);

    const enableMotion = useCallback(async () => {
        try {
            const DOE = window.DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<"granted" | "denied">;
            };
            if (DOE && typeof DOE.requestPermission === "function") {
                const res = await DOE.requestPermission();
                if (res !== "granted") {
                    setMotionError("Motion access was denied");
                    return;
                }
            }
            orientRef.current.hasReading = false; // recapture heading on each enable
            orientRef.current.enabled = true;
            window.addEventListener("deviceorientation", onOrient, true);
            setMotionOn(true);
            setMotionError(null);
        } catch {
            setMotionError("Motion controls aren't available on this device");
        }
    }, [onOrient]);

    const disableMotion = useCallback(() => {
        window.removeEventListener("deviceorientation", onOrient, true);
        orientRef.current.enabled = false;
        setMotionOn(false);
    }, [onOrient]);

    useEffect(
        () => () => window.removeEventListener("deviceorientation", onOrient, true),
        [onOrient],
    );

    return (
        <div className="relative h-[100svh] w-full overflow-hidden bg-midnight">
            <Canvas
                shadows
                camera={{ fov: 60, near: 0.1, far: 100, position: [0, EYE, BOUND_Z - 1] }}
                gl={{ antialias: true }}
            >
                <color attach="background" args={["#0a0a0c"]} />
                <fog attach="fog" args={["#0a0a0c", 20, 46]} />
                <ambientLight intensity={0.7} color="#fff2dc" />
                <hemisphereLight intensity={0.5} color="#fff2dc" groundColor="#1a140c" />
                <Suspense fallback={null}>
                    <Room />
                    {layout.map((p) => (
                        <ArtFrame key={p.art.slug} placed={p} onSelect={setSelected} dragRef={dragRef} />
                    ))}
                    <Environment preset="apartment" environmentIntensity={0.2} />
                </Suspense>
                <Player moveRef={moveRef} dragRef={dragRef} orientRef={orientRef} />
            </Canvas>

            {/* Title / hint overlay */}
            <div
                className="pointer-events-none absolute left-0 right-0 top-0 flex flex-col items-center px-6 pt-24 text-center"
                style={{ zIndex: 10 }}
            >
                <h1 className="font-serif text-2xl text-cream md:text-3xl">The Gallery</h1>
                <p className="mt-1 font-arabic text-gold/70" dir="rtl">
                    تسنيم اليماني
                </p>
                {showHint && (
                    <p className="mt-4 max-w-md rounded-full border border-gold/20 bg-midnight/70 px-5 py-2 text-xs uppercase tracking-[0.2em] text-cream-muted backdrop-blur">
                        {isTouch
                            ? "Enable motion & move your phone to look · joystick to walk"
                            : "Drag to look · W A S D to walk · click a piece"}
                    </p>
                )}
            </div>

            {/* Back to site link */}
            <Link
                href="/"
                className="absolute right-5 top-24 rounded-full border border-gold/20 bg-midnight/70 px-4 py-2 text-xs uppercase tracking-[0.18em] text-cream-muted backdrop-blur transition-colors hover:text-gold"
                style={{ zIndex: 20 }}
            >
                ← Exit
            </Link>

            {isTouch && <Joystick moveRef={moveRef} />}

            {/* Motion (gyroscope) toggle — touch devices only */}
            {isTouch && (
                <div className="absolute bottom-12 right-5 flex flex-col items-end gap-1" style={{ zIndex: 20 }}>
                    <button
                        onClick={motionOn ? disableMotion : enableMotion}
                        className={`rounded-full border px-4 py-2.5 text-xs uppercase tracking-[0.15em] backdrop-blur transition-colors ${
                            motionOn
                                ? "border-gold/60 bg-gold/15 text-gold"
                                : "border-gold/30 bg-midnight/70 text-cream-muted hover:text-gold"
                        }`}
                    >
                        {motionOn ? "Motion ✓" : "Enable motion view"}
                    </button>
                    {motionError && (
                        <span className="max-w-[12rem] text-right text-[10px] text-cream-muted/70">
                            {motionError}
                        </span>
                    )}
                </div>
            )}

            {/* Selected artwork detail card */}
            {selected && (
                <div
                    className="absolute bottom-6 left-1/2 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-gold/20 bg-charcoal/90 p-4 backdrop-blur-xl"
                    style={{ zIndex: 30 }}
                >
                    <button
                        onClick={() => setSelected(null)}
                        className="absolute right-3 top-3 text-cream-muted transition-colors hover:text-gold"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                    <div className="flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selected.image}
                            alt={selected.title}
                            className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                            <h3 className="font-serif text-lg text-cream">{selected.title}</h3>
                            <p className="font-arabic text-sm text-gold/70" dir="rtl">
                                {selected.titleAr}
                            </p>
                            <p className="mt-1 text-xs text-cream-muted">
                                {selected.medium} · {selected.size} · {selected.year}
                            </p>
                            <p className="mt-1 font-serif text-gold">${selected.price.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                        <Link
                            href={`/artwork/${selected.slug}`}
                            className="block w-full rounded-full bg-gold py-2.5 text-center text-sm font-medium uppercase tracking-[0.15em] text-midnight transition-colors hover:bg-gold-light"
                        >
                            View &amp; Purchase
                        </Link>
                        <button
                            onClick={() => setPreviewArt(selected)}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 py-2.5 text-sm font-medium uppercase tracking-[0.15em] text-gold transition-colors hover:bg-gold/10"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 15l5-5 4 4 3-3 6 6" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                            </svg>
                            See it in your room
                        </button>
                    </div>
                </div>
            )}

            {/* See-it-in-your-room modal */}
            {previewArt && (
                <div
                    className="absolute inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-midnight/85 p-4 backdrop-blur-md md:items-center"
                    onClick={() => setPreviewArt(null)}
                >
                    <div
                        className="relative my-8 w-full max-w-lg rounded-2xl border border-gold/15 bg-charcoal p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewArt(null)}
                            className="absolute right-4 top-4 text-cream-muted transition-colors hover:text-gold"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <p className="text-xs uppercase tracking-[0.3em] text-gold">See It In Your Space</p>
                        <h3 className="mt-2 font-serif text-2xl text-cream">{previewArt.title}</h3>
                        <p className="mb-5 mt-1 text-sm text-cream-muted">
                            Upload a photo of your room to preview it on your wall.
                        </p>
                        <RoomPreview artwork={previewArt} />
                    </div>
                </div>
            )}
        </div>
    );
}
