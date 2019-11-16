import request from 'supertest';
import app from '../../src/app';

import factory from '../factories';
import truncate from '../util/truncate';

describe('User /Store', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should encrypt user password when new user created', async () => {
    const user = await factory.create('User', {
      password: '$#@#126@ADdsk*&',
    });

    const compareFailed = await user.checkPassword('fail');
    const compareSucess = await user.checkPassword('$#@#126@ADdsk*&');

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(compareSucess).toBe(true);
    expect(compareFailed).toBe(false);
  });

  it('should not be able to register without passwordConfirm', async () => {
    const user = await factory.attrs('User');
    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('Validation fails');
  });

  it('should not be able to register without email', async () => {
    const user = await factory.attrs('User');
    delete user.email;
    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('Validation fails');
  });

  it('should not be able to register without name', async () => {
    const user = await factory.attrs('User');
    delete user.name;
    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('Validation fails');
  });

  it('should not be able to register without password', async () => {
    const user = await factory.attrs('User', { passwordConfirm: '123456' });
    delete user.password;
    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('Validation fails');
  });

  it('should be able to register', async () => {
    const user = await factory.attrs('User', {
      password: 123456,
      passwordConfirm: 123456,
    });

    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.body).toHaveProperty('id');
  });

  it('should not be able to register with duplicated email', async () => {
    const user = await factory.attrs('User');
    user.passwordConfirm = user.password;

    await request(app)
      .post('/users')
      .send(user);

    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('User already existis.');
  });

  it('should not be able to register with invalid confirm password', async () => {
    const user = await factory.attrs('User', {
      password: 123456,
      passwordConfirm: 654321,
    });
    const response = await request(app)
      .post('/users')
      .send(user);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('Password does not match');
  });
});

describe('User /Update', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to chance user name', async () => {
    const { email, password } = await factory.create('User', {
      password: '123456',
      passwordConfirm: '123456',
    });

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'teste' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('teste');
  });
});
