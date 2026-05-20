import { ethers } from "ethers";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.MEECHAIN_RPC_URL || "https://rpc.meechain.live"
  );

  if (!process.env.PRIVATEKEY) {
    throw new Error("Missing PRIVATEKEY in env");
  }

  const wallet = new ethers.Wallet(process.env.PRIVATEKEY, provider);
  console.log("Using account:", wallet.address);

  const contractAddress = process.env.TOKEN_ADDRESS || "0xYourTokenAddressHere";
  if (contractAddress === "0xYourTokenAddressHere") {
    throw new Error("Set TOKEN_ADDRESS in your env before running this script");
  }

  const abi = ["function totalSupply() view returns (uint256)"];
  const token = new ethers.Contract(contractAddress, abi, wallet);
  const supply = await token.totalSupply();
  console.log("Total Supply:", supply.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
