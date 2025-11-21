/**
 * Electron API Type Definitions
 * Makes window.electron and window.monitoring available in TypeScript
 */

import { ElectronAPI } from '../preload';
import type { MonitoringAPI } from '../preload/monitoring';
import type { 
  WindowEventPayload,
  BrowserEventPayload,
  IdleEventPayload,
  FocusEventPayload,
  ProductivityEventPayload
} from '../shared/types/activity';

declare global {
  interface Window {
    electron: ElectronAPI;
    monitoring: MonitoringAPI;
    monitoringEvents: {
      waitForWindowEvent: () => Promise<WindowEventPayload>;
      waitForBrowserEvent: () => Promise<BrowserEventPayload>;
      waitForIdleEvent: () => Promise<IdleEventPayload>;
      waitForFocusEvent: () => Promise<FocusEventPayload>;
      waitForProductivityUpdate: () => Promise<ProductivityEventPayload>;
    };
  }
}

export {};

