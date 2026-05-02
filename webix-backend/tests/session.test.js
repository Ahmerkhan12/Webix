const request = require('supertest');
const express = require('express');

// Mock dockerode to prevent actual container creation
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

// Mock Supabase Database
const mockSupabase = {
  from: jest.fn()
};
jest.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
  req.user = { id: 'mock-user-123' };
  next();
});

// Mock Docker Service logic
jest.mock('../src/services/dockerService', () => ({
  createContainer: jest.fn().mockResolvedValue({
    id: 'mock-container-123',
    port: 6080,
    url: 'http://localhost:6080/vnc.html',
    volumeName: 'webix-home-mock-user-123'
  }),
  stopContainer: jest.fn().mockResolvedValue(true),
  getContainerStatus: jest.fn().mockResolvedValue({ state: 'running' })
}));

const dockerService = require('../src/services/dockerService');

// Must require app AFTER mocks
const app = require('../src/index');

describe('Webix Session API Integration Tests', () => {
  let server;

  beforeAll((done) => {
    process.env.PORT = 4001; // Avoid conflict with actual dev server
    server = app.listen(4001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/sessions should create a new session when under free tier limit', async () => {
    // Mock DB calls inside POST /api/sessions
    const mockSelect = jest.fn();
    const mockEq = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockNot = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { subscription_tier: 'free' } });
    const mockSingle = jest.fn().mockResolvedValue({ data: null }); // No existing active session
    const mockInsert = jest.fn().mockResolvedValue({});

    // 1st call: fetch profile (maybeSingle)
    // 2nd call: fetch past sessions (not ended_at is null)
    // 3rd call: fetch existing active session (single)
    // 4th call: insert new session
    mockSupabase.from.mockReturnValue({
      select: mockSelect.mockReturnThis(),
      eq: mockEq,
      gte: mockGte,
      not: mockNot.mockResolvedValue({ data: [] }), // 0 minutes used
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      insert: mockInsert
    });

    const res = await request(server).post('/api/sessions').set('Authorization', 'Bearer dummy-token');
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual('Session created successfully');
    expect(res.body.session.id).toEqual('mock-container-123');
    expect(dockerService.createContainer).toHaveBeenCalledWith('mock-user-123', 'free', expect.any(Object));
  });

  it('POST /api/sessions should reject if Free tier limit (10 hours) is exceeded', async () => {
    const mockNot = jest.fn().mockResolvedValue({
      data: [{
        created_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date().toISOString()
      }] // 11 hours used
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      not: mockNot,
      maybeSingle: jest.fn().mockResolvedValue({ data: { subscription_tier: 'free' } })
    });

    const res = await request(server).post('/api/sessions').set('Authorization', 'Bearer dummy-token');
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Free tier limit');
  });

  it('POST /api/sessions should resume existing active session if one exists', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      not: jest.fn().mockResolvedValue({ data: [] }),
      maybeSingle: jest.fn().mockResolvedValue({ data: { subscription_tier: 'free' } }),
      single: jest.fn().mockResolvedValue({ data: { container_id: 'existing-123', port: 6080, url: 'url' } })
    });

    const res = await request(server).post('/api/sessions').set('Authorization', 'Bearer dummy-token');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Existing session resumed');
    expect(res.body.session.id).toEqual('existing-123');
  });

  it('DELETE /api/sessions/:id should update DB and terminate container', async () => {
    const mockUpdate = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockResolvedValue({});

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
      eq: mockEq
    });

    const res = await request(server).delete('/api/sessions/mock-container-123').set('Authorization', 'Bearer dummy-token');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Session terminated successfully');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'stopped' }));
    expect(dockerService.stopContainer).toHaveBeenCalledWith('mock-container-123');
  });
});
