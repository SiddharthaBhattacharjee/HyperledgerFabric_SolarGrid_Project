import FabricCAServices from 'fabric-ca-client';
import { Wallet } from 'fabric-network';
/**
 *
 * @param {*} ccp
 */
declare const buildCAClient: (ccp: Record<string, any>, caHostName: string) => FabricCAServices;
declare const enrollAdmin: (caClient: FabricCAServices, wallet: Wallet, orgMspId: string) => Promise<void>;
declare const registerAndEnrollUser: (caClient: FabricCAServices, wallet: Wallet, orgMspId: string, userId: string, affiliation: string) => Promise<void>;
export { buildCAClient, enrollAdmin, registerAndEnrollUser, };
