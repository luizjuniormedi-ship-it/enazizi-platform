import { useLocation } from "react-router-dom";
import { useMissionMode } from "./useMissionMode";

/**
 * Returns true when mission is active and user is on the mission route.
 * Used to hide sidebar, nav, and bottom bar during focused mission execution.
 */
export function useMissionLock() {
  const location = useLocation();
  const { state } = useMissionMode();

  const isMissionRoute =
    location.pathname === "/dashboard/missao" ||
    location.pathname.startsWith("/dashboard/missao/") ||
    location.pathname === "/mission" ||
    location.pathname.startsWith("/study/");

  const isInMissionFlow =
    state.status === "active" || state.status === "paused";

  // Lock navigation when on mission route OR when a module was opened from mission
  const fromMission =
    new URLSearchParams(location.search).get("sc_origin") === "mission" ||
    new URLSearchParams(location.search).get("tutor_mode") === "mission";

  const locked = isInMissionFlow && (isMissionRoute || fromMission);

  return { locked, isMissionRoute, isInMissionFlow };
}
