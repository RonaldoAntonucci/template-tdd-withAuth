import request from 'supertest';
import app from '../../../src/app';
import factory from '../../factories';
import truncate from '../../util/truncate';

describe('Session Controller', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to authenticate with valid credentials', async () => {
    const { email, password } = await factory.create('User', {
      password: '123456',
      confirmPassword: '123456',
    });

    const response = await request(app)
      .post('/sessions')
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('name');
    expect(response.body.user).toHaveProperty('email');
    expect(response.body).toHaveProperty('token');
  });

  it('should not be able to authenticate without valid data', async () => {
    const email = 'invalid';
    const password = true;

    const response = await request(app)
      .post('/sessions')
      .send({ email, password });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Validation fails');
  });

  it('should not be able to authenticate without valid email', async () => {
    const email = 'invalid@invalid.com';
    const password = '123456';

    const response = await request(app)
      .post('/sessions')
      .send({ email, password });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('User not found.');
  });

  it('should not be able to authenticate without valid password', async () => {
    const { email } = await factory.create('User', {
      password: '123456',
      confirmPassword: '123456',
    });

    const password = '654321';

    const response = await request(app)
      .post('/sessions')
      .send({ email, password });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Password does not match.');
  });
});
