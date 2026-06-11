import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export const FONT_SERIF = "/fonts/cinzel-700.ttf";
export const FONT_SANS = "/fonts/inter-400.ttf";
export const FONT_SANS_BOLD = "/fonts/inter-600.ttf";

export interface SkinProps {
  active: boolean;
  params: Record<string, unknown>;
}

/**
 * Eased 0→1 reveal progress, driven per-frame without re-rendering React.
 * Skins read `.value` inside their own useFrame callbacks.
 */
export function useReveal(active: boolean, speed = 1.6, idle = 0.35) {
  const progress = useRef(0);
  useFrame((_, delta) => {
    const target = active ? 1 : idle; // inactive content recedes toward `idle`
    const dir = Math.sign(target - progress.current);
    if (dir !== 0) {
      progress.current = THREEClamp(
        progress.current + dir * delta * speed,
        dir > 0 ? 0 : target,
        dir > 0 ? target : 1
      );
    }
  });
  return progress;
}

function THREEClamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

export function param<T>(
  params: Record<string, unknown>,
  key: string,
  fallback: T
): T {
  return (params[key] as T) ?? fallback;
}
