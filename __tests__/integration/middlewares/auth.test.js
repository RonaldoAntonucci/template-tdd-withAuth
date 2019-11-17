import request from 'supertest';
import app from '../../../src/app';

import factory from '../../factories';
import truncate from '../../util/truncate';

describe('Auth Middleware', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be call next() with valid credentials', async () => {
    const user = await factory.create('User');

    const session = await request(app)
      .post('/sessions')
      .send({ email: user.email, password: user.password });

    const { token } = session.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'newname' });

    expect(res.status).toBe(200);
  });

  it('should be return an error by request without token', async () => {
    const res = await request(app)
      .put('/users')
      .send({ name: 'newname' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token not provided');
  });

  it('should be return an error by request with token not valid', async () => {
    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer invalidToken`)
      .send({ name: 'newname' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token invalid');
  });
});
