"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var parseArgs = require("minimist");
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const fs_1 = require("fs");
function generateProofInputFile(fieldElement) {
    console.log("Generating proof input file");
    const proofInputFile = `../circuits/Prover.toml`;
    const proofInput = `input = ${fieldElement}\nreturn = ""`;
    (0, fs_1.writeFileSync)(proofInputFile, proofInput);
}
function generateProof(fieldElement) {
    console.log("Generating proof", fieldElement);
    const nargoProof = `cd ../circuits && nargo prove ${fieldElement}`;
    (0, child_process_1.execSync)(nargoProof);
    const proofData = (0, fs_1.readFileSync)(`../circuits/proofs/${fieldElement}.proof`);
    return Buffer.from(proofData.toString(), "hex");
}
// This is a hack. We should be able to read the proof execution
// output from Noir Typescript wrapper, but currently unavailable.
// TODO(aman): Modify script to use Noir Typescript wrapper instead of
// Noir CLI command.
function extractVerifierData() {
    console.log("Extracting verifier result from proof execution.");
    // Read the VDF output from the Verifier.toml
    const verifierLines = (0, fs_1.readFileSync)("../circuits/Verifier.toml", "utf8").split("\n");
    const res = {};
    for (const line of verifierLines) {
        const lineItems = line.replace(/"/g, "").split(" = ");
        res[lineItems[0]] = lineItems[1];
    }
    return res;
}
function submitProofTx(signer, proof, pubInputs) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Submitting proof transaction!");
        const verifierContract = new ethers_1.ethers.Contract(process.env.VERIFIER_CONTRACT_ADDR, new ethers_1.ethers.utils.Interface([
            // "function verify(bytes calldata, bytes calldata) public view returns (bool)",
            "function verify(bytes calldata, bytes calldata) public view returns (bool)",
        ]), signer);
        // Takes a byte array!
        console.log("Sending proof for verification!", proof);
        console.log("Pub inputs", pubInputs);
        let fullProof = Buffer.concat([pubInputs, proof]);
        const verifiedResult = yield verifierContract.verify(fullProof);
        return verifiedResult;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Example: yarn ts-node index.ts --blockhash
        let { input } = parseArgs(process.argv.slice(2), {
            string: ["input"],
        });
        if (!input) {
            throw new Error("Supply valid integer arguments: input");
        }
        console.log("Generating and submitting proof for input: ", input);
        // Setup env.
        dotenv_1.default.config({
            path: "./.env",
        });
        // Instantiate Ethereum provider & signer.
        const provider = new ethers_1.ethers.providers.StaticJsonRpcProvider(process.env.RPC_URL);
        const signer = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);
        // Generate proof input file.
        generateProofInputFile(input);
        // Generate proof.
        const proof = generateProof(input);
        console.log("Proof", proof);
        // Proof function return value.
        const verifierData = extractVerifierData();
        const verifierInput = verifierData["input"];
        const verifierReturn = verifierData["return"];
        const abiCoder = new ethers_1.utils.AbiCoder();
        let encodedPubInputs = abiCoder.encode(["uint256", "uint256"], [verifierInput, verifierReturn]);
        const res = yield submitProofTx(signer, proof, Buffer.from(encodedPubInputs.slice(2), "hex"));
        console.log("Submission res", res);
        process.exit(0);
    });
}
main();
