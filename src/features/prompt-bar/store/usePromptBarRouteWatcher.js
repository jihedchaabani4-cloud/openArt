"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { registry as defaultRegistry } from "./registry.js";
import { isPathAllowed } from "./routePolicy.js";
import { removeSaved } from "./persistence.js";

/**
 * usePromptBarRouteWatcher
 *
 * Contract: Watches pathname navigation and resets any non-submitting Prompt Bar instance whose template persistRoutes disallow the current path.
 *
 * Evaluates route policy across all registered instances on navigation.
 * Instances whose templates declare persistRoutes are kept as long as the current
 * pathname matches allowed routes. If the user navigates away to a disallowed path,
 * non-submitting instances are reset and their persistence snapshots are deleted from storage.
 *
 * @param {object} [options]
 * @param {string} [options.pathname] - Optional pathname override (defaults to usePathname())
 * @param {object} [options.registry] - Optional registry override (defaults to global registry)
 * @param {Storage} [options.storage] - Optional storage override (defaults to instance storage)
 */
export function usePromptBarRouteWatcher(options = {}) {
  const routerPathname = usePathname();
  const pathname = options.pathname !== undefined ? options.pathname : routerPathname;
  const reg = options.registry || defaultRegistry;
  const customStorage = options.storage;

  // The watcher effect depends on pathname, registry, and storage only (PB-D-14)
  useEffect(() => {
    if (!pathname || typeof pathname !== "string") {
      return;
    }

    const instances = reg.list();

    for (const inst of instances) {
      const persistRoutes = inst.meta?.persistRoutes;
      // If template does not declare persistRoutes, state is allowed everywhere (unrestricted)
      if (!persistRoutes || !Array.isArray(persistRoutes) || persistRoutes.length === 0) {
        continue;
      }

      const allowed = isPathAllowed(pathname, persistRoutes);
      if (!allowed) {
        // Skip reset if an external generation or submit is currently in flight
        if (reg.isSubmitting(inst.identity)) {
          continue;
        }

        // Reset store state in registry
        reg.reset(inst.identity);

        // Purge saved storage entries
        const storageToUse = customStorage || inst.meta?.storage || (typeof window !== "undefined" ? window.sessionStorage : null);
        if (storageToUse) {
          if (inst.meta?.canonicalKey) {
            removeSaved(storageToUse, inst.meta.canonicalKey);
          }
          if (inst.key) {
            removeSaved(storageToUse, inst.key);
          }
          if (inst.meta?.legacyKey) {
            removeSaved(storageToUse, inst.meta.legacyKey);
          }
        }
      }
    }
  }, [pathname, reg, customStorage]);
}
