const request = require('supertest');
const app = require('../src/index');

// Mock dockerode to prevent actual container creation during unit tests
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createContainer: jest.fn().mockResolvedValue({
        id: 'mock-container-id-123',
        start: jest.fn().mockResolvedValue(true)
      }),
      getContainer: jest.fn().mockReturnValue({
        inspect: jest.fn().mockResolvedValue({
          Id: 'mock-container-id-123',
          State: { Status: 'running', StartedAt: '2026-01-01T00:00:00.000Z' }
        }),
        stop: jest.fn().mockResolvedValue(true),
        remove: jest.fn().mockResolvedValue(true)
      })
    };
  });
});

describe('Webix Session API', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4000, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /health should return status ok', async () => {
    const res = await request(server).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  let sessionId;

  it('POST /api/sessions should create a new session', async () => {
    const res = await request(server).post('/api/sessions');
    expect(res.statusCode).toEqual(201);
    expect(res.body.session).toHaveProperty('id');
    expect(res.body.session).toHaveProperty('port');
    expect(res.body.session).toHaveProperty('url');
    sessionId = res.body.session.id;
  });

  it('GET /api/sessions/:id should return status', async () => {
    const res = await request(server).get(`/api/sessions/${sessionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status.state).toEqual('running');
  });

  it('DELETE /api/sessions/:id should terminate session', async () => {
    const res = await request(server).delete(`/api/sessions/${sessionId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session terminated successfully');
  });
});
