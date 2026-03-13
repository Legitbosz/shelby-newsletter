import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const network =
  process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet'
    ? Network.MAINNET
    : Network.DEVNET;

export const aptosClient = new Aptos(new AptosConfig({ network }));

export default aptosClient;
