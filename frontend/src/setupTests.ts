/* eslint-disable @typescript-eslint/no-require-imports */
// Polyfill TextEncoder/TextDecoder required by react-router in jsdom
// @ts-ignore
import { TextEncoder, TextDecoder } from 'util';
Object.assign(globalThis, { TextEncoder, TextDecoder });

import '@testing-library/jest-dom';
