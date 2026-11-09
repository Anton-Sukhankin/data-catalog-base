import { http, HttpResponse } from 'msw';
import { DEMO_PATH, diagnosticFixture } from '../data/demoGateway';

export const demoHandlers = [
  http.get(`*${DEMO_PATH}`, () => HttpResponse.json(diagnosticFixture)),
];
