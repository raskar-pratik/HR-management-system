/* eslint-disable @typescript-eslint/no-require-imports */
// Polyfill TextEncoder/TextDecoder required by react-router in jsdom
const { TextEncoder, TextDecoder } = require('util');
Object.assign(globalThis, { TextEncoder, TextDecoder });

import '@testing-library/jest-dom';
