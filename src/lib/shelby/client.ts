/**
 * Shelby Protocol SDK wrapper
 * Docs: https://docs.shelby.xyz
 *
 * Replace fetch calls with official Shelby SDK once released
 */

const SHELBY_RPC_URL =
  process.env.NEXT_PUBLIC_SHELBY_RPC_URL || 'https://rpc.devnet.shelby.xyz';
const SHELBY_API_KEY = process.env.SHELBY_API_KEY || '';

export const shelbyClient = {
  rpcUrl: SHELBY_RPC_URL,
  apiKey: SHELBY_API_KEY,
};

export default shelbyClient;
