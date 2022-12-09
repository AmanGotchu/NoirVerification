

## Installation

1. Install Foundry
2. forge install
3. cd typescript && yarn install

### Generate Solidity Contract

```cd circuits && nargo contract && mv ./contract/plonk_vk.sol ../src/plonk_vk.sol```

### Deploy Contract

```forge create plonk_vk.sol:TurboVerifier --rpc-url http://127.0.0.1:8545 --private-key ```

### Fill in Env variables

```
VERIFIER_CONTRACT_ADDR=""
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://127.0.0.1:8545"
```

### Run script

```
cd typescript && yarn ts-node index.ts --input {field_element}
```
