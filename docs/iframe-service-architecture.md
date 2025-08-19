# Angular Service Singleton Issue in Iframe Architecture

## Problem Statement

The `ContentService` marked with `providedIn: 'root'` creates separate instances when used in an iframe that loads Angular components, even though it's intended to be a singleton.

## Root Cause Analysis

When Angular loads a route in an iframe (like `/preview`), it creates a **separate Angular application instance** with its own injector hierarchy. Even though `ContentService` is marked with `providedIn: 'root'`, each application instance gets its own service instance because:

1. The main application bootstraps with its own injector
2. The iframe loads `/preview` route which creates a new browsing context
3. This new context bootstraps its own Angular application instance
4. Each injector tree maintains its own singleton instances

## Evidence

Console logs demonstrate two distinct service instances:
- **Main Application**: ContentService instance ID `7mynfkuim`
- **Iframe Application**: ContentService instance ID `rj5j3hpn8`

## Current Solution (Working as Intended)

The current implementation correctly handles this architecture limitation using **postMessage communication**:

1. **IframePreview Component** (main app):
   - Watches for ContentService changes via `effect()`
   - Sends updates to iframe via `postMessage`

2. **ContentDisplay Component** (iframe):
   - Listens for messages via `@HostListener('window:message')`
   - Updates its local ContentService instance with received data

This approach is **architecturally correct** and follows web standards for cross-frame communication.

## Why This Is The Right Approach

### Security & Isolation
- Iframes provide security isolation between contexts
- Direct service sharing across frames would violate browser security models
- PostMessage is the standard, secure way to communicate between frames

### Angular Architecture
- Each Angular application instance should have its own dependency injection context
- Sharing service instances across application boundaries would break Angular's design patterns
- The current approach maintains proper separation of concerns

### Maintainability
- Clear communication interface via postMessage
- Easy to test and debug
- Follows established patterns for micro-frontend architectures

## Conclusion

The "separate service instances" behavior is **expected and correct** for an iframe-based architecture. The current postMessage implementation is the proper solution and should be maintained rather than "fixed".

## Alternative Approaches (Not Recommended)

If truly needing a shared singleton, consider:
1. **Remove iframe**: Use dynamic component loading instead
2. **External state management**: Use localStorage/sessionStorage (limited and not reactive)
3. **WebWorker communication**: Overkill for this use case

However, the current approach is optimal for the given requirements.