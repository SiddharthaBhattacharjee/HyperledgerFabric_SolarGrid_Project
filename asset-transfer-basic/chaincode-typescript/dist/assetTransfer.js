"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTransferContract = void 0;
/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
const fabric_contract_api_1 = require("fabric-contract-api");
const json_stringify_deterministic_1 = __importDefault(require("json-stringify-deterministic"));
const sort_keys_recursive_1 = __importDefault(require("sort-keys-recursive"));
let AssetTransferContract = class AssetTransferContract extends fabric_contract_api_1.Contract {
    async InitLedger(ctx, org1Val, org2Val) {
        const assets = [
            {
                ID: 'Org1',
                TokenValue: org1Val,
            },
            {
                ID: 'Org2',
                TokenValue: org2Val,
            },
        ];
        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(asset))));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }
    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, tokenValue) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }
        const asset = {
            ID: id,
            TokenValue: tokenValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(asset))));
    }
    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }
    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, tokenValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            TokenValue: tokenValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(updatedAsset))));
    }
    async AddAsset(ctx, id, tokenValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        let hasAmount = asset.TokenValue;
        hasAmount = parseInt(hasAmount);
        let NewTokenValue = hasAmount + tokenValue;
        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            TokenValue: NewTokenValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(updatedAsset))));
    }
    async SubtractAsset(ctx, id, tokenValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        let hasAmount = asset.TokenValue;
        hasAmount = parseInt(hasAmount);
        if (hasAmount < tokenValue) {
            throw new Error(`Not enough amount for transfer`);
        }
        let NewTokenValue = hasAmount - tokenValue;
        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            TokenValue: NewTokenValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(updatedAsset))));
    }
    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }
    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }
    // TransferAsset updates the owner field of asset with given id in the world state, and returns the old owner.
    async TransferAsset(ctx, id, newID, amount) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        let hasAmount = asset.TokenValue;
        hasAmount = parseInt(hasAmount);
        if (hasAmount < amount) {
            throw new Error(`Not enough amount for transfer`);
        }
        asset.TokenValue = hasAmount - amount;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(asset))));
        const assetString2 = await this.ReadAsset(ctx, newID);
        const asset2 = JSON.parse(assetString2);
        let hasAmount2 = asset2.TokenValue;
        hasAmount2 = parseInt(hasAmount2);
        asset2.TokenValue = hasAmount2 + amount;
        await ctx.stub.putState(newID, Buffer.from((0, json_stringify_deterministic_1.default)((0, sort_keys_recursive_1.default)(asset2))));
        return id;
    }
    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            }
            catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
};
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, Number, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "InitLedger", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "CreateAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "ReadAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "UpdateAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "AddAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "SubtractAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "DeleteAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('boolean'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "AssetExists", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String, String, Number]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "TransferAsset", null);
__decorate([
    (0, fabric_contract_api_1.Transaction)(false),
    (0, fabric_contract_api_1.Returns)('string'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context]),
    __metadata("design:returntype", Promise)
], AssetTransferContract.prototype, "GetAllAssets", null);
AssetTransferContract = __decorate([
    (0, fabric_contract_api_1.Info)({ title: 'AssetTransfer', description: 'Smart contract for trading assets' })
], AssetTransferContract);
exports.AssetTransferContract = AssetTransferContract;
//# sourceMappingURL=assetTransfer.js.map