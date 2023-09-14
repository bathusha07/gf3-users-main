import { Request } from 'express';

export * from './errors';

export type ControllerRequest = Request<Record<string, string>, unknown, Record<string, unknown>>;
