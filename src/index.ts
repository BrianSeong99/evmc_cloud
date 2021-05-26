import express from "express";
import { param, VMConfig } from "./variable"

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {

});

app.post('/vmconfig', async (req, res) => {
    const body = JSON.parse(req.body)
    const vmConfig: VMConfig = {
        STORAGE_ADDRESS: body.STORAGE_ADDRESS != null ? body.STORAGE_ADDRESS : param.STORAGE_ADDRESS,
        STORAGE_VALUE: body.STORAGE_VALUE != null ? body.STORAGE_VALUE : param.STORAGE_VALUE,

        BALANCE_ACCOUNT: body.BALANCE_ACCOUNT != null ? body.BALANCE_ACCOUNT : param.BALANCE_ACCOUNT,
        BALANCE_BALANCE: body.BALANCE_BALANCE != null ? body.BALANCE_BALANCE : param.BALANCE_BALANCE,
        BALANCE_CODESIZE: body.BALANCE_CODESIZE != null ? body.BALANCE_CODESIZE : param.BALANCE_CODESIZE,
        BALANCE_CODEHASH: body.BALANCE_CODEHASH != null ? body.BALANCE_CODEHASH : param.BALANCE_CODEHASH,

        BLOCK_NUMBER: body.BLOCK_NUMBER != null ? body.BLOCK_NUMBER : param.BLOCK_NUMBER,
        BLOCK_COINBASE: body.BLOCK_COINBASE != null ? body.BLOCK_COINBASE : param.BLOCK_COINBASE,
        BLOCK_TIMESTAMP: body.BLOCK_TIMESTAMP != null ? body.BLOCK_TIMESTAMP : param.BLOCK_TIMESTAMP,
        BLOCK_GASLIMIT: body.BLOCK_GASLIMIT != null ? body.BLOCK_GASLIMIT : param.BLOCK_GASLIMIT,
        BLOCK_DIFFICULTY: body.BLOCK_DIFFICULTY != null ? body.BLOCK_DIFFICULTY : param.BLOCK_DIFFICULTY,

        TX_ORIGIN: body.TX_ORIGIN != null ? body.TX_ORIGIN : param.TX_ORIGIN,
        TX_GASPRICE: body.TX_GASPRICE != null ? body.TX_GASPRICE : param.TX_GASPRICE,
        TX_DESTINATION: body.TX_DESTINATION != null ? body.TX_DESTINATION : param.TX_DESTINATION,
        TX_GAS: body.TX_GAS != null ? body.TX_GAS : param.TX_GAS,

        CALL_ACCOUNT: body.CALL_ACCOUNT != null ? body.CALL_ACCOUNT : param.CALL_ACCOUNT,
        CODE_INPUT_DATA: body.CODE_INPUT_DATA != null ? body.CODE_INPUT_DATA : param.CODE_INPUT_DATA,
        CODE_OUTPUT_DATA: body.CODE_OUTPUT_DATA != null ? body.CODE_OUTPUT_DATA : param.CODE_OUTPUT_DATA,
        CREATE_OUTPUT_ACCOUNT: body.CREATE_OUTPUT_ACCOUNT != null ? body.CREATE_OUTPUT_ACCOUNT : param.CREATE_OUTPUT_ACCOUNT,

        BLOCKHASH_NUM: body.BLOCKHASH_NUM != null ? body.BLOCKHASH_NUM : param.BLOCKHASH_NUM,
        BLOCKHASH_HASH: body.BLOCKHASH_HASH != null ? body.BLOCKHASH_HASH : param.BLOCKHASH_HASH,

        SELF_DESTRUCT_BENEFICIARY: body.SELF_DESTRUCT_BENEFICIARY != null ? body.SELF_DESTRUCT_BENEFICIARY : param.SELF_DESTRUCT_BENEFICIARY,

        LOG_DATA: body.LOG_DATA != null ? body.LOG_DATA : param.LOG_DATA,
        LOG_TOPIC1: body.LOG_TOPIC1 != null ? body.LOG_TOPIC1 : param.LOG_TOPIC1,
        LOG_TOPIC2: body.LOG_TOPIC2 != null ? body.LOG_TOPIC2 : param.LOG_TOPIC2,

        CODE_ACCOUNT: body.CODE_ACCOUNT != null ? body.CODE_ACCOUNT : param.CODE_ACCOUNT,
        CODE_CODE: body.CODE_CODE != null ? body.CODE_CODE : param.CODE_CODE,
    }
    
    console.log(vmConfig);
    res.statusCode = 200;
});

app.get('/test/functions/', (req, res) => {

});




app.listen(port, () => console.log(`App listening on PORT ${port}`));