import * as benchmark from 'benchmark';
import * as path from 'path';
import * as process from 'process';
import * as util from 'util';
import { param}  from './variable'

import { Evmc, EvmcCallKind, EvmcMessage, EvmcStatusCode, EvmcStorageStatus } from 'evmc';

const evmasm = require('evmasm');

interface BenchmarkRun {
    name: string;
    hz: number;
    stats: benchmark.Stats;
}

// This file contains the benchmark test suite. It includes the benchmark and
// some lightweight boilerplate code for running benchmark.js. To
// run the benchmarks, execute `npm run benchmark` from the package directory.
const runSuite =
    (suite: benchmark.Suite, name: string, async = false): Promise<void> => {
        return new Promise((resolve, reject) => {
            console.log(`\nRunning ${name}...`);
            // Reporter for each benchmark
            suite.on('cycle', (event: benchmark.Event) => {
                const benchmarkRun: BenchmarkRun = event.target as BenchmarkRun;
                const stats = benchmarkRun.stats as benchmark.Stats;
                const meanInNanos = (stats.mean * 1000000000).toFixed(2);
                const stdDevInNanos = (stats.deviation * 1000000000).toFixed(3);
                const runs = stats.sample.length;
                const ops = benchmarkRun.hz.toFixed(benchmarkRun.hz < 100 ? 2 : 0);
                const err = stats.rme.toFixed(2);

                console.log(
                    `${benchmarkRun.name}: ${ops}±${err}% ops/s ${meanInNanos}±${stdDevInNanos} ns/op (${runs} run${runs === 0 ? '' : 's'})`);
            });

            suite.on('complete', () => {
                console.log(
                    'Fastest is ' +
                    suite.filter('fastest').map('name' as unknown as Function));
                resolve();
            });
            // Runs the test suite
            suite.run({ async });
        });
    };

interface BenchmarkDeferrable {
    resolve: () => void;
}

interface BenchmarkRun {
    name: string;
    hz: number;
    stats: benchmark.Stats;
}

/**
 * Simple wrapper for benchmark.js to add an asynchronous test.
 *  @param name         The name of the test to run.
 *  @param asyncTest    An async function which contains the test to be run. If
 * a setup function is provided, the state will be present in the {state}
 * parameter. Otherwise, the {state} parameter will be undefined.
 *  @param setup        Optional setup which provides state to {asyncTest}.
 */
const addAsyncTest = <T>(
    name: string, asyncTest: (state: T) => Promise<void>, setup?: () => T) => {
    let state: T;
    suite.add(name, {
        defer: true,
        setup: () => {
            if (setup !== undefined) {
                state = setup();
            }
        },
        fn: (deferred: BenchmarkDeferrable) => {
            asyncTest(state).then(() => deferred.resolve());
        }
    });
};


let suite = new benchmark.Suite();
// Tests the performance of a no-op.
suite.add('no-op', () => { });
runSuite(suite, 'basic');

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

    async getCodeHash(account: bigint) {
        if (account === param.BALANCE_ACCOUNT) {
            return param.BALANCE_CODEHASH;
        }
        throw new Error(`Invalid code hash account (got ${account.toString(16)})`);
    }

    async call(message: EvmcMessage) {
        if (message.inputData.equals(param.CODE_INPUT_DATA)) {
            return {
                statusCode: EvmcStatusCode.EVMC_SUCCESS,
                gasLeft: 10000n,
                outputData: param.CODE_OUTPUT_DATA,
                createAddress: 0n
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

const alethPath = path.join(__dirname, `../interpreter/libaleth-interpreter.${getDynamicLibraryExtension()}`);

// Test the performance of evmc creation
suite = new benchmark.Suite('evmc_creation');
suite.add('create', () => {
    const evm = new TestEVM(alethPath);
    evm.release();
});
runSuite(suite, 'evmc_creation');
// Test the performance of evmc execution
suite = new benchmark.Suite('evmc_execution');

const MAX_PARALLELISM = 4;
const evm: Evmc[] = [];
for (let i = 0; i < MAX_PARALLELISM; i++) {
    evm.push(new TestEVM(alethPath));
}
const SIMPLE_MESSAGE = {
    kind: EvmcCallKind.EVMC_CALL,
    sender: param.TX_ORIGIN,
    depth: 0,
    destination: param.TX_DESTINATION,
    gas: param.TX_GAS,
    inputData: Buffer.from([]),
    value: 0n
};

const SINGLE_STORE_CONTRACT = Buffer.from(
    evmasm.compile(`
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
`),
    'hex');

const TEN_STORE_CONTRACT = Buffer.from(
    evmasm.compile(`
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
  sstore(0x${param.STORAGE_ADDRESS.toString(16)}, 0x${param.STORAGE_VALUE.toString(16)})
`),
    'hex');


addAsyncTest('async no-op', async () => { });
addAsyncTest('execute null contract', async () => {
    await evm[0].execute(SIMPLE_MESSAGE, Buffer.from([]));
});
addAsyncTest('parallel execute null contract', async () => {
    await Promise.all(evm.map(e => {
        return e.execute(SIMPLE_MESSAGE, Buffer.from([]));
    }));
});

addAsyncTest('execute 1x store contract', async () => {
    await evm[0].execute(SIMPLE_MESSAGE, SINGLE_STORE_CONTRACT);
});
addAsyncTest('parallel execute 1x store contract', async () => {
    await Promise.all(evm.map(e => {
        return e.execute(SIMPLE_MESSAGE, SINGLE_STORE_CONTRACT);
    }));
});

addAsyncTest('execute 10x store contract', async () => {
    await evm[0].execute(SIMPLE_MESSAGE, TEN_STORE_CONTRACT);
});
addAsyncTest('parallel execute 10x store contract', async () => {
    await Promise.all(evm.map(e => {
        return e.execute(SIMPLE_MESSAGE, TEN_STORE_CONTRACT);
    }));
});

const evmExeuctionRun = async () => {
    await runSuite(suite, 'evmc_execution');
    evm.map(e => {
        e.release();
    });
};

evmExeuctionRun();
