import express from "express";
import * as util from 'util';
import * as path from 'path';
import * as param from "./variable";

import { Evmc, EvmcCallKind, EvmcMessage, EvmcStatusCode, EvmcStorageStatus } from 'evmc';

const app = express();

class MyEVM extends Evmc {
    async getAccountExists(account: bigint) {
        // Accounts always exist
        return true;
    }

    async getStorage(account: bigint, key: bigint) {
        // Our "test" storage always returns the magic number
        if (key === param.STORAGE_ADDRESS) {
            return param.STORAGE_VALUE;
        }
        throw new Error(`Invalid test addresss (got ${key.toString(16)}`);
    }

    async setStorage(account: bigint, key: bigint, val: bigint) {
        if (key === param.STORAGE_ADDRESS && val === param.STORAGE_VALUE) {
            return EvmcStorageStatus.EVMC_STORAGE_ADDED;
        }
        throw new Error(`Invalid storage address (got ${key.toString(16)})`);
    }

    async getBalance(account: bigint) {
        console.log("getBalance account: ", account);
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_BALANCE;
        }
        return param.BALANCE_BALANCE;
        throw new Error(`Invalid balance account (got ${account.toString(16)})`);
    }

    async getCodeSize(account: bigint) {
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_CODESIZE;
        }
        throw new Error(`Invalid code size account (got ${account.toString(16)})`);
    }

    async getCodeHash(account: bigint) {
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_CODEHASH;
        }
        throw new Error(`Invalid code hash account (got ${account.toString(16)})`);
    }

    async copyCode(account: bigint, offset: number, length: number) {
        if (account === param.CODE_ACCOUNT && offset === 0 &&
            length === param.CODE_CODE.length) {
            return param.CODE_CODE;
        }
        throw new Error(`Invalid code to copy for ${param.CODE_ACCOUNT}`);
    }

    async selfDestruct(account: bigint, beneficiary: bigint) {
        if (account === param.TX_ORIGIN && beneficiary === param.SELF_DESTRUCT_BENEFICIARY) {
            return;
        }
        throw new Error(
            `Self destruct on unexpected origin or beneficary (origin: ${account.toString(16)} beneficairy:${beneficiary.toString(16)})`);
    }

    async call(message: EvmcMessage) {
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
        if (num === param.BLOCKHASH_NUM) {
            return param.BLOCKHASH_HASH;
        }
        throw new Error(
            `Unexpected block number requested for blockhash (got ${num})`);
    }

    async emitLog(account: bigint, data: Buffer, topics: Array<bigint>) {
        if (account === param.BALANCE_ACCOUNT && data.equals(param.LOG_DATA) &&
            topics.length === 2 && topics[0] === param.LOG_TOPIC1 &&
            topics[1] === param.LOG_TOPIC2) {
            return;
        }
        throw new Error(`Unexpected log emitted: account: ${account.toString(16)} data: ${data.toString('hex')} topics: ${topics}`);
    }
}

const getDynamicLibraryExtension = () => {
    return process.platform === 'win32' ?
        'dll' :
        process.platform === 'darwin' ? 'dylib' : 'so';
};

var Contract = require('web3-eth-contract');
var contract = new Contract(param.example_abi);
const evmpath = path.join(__dirname, `../interpreter/libaleth-interpreter.${getDynamicLibraryExtension()}`);
console.log("=== EVM path: ", evmpath);
const encoded = contract.methods.getCounter().encodeABI();
console.log("encoded", encoded);

const evmasm = require('evmasm');

function hexStringToByte(str: string) {
    if (!str) {
        return new Uint8Array();
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i += 2) {
        a.push(parseInt(str.substr(i, 2), 16));
    }

    return new Uint8Array(a);
}

const message = {
    kind: EvmcCallKind.EVMC_CALL,
    sender: param.BALANCE_ACCOUNT,
    depth: 0,
    destination: param.TX_DESTINATION,
    gas: param.TX_GAS,
    inputData: Buffer.from(hexStringToByte(encoded)),
    value: 0n
};

console.log("before creating evm");
const evm = new MyEVM(evmpath);
console.log("before execute");

const test = async () => {
    const code = Buffer.from(param.example_bytecode, 'utf8');
    console.log("code", code);
    const result = await evm.execute(message, code);
    console.log("result");
    console.log(result);
}

const result = test();
console.log("started testing");

app.get('/', async (req, res) => {
    // await test();
    res.send("Hello~!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App listening on PORT ${port}`));