import express from "express";
import * as util from 'util';
import * as path from 'path';
import * as param from "./variable";

import { Evmc, EvmcCallKind, EvmcMessage, EvmcStatusCode, EvmcStorageStatus } from 'evmc';

const app = express();

class MyEVM extends Evmc {

    async getAccountExists(account: bigint) {
        this.increment("getAccountExists");
        console.log(account); 
        // Accounts always exist
        return true;
    }

    async getStorage(account: bigint, key: bigint) {
        this.increment("getStorage");
        // Our "test" storage always returns the magic number
        if (key === param.STORAGE_ADDRESS) {
            return param.STORAGE_VALUE;
        }
        throw new Error(`Invalid test addresss (got ${key.toString(16)}`);
    }

    async setStorage(account: bigint, key: bigint, val: bigint) {
        this.increment("setStorage");
        if (key === param.STORAGE_ADDRESS && val === param.STORAGE_VALUE) {
            return EvmcStorageStatus.EVMC_STORAGE_ADDED;
        }
        throw new Error(`Invalid storage address (got ${key.toString(16)})`);
    }

    async getBalance(account: bigint) {
        this.increment("getBalance");
        
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_BALANCE;
        } else if (account === 0n) {
            return 0n;
        }
        throw new Error(`Invalid balance account (got ${account.toString(16)})`);
    }

    async getCodeSize(account: bigint) {
        this.increment("getCodeSize");
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_CODESIZE;
        }
        throw new Error(`Invalid code size account (got ${account.toString(16)})`);
    }

    async getCodeHash(account: bigint) {
        this.increment("getCodeHash");

        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_CODEHASH;
        }
        throw new Error(`Invalid code hash account (got ${account.toString(16)})`);
    }

    async copyCode(account: bigint, offset: number, length: number) {
        this.increment("copyCode");

        if (account === param.CODE_ACCOUNT && offset === 0 &&
            length === param.CODE_CODE.length) {
            return param.CODE_CODE;
        }
        throw new Error(`Invalid code to copy for ${param.CODE_ACCOUNT}`);
    }

    async selfDestruct(account: bigint, beneficiary: bigint) {
        this.increment("selfDestruct");

        if (account === param.TX_ORIGIN && beneficiary === param.SELF_DESTRUCT_BENEFICIARY) {
            return;
        }
        throw new Error(
            `Self destruct on unexpected origin or beneficary (origin: ${account.toString(16)} beneficairy:${beneficiary.toString(16)})`);
    }

    async call(message: EvmcMessage) {
        this.increment("call");

        console.log("-- inputdata: ", message.inputData);
        console.log("-- paramdata: ", param.CODE_INPUT_DATA);
        if (message.inputData.equals(param.CODE_INPUT_DATA)) {
            return {
                statusCode: EvmcStatusCode.EVMC_SUCCESS,
                gasLeft: 10000n,
                outputData: param.CODE_OUTPUT_DATA,
                createAddress: param.CREATE_OUTPUT_ACCOUNT
            }; 
        }
        throw new Error(`Unexpected input message ${util.inspect(message)}`);
    }

    async getTxContext() {
        this.increment("getTxContext");


        return {
            txGasPrice: param.TX_GASPRICE,
            txOrigin: param.TX_ORIGIN,
            blockCoinbase: param.BLOCK_COINBASE,
            blockNumber: param.BLOCK_NUMBER,
            blockTimestamp: param.BLOCK_TIMESTAMP,
            blockGasLimit: param.BLOCK_GASLIMIT,
            blockDifficulty: param.BLOCK_DIFFICULTY
        };
    }

    async getBlockHash(num: bigint) {
        this.increment("getBlockHash");

        if (num === param.BLOCKHASH_NUM) {
            return param.BLOCKHASH_HASH;
        }
        throw new Error(
            `Unexpected block number requested for blockhash (got ${num})`);
    }

    async emitLog(account: bigint, data: Buffer, topics: Array<bigint>) {
        this.increment("emitLog");


        if (account === param.BALANCE_ACCOUNT && data.equals(param.LOG_DATA) &&
            topics.length === 2 && topics[0] === param.LOG_TOPIC1 &&
            topics[1] === param.LOG_TOPIC2) {
            return;
        }
        throw new Error(`Unexpected log emitted: account: ${account.toString(16)} data: ${data.toString('hex')} topics: ${topics}`);
    }

    counter = 0;

    MyEvmc() {
        this.counter = 0;
    }

    increment(location: string) {
        console.log("\n--- ", this.counter, " ", location);
        this.counter+=1;
    }

    getCounter() {
        return this.counter;
    }
}

const getDynamicLibraryExtension = () => {
    return process.platform === 'win32' ?
        'dll' :
        process.platform === 'darwin' ? 'dylib' : 'so';
};

const evmpath = path.join(__dirname, `../interpreter/libaleth-interpreter.${getDynamicLibraryExtension()}`);

const evm = new MyEVM(evmpath);

const test = async () => {
    const result = await evm.execute(param.EVM_MESSAGE, param.code);
    
    console.log("result:");
    console.log("=========");
    console.log("status code: ", result.statusCode);
    console.log("gasLeft: ", result.gasLeft);
    console.log("message: ", result.outputData.toString());
} 

const result = test();

app.get('/', async (req, res) => {
    // await test();
    res.send("Hello~!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App listening on PORT ${port}`));