export type EventListener = (...args: any[]) => void;

export interface FetchEvents {
  on(event: string, listener: EventListener): void;

  off(event: string, listener: EventListener): void;

  emit(event: string, ...args: any[]): void;
}
