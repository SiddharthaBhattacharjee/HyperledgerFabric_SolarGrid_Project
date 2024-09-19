import { Wallet } from 'fabric-network';
declare const buildCCPOrg1: () => Record<string, any>;
declare const buildCCPOrg2: () => Record<string, any>;
declare const buildWallet: (walletPath: string) => Promise<Wallet>;
declare const prettyJSONString: (inputString: string) => string;
export { buildCCPOrg1, buildCCPOrg2, buildWallet, prettyJSONString, };
