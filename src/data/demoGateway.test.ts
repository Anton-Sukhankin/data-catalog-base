import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { demoHandlers } from '../demo/handlers';
import { createHttpDiagnostics, DEMO_PATH, demoDiagnostics } from './demoGateway';

const server = setupServer(...demoHandlers);
const origin = 'http://prototype.test';
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('replaceable technical data source', () => {
  it('returns the same example from memory and mocked HTTP', async () => {
    expect(await createHttpDiagnostics(origin).read()).toEqual(await demoDiagnostics.read());
  });

  it('does not silently accept a failed request', async () => {
    server.use(http.get(`*${DEMO_PATH}`, () => new HttpResponse(null, { status: 503 })));
    await expect(createHttpDiagnostics(origin).read()).rejects.toThrow('недоступен');
  });

  it('rejects an incompatible response instead of rendering arbitrary fields', async () => {
    server.use(http.get(`*${DEMO_PATH}`, () => HttpResponse.json([{ unrelated: true }])));
    await expect(createHttpDiagnostics(origin).read()).rejects.toThrow('формат');
  });

  it('respects cancellation in the local source', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(demoDiagnostics.read(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
