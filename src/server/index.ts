import { https } from 'firebase-functions';
import createServer from './server';

const server = createServer();

const api = https.onRequest(server);

export { api };
