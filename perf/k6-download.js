import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.TOKEN;

export default function () {
  if (!TOKEN) {
    throw new Error('Missing env var TOKEN');
  }

  const metaRes = http.get(`${BASE_URL}/download/${TOKEN}/meta`);
  check(metaRes, {
    'meta status 200': (r) => r.status === 200,
    'meta is json': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
  });

  const dlRes = http.get(`${BASE_URL}/download/${TOKEN}`);
  check(dlRes, {
    'download status 200': (r) => r.status === 200,
  });

  sleep(0.2);
}
