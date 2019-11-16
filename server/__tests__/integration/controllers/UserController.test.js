import request from 'supertest';
import app from '../../../src/app';

import factory from '../../factories';
import truncate from '../../util/truncate';

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

  it('should not be able to request with invalid data', async () => {
    const { email, password } = await factory.create('User');

    const session = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = session.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 1234, email: 654312, password: 'teste' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation fails');
  });

  it('should be able to change user name', async () => {
    const { email, password } = await factory.create('User');

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'newUserName' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('newUserName');
  });

  it('should be able to change user email', async () => {
    const { email, password } = await factory.create('User');

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ email: 'newemail@email.com' });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('newemail@email.com');
  });

  it('should not be able to change email if email is in use', async () => {
    const [userInUse, user] = await Promise.all([
      factory.create('User', { email: 'teste@teste.com' }),
      factory.create('User'),
    ]);

    const { email, password } = user;

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({ email: userInUse.email });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email already in use.');
  });

  it('should be able to change password', async () => {
    const { email, password } = await factory.create('User');

    let getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const newPassword = 'newPassword';

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: newPassword,
        passwordConfirm: newPassword,
        oldPassword: password,
      });

    expect(res.status).toBe(200);

    getToken = await request(app)
      .post('/sessions')
      .send({ email, password: newPassword });

    expect(res.status).toBe(200);
    expect(getToken.body).toHaveProperty('token');
  });

  it('should not be able to change password without confirmPassword', async () => {
    const { email, password } = await factory.create('User');

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const newPassword = 'newPassword';

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: newPassword,
        oldPassword: password,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation fails');
  });

  it('should not be able to change password without VALID confirmPassword', async () => {
    const { email, password } = await factory.create('User');

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const newPassword = 'newPassword';

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: newPassword,
        passwordConfirm: 'invalid password',
        oldPassword: password,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation fails');
  });

  it('should not be able to change password without VALID oldPassword', async () => {
    const { email, password } = await factory.create('User');

    const getToken = await request(app)
      .post('/sessions')
      .send({ email, password });

    const { token } = getToken.body;

    const newPassword = 'newPassword';

    const res = await request(app)
      .put('/users')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: newPassword,
        passwordConfirm: newPassword,
        oldPassword: 'invalid',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Password does not match');
  });
});
