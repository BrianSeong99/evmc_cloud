import { EvmcCallKind } from 'evmc';

export const STORAGE_ADDRESS = 0x42n;
export const STORAGE_VALUE = 0x05n;
export const BALANCE_ACCOUNT = 0x174201554d57715a2382555c6dd9028166ab20ean;
export const BALANCE_BALANCE = 0xabcdef12345500n;
export const BALANCE_CODESIZE = 24023n;
export const BALANCE_CODEHASH =
    0xecd99ffdcb9df33c9ca049ed55f74447201e3774684815bc590354427595232bn;

export const BLOCK_NUMBER = 0x10001000n;
export const BLOCK_COINBASE = 0x2fab01632ab26a6349aedd19f5f8e4bbd477718n;
export const BLOCK_TIMESTAMP = 1551402771n;
export const BLOCK_GASLIMIT = 10000000000n;
export const BLOCK_DIFFICULTY = 2427903418305647n;

export const TX_ORIGIN = 0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8n;
export const TX_GASPRICE = 100n;
export const TX_DESTINATION = BALANCE_ACCOUNT;
export const TX_GAS = 600000000n;

export const CALL_ACCOUNT = 0x44fD3AB8381cC3d14AFa7c4aF7Fd13CdC65026E1n;

export const CODE_OUTPUT_DATA = Buffer.from(
    'b745858cc23a311a303b43f18813d7331a257a817201576533298ffbe3809b32', 'hex');
export const CREATE_OUTPUT_ACCOUNT = 0xA643e67B31F2E0A7672FD87d3faa28eAa845E311n;

export const BLOCKHASH_NUM = BLOCK_NUMBER - 4n;
export const BLOCKHASH_HASH =
    0xecd99ffdcb9df33c9ca049ed55f74447201e3774684815bc590354427595232bn;

export const SELF_DESTRUCT_BENEFICIARY = 0xA643e67B31F2E0A7672FD87d3faa28eAa845E311n;

export const LOG_DATA = Buffer.from([0xab, 0xfe]);
export const LOG_TOPIC1 =
    0xecd99eedcb9df33c9ca049ed55f74447201e3774684815bc590354427595232bn;
export const LOG_TOPIC2 = 0x2fab01632ab26a6349aedd19f5f8e4bbd47771n;

// contract address
export const CODE_ACCOUNT = 0xa53432ff16287dae8c4e09209a70cca8aaa3f50an;

// for external code
export const CODE_CODE = Buffer.from(
    'ecd99eedcb9df33c9ca049ed55f74447201e3774684815bc590354427595232b', 'hex');

export const example_abi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "v",
                "type": "uint256"
            }
        ],
        "name": "add",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getCounter",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "increment",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
];

// [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "uint256", "name": "v", "type": "uint256" }], "name": "add", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getCounter", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

export const example_bytecode = "608060405234801561001057600080fd5b50600160008190555060f3806100276000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80631003e2d21460415780638ada066e14606c578063d09de08a146088575b600080fd5b606a60048036036020811015605557600080fd5b81019080803590602001909291905050506090565b005b607260a2565b6040518082815260200191505060405180910390f35b608e60ab565b005b80600080828254019250508190555050565b60008054905090565b600080815480929190600101919050555056fea265627a7a72305820cdc3ec8e978662bd66eac7a0456271f4b2f7a63d784a514bbc87e208d8aae20f64736f6c634300050a0032";

//"60806040523480156100115760006000fd5b505b600160006000508190909055505b610026565b610282806100356000396000f3fe60806040523480156100115760006000fd5b50600436106100465760003560e01c80631003e2d21461004c5780638ada066e14610068578063d09de08a1461008657610046565b60006000fd5b610066600480360381019061006191906100fc565b610090565b005b6100706100b1565b60405161007d9190610137565b60405180910390f35b61008e6100c3565b005b806000600082828250546100a49190610153565b9250508190909055505b50565b600060006000505490506100c0565b90565b6000600081815054809291906100d8906101b5565b919050909055505b5661024b565b6000813590506100f581610230565b5b92915050565b60006020828403121561010f5760006000fd5b600061011d848285016100e6565b9150505b92915050565b610130816101aa565b825250505b565b600060208201905061014c6000830184610127565b5b92915050565b600061015e826101aa565b9150610169836101aa565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561019e5761019d6101ff565b5b82820190505b92915050565b60008190505b919050565b60006101c0826101aa565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156101f3576101f26101ff565b5b6001820190505b919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b565b610239816101aa565b811415156102475760006000fd5b505b565bfea26469706673582212209e7a80fe5a4efd8b193085dc5d9fb7c7813f6d46b9abf106189d74155feb5d5164736f6c63430008040033";
var Contract = require('web3-eth-contract');
var contract = new Contract(example_abi);
const encoded = contract.methods.getCounter().encodeABI();

export const code = Buffer.from(example_bytecode, 'hex');

export const CODE_INPUT_DATA = Buffer.from(
    encoded, 'hex');

export const EVM_MESSAGE = {
    kind: EvmcCallKind.EVMC_CALL,
    sender: TX_ORIGIN,
    depth: 20,
    destination: TX_DESTINATION,
    gas: TX_GAS,
    inputData: CODE_INPUT_DATA,
    value: 0n
};