const request = require('supertest');
const express = require('express');

// 1. Mock Supabase
const mockSupabase = {
  from: jest.fn()
};
jest.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase
}));

// 2. Mock Auth Middleware
jest.mock('../src/middleware/auth', () => (req, res, next) => {
  // Use a fixed ID for the "same user" test
  req.user = { id: 'test-user-concurrency' };
  next();
});

// 3. Mock Docker Service with a DELAY to simulate work
jest.mock('../src/services/dockerService', () => ({
  createContainer: jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'mock-container-999',
          port: 6081,
          url: 'http://localhost:6081/vnc.html'
        });
      }, 500); // 500ms delay to allow race condition to be caught
    });
  }),
  getContainerStatus: jest.fn().mockResolvedValue({ state: 'running' }),
  getVolumeUsage: jest.fn().mockResolvedValue(1024)
}));

const app = require('../src/index');

describe('Session Mutex Concurrency Tests', () => {
  let server;

  beforeAll((done) => {
    process.env.PORT = 4002;
    server = app.listen(4002, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock standard DB responses for profile and history
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockGte = jest.fn().mockReturnThis();
    const mockNot = jest.fn().mockReturnThis();
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { subscription_tier: 'developer' } });
    const mockSingle = jest.fn().mockResolvedValue({ data: null }); // No existing active session
    const mockInsert = jest.fn().mockResolvedValue({});

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      not: mockNot.mockResolvedValue({ data: [] }),
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      insert: mockInsert
    });
  });

  it('should prevent the same user from starting two sessions simultaneously', async () => {
    console.log('[Test] Triggering two concurrent session requests...');
    
    // Fire both requests at once
    const req1 = request(server).post('/api/sessions').set('Authorization', 'Bearer dummy');
    const req2 = request(server).post('/api/sessions').set('Authorization', 'Bearer dummy');

    const [res1, res2] = await Promise.all([req1, req2]);

    // One should be 201 (Created), the other should be 429 (Too Many Requests)
    const statuses = [res1.status, res2.status];
    
    console.log(`[Test] Statuses received: ${statuses}`);
    
    expect(statuses).toContain(201);
    expect(statuses).toContain(429);

    const blockedRes = res1.status === 429 ? res1 : res2;
    expect(blockedRes.body.error).toBe('Session creation already in progress. Please wait.');
  });

  it('should allow the user to start a session after the first one finishes (lock release)', async () => {
    // Request 1
    const res1 = await request(server).post('/api/sessions').set('Authorization', 'Bearer dummy');
    expect(res1.status).toBe(201);

    // Request 2 (immediately after)
    // In this test, because we awaited the first, the lock should already be released
    const res2 = await request(server).post('/api/sessions').set('Authorization', 'Bearer dummy');
    expect(res2.status).toBe(201); // Should succeed again (resuming or creating new depending on mock)
  });
});
