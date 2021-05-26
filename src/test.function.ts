import 'mocha';
import * as chai from 'chai';
import * as process from 'process';
import * as util from 'util';
import * as path from 'path';
import { param}  from './variable'

import { Evmc, EvmcCallKind, EvmcMessage, EvmcStatusCode, EvmcStorageStatus } from 'evmc';

const evmasm = require('evmasm');

require('segfault-handler').registerHandler();

const assertEquals = (n0: any, n1: any) => {
    n0.toString(16).should.equal(n1.toString(16));
};

chai.should();
const should = chai.should();

const EVM_MESSAGE = {
    kind: EvmcCallKind.EVMC_CALL,
    sender: param.TX_ORIGIN,
    depth: 0,
    destination: param.TX_DESTINATION,
    gas: param.TX_GAS,
    inputData: Buffer.from([]),
    value: 0n
};


class TestEVM extends Evmc {
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
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_BALANCE;
        }
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

describe('Try EVM creation', () => {
    let evm: TestEVM;

    const evmpath = path.join(__dirname, `../interpreter/libaleth-interpreter.${getDynamicLibraryExtension()}`);

    it('should be created', () => {
        evm = new TestEVM(evmpath);
    });

    it('should fail to execute a bad message', async () => {
        const result = await evm.execute(EVM_MESSAGE, Buffer.from([0xfe]));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_UNDEFINED_INSTRUCTION);
    });

    it('should successfully execute a STOP opcode', async () => {
        const result = await evm.execute(EVM_MESSAGE, Buffer.from([0x00]));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
        assertEquals(param.TX_GAS, result.gasLeft);
    });

    it('should successfully read magic from storage', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(sload(${param.STORAGE_ADDRESS}), ${param.STORAGE_VALUE}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully write magic to storage', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            sstore(${param.STORAGE_ADDRESS}, ${param.STORAGE_VALUE})
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get the senders balance', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(balance(0x${param.BALANCE_ACCOUNT.toString(16)}), ${param.BALANCE_BALANCE}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get block number', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(blocknumber(), 0x${param.BLOCK_NUMBER.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get the timestamp', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(timestamp(), 0x${param.BLOCK_TIMESTAMP.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get the coinbase', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(coinbase(), 0x${param.BLOCK_COINBASE.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get the difficulty', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(difficutly(), 0x${param.BLOCK_DIFFICULTY.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });


    it('should successfully get the gas limit', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(gaslimit(), 0x${param.BLOCK_GASLIMIT.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get the code size of an account', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(extcodesize(0x${param.BALANCE_ACCOUNT.toString(16)}), 0x${param.BALANCE_CODESIZE.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully successfully fetch a blockhash', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
          jumpi(success, eq(blockhash(0x${param.BLOCKHASH_NUM.toString(16)}), 0x${param.BLOCKHASH_HASH.toString(16)}))
          data(0xFE) // Invalid Opcode
          success:
          stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });


    it('should successfully emit a log', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            mstore(0, 0x${param.LOG_DATA.toString('hex')})
            log2(${32 - param.LOG_DATA.length}, ${param.LOG_DATA.length}, 0x${param.LOG_TOPIC1.toString(16)}, 0x${param.LOG_TOPIC2.toString(16)})
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get external code', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            extcodecopy(0x${param.CODE_ACCOUNT.toString(16)}, 0, 0,
            0x${param.CODE_CODE.length.toString(16)})
            jumpi(success, eq(mload(0), 0x${param.CODE_CODE.toString('hex')}))
            data(0xFE) // Invalid Opcode
            success:
            stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully get a code hash call', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            data(0x73)
            data(0x${param.BALANCE_ACCOUNT.toString(16)})
            data(0x3F)
            mstore(0)
            jumpi(success, eq(mload(0), 0x${param.BALANCE_CODEHASH.toString(16)}))
            data(0x3F)
            success:
            stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully call', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            mstore(0, 0x${param.CODE_INPUT_DATA.toString('hex')})
            delegatecall(10000, 0x${param.CALL_ACCOUNT}, 0, 32, 32, 32)
            jumpi(success, eq(mload(32), 0x${param.CODE_OUTPUT_DATA.toString('hex')}))
            data(0xFE) // Invalid Opcode
            success:
            stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should successfully create', async () => {
        const result = await evm.execute(
            EVM_MESSAGE,
            Buffer.from(
                evmasm.compile(`
            mstore(0, 0x${param.CODE_INPUT_DATA.toString('hex')})
            jumpi(success, eq(create(10000, 0, 32), 0x${param.CREATE_OUTPUT_ACCOUNT.toString(16)}))
            data(0xFE) // Invalid Opcode
            success:
            stop
          `),
                'hex'));
        result.statusCode.should.equal(EvmcStatusCode.EVMC_SUCCESS);
    });

    it('should destroy the EVM', async () => {
        evm.release();
        evm.released.should.be.true;
    });
});