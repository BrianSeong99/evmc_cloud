// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.5.10;

// Simple counter contract

contract Counter {
    uint counter;
	
    constructor() public{
        counter = 1;
    }
    
    function increment() public {
        counter++;
    }
	
    function add(uint v) public {
        counter += v;
    }
	
    function getCounter() 
        public 
        view
        returns (uint) 
    {
        return counter;
    }
}