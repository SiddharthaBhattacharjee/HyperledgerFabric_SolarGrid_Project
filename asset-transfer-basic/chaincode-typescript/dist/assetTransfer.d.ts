import { Context, Contract } from 'fabric-contract-api';
export declare class AssetTransferContract extends Contract {
    InitLedger(ctx: Context, org1Val: number, org2Val: number): Promise<void>;
    CreateAsset(ctx: Context, id: string, tokenValue: number): Promise<void>;
    ReadAsset(ctx: Context, id: string): Promise<string>;
    UpdateAsset(ctx: Context, id: string, tokenValue: number): Promise<void>;
    AddAsset(ctx: Context, id: string, tokenValue: number): Promise<void>;
    SubtractAsset(ctx: Context, id: string, tokenValue: number): Promise<void>;
    DeleteAsset(ctx: Context, id: string): Promise<void>;
    AssetExists(ctx: Context, id: string): Promise<boolean>;
    TransferAsset(ctx: Context, id: string, newID: string, amount: number): Promise<string>;
    GetAllAssets(ctx: Context): Promise<string>;
}
