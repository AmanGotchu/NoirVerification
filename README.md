

## Installation

1. Install Foundry
2. forge install
3. cd typescript && yarn install

### Generate Solidity Contract

```cd circuits && nargo contract && mv ./contract/plonk_vk.sol ../src/plonk_vk.sol```

### Anvil
In a different terminal, start local Ethereum
```
anvil
```

### Deploy Contract
In root folder

```forge create ./src/plonk_vk.sol:TurboVerifier --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80```

### Fill in Env variables

```
VERIFIER_CONTRACT_ADDR=""
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://127.0.0.1:8545"
```
Put the deployed contract address in ./typescript/.env

### Run script

```
cd typescript && yarn ts-node index.ts --input {field_element}

// Example
cd typescript && yarn ts-node index.ts --input 5
```

### Notes

- All private keys in repo are predefined, prefunded private keys exposed in Anvil.