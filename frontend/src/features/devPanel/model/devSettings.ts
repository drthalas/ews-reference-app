import type { WorkItem } from '../../workItems/model/workItem';

export type DevSettings = {
  responseDelayMs: number;
  failNextRequest: boolean;
  failNextCommand: boolean;
  staleResponseMode: boolean;
  conflictMode: boolean;
  lastResetAt: string;
  lastDevAction: string;
};

export type UpdateDevSettingsRequest = Partial<{
  responseDelayMs: number;
  staleResponseMode: boolean;
  conflictMode: boolean;
}>;

export type DevActionResult = Partial<DevSettings> & Record<string, unknown>;

export type TriggerExternalChangeArgs = {
  id: string;
};

export type TriggerExternalChangeResult = WorkItem;
