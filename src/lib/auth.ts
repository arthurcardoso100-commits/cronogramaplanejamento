import { supabase } from "@/integrations/supabase/client";

/** Keys holding app working data cached in the browser. */
const APP_LOCAL_KEYS = ["maintenanceAnalysisState"];

/** Per-user namespaced key so cached data is never shared between accounts. */
export const userScopedKey = (base: string, userId?: string | null) =>
  userId ? `${base}:${userId}` : base;

/** Removes every cached working state from the browser (used on logout). */
export const clearAppLocalState = () => {
  try {
    for (const key of Object.keys(localStorage)) {
      if (APP_LOCAL_KEYS.some((base) => key === base || key.startsWith(`${base}:`))) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  } catch {
    // ignore storage access errors
  }
};

export const signOut = async () => {
  clearAppLocalState();
  await supabase.auth.signOut();
};
