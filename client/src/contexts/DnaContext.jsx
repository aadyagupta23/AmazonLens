/**
 * DnaContext — Backward Compatibility Layer
 *
 * DNA has been merged into Amazon Sense.
 * This file re-exports SenseContext to avoid breaking existing imports.
 */

export { SenseProvider as DnaProvider, useSense as useDna } from "./SenseContext.jsx";
