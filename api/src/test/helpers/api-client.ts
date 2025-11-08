/**
 * API Test Client
 *
 * Supertest wrapper for API endpoint testing
 */

import request from 'supertest';
import express, { Express } from 'express';
import { JWTPayload } from '../../auth/authentication.service.js';
import { JWTTestHelper } from './jwt-helper.js';

export class APITestClient {
  private app: Express;
  private baseURL: string;

  constructor(app: Express, baseURL: string = '/api/v1') {
    this.app = app;
    this.baseURL = baseURL;
  }

  /**
   * Create a request with authentication
   */
  authenticatedRequest(method: 'get' | 'post' | 'put' | 'delete' | 'patch', path: string, payload: JWTPayload) {
    const token = JWTTestHelper.generateAccessToken(payload);
    const fullPath = `${this.baseURL}${path}`;

    return request(this.app)
      [method](fullPath)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * GET request with auth
   */
  get(path: string, payload: JWTPayload) {
    return this.authenticatedRequest('get', path, payload);
  }

  /**
   * POST request with auth
   */
  post(path: string, payload: JWTPayload, body?: any) {
    const req = this.authenticatedRequest('post', path, payload);
    return body ? req.send(body) : req;
  }

  /**
   * PUT request with auth
   */
  put(path: string, payload: JWTPayload, body?: any) {
    const req = this.authenticatedRequest('put', path, payload);
    return body ? req.send(body) : req;
  }

  /**
   * DELETE request with auth
   */
  delete(path: string, payload: JWTPayload) {
    return this.authenticatedRequest('delete', path, payload);
  }

  /**
   * Unauthenticated GET request
   */
  getUnauthenticated(path: string) {
    return request(this.app)
      .get(`${this.baseURL}${path}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Unauthenticated POST request
   */
  postUnauthenticated(path: string, body?: any) {
    const req = request(this.app)
      .post(`${this.baseURL}${path}`)
      .set('Content-Type', 'application/json');
    return body ? req.send(body) : req;
  }

  /**
   * Request with invalid token
   */
  getWithInvalidToken(path: string) {
    return request(this.app)
      .get(`${this.baseURL}${path}`)
      .set('Authorization', 'Bearer invalid-token')
      .set('Content-Type', 'application/json');
  }

  /**
   * Request with expired token
   */
  getWithExpiredToken(path: string, payload: JWTPayload) {
    const token = JWTTestHelper.generateExpiredAccessToken(payload);
    return request(this.app)
      .get(`${this.baseURL}${path}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }
}

export default APITestClient;
