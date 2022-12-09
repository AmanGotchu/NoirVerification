var parseArgs = require("minimist");
import { execSync } from "child_process";
import dotenv from "dotenv";
import { ethers, utils } from "ethers";
import { writeFileSync, readFileSync } from "fs";

function generateProofInputFile(fieldElement: number) {
  console.log("Generating proof input file");
  const proofInputFile = `../circuits/Prover.toml`;
  const proofInput = `input = ${fieldElement}\nreturn = ""`;
  writeFileSync(proofInputFile, proofInput);
}

function generateProof(fieldElement: number): Buffer {
  console.log("Generating proof", fieldElement);

  const nargoProof = `cd ../circuits && nargo prove ${fieldElement}`;
  execSync(nargoProof);

  const proofData = readFileSync(`../circuits/proofs/${fieldElement}.proof`);
  return Buffer.from(proofData.toString(), "hex");
}

// This is a hack. We should be able to read the proof execution
// output from Noir Typescript wrapper, but currently unavailable.
// TODO(aman): Modify script to use Noir Typescript wrapper instead of
// Noir CLI command.
function extractVerifierData(): { [key: string]: string } {
  console.log("Extracting verifier result from proof execution.");

  // Read the VDF output from the Verifier.toml
  const verifierLines = readFileSync("../circuits/Verifier.toml", "utf8").split(
    "\n"
  );

  const res: { [key: string]: string } = {};
  for (const line of verifierLines) {
    const lineItems = line.replace(/"/g, "").split(" = ");
    res[lineItems[0]] = lineItems[1];
  }

  return res;
}

async function submitProofTx(
  signer: ethers.Wallet,
  proof: Buffer,
  pubInputs: Buffer
) {
  console.log("Submitting proof transaction!");

  const verifierContract = new ethers.Contract(
    process.env.VERIFIER_CONTRACT_ADDR!,
    new ethers.utils.Interface([
      // "function verify(bytes calldata, bytes calldata) public view returns (bool)",
      "function verify(bytes calldata, bytes calldata) public view returns (bool)",
    ]),
    signer
  );

  // Takes a byte array!
  console.log("Sending proof for verification!", proof);
  console.log("Pub inputs", pubInputs);
  const verifiedResult = await verifierContract.verify(proof, pubInputs);
  return verifiedResult;
}

async function main() {
  // Example: yarn ts-node index.ts --blockhash
  let { input } = parseArgs(process.argv.slice(2), {
    string: ["input"],
  });
  if (!input) {
    throw new Error("Supply valid integer arguments: input");
  }

  console.log("Generating and submitting proof for input: ", input);

  // Setup env.
  dotenv.config({
    path: "./.env",
  });

  // Instantiate Ethereum provider & signer.
  const provider = new ethers.providers.StaticJsonRpcProvider(
    process.env.RPC_URL!
  );
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!).connect(provider);

  // Generate proof input file.
  generateProofInputFile(input);

  // Generate proof.
  const proof = generateProof(input);
  console.log("Proof", proof);

  // Proof function return value.
  const verifierData = extractVerifierData();
  const verifierInput = verifierData["input"];
  const verifierReturn = verifierData["return"];

  const abiCoder = new utils.AbiCoder();
  let encodedPubInputs = abiCoder.encode(
    ["uint256", "uint256"],
    [verifierInput, verifierReturn]
  );

  const res = await submitProofTx(
    signer,
    proof,
    Buffer.from(encodedPubInputs.slice(2), "hex")
  );
  console.log("Submission res", res);

  process.exit(0);
}

main();
