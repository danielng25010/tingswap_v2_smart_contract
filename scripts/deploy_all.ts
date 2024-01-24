import * as hre from "hardhat";
import * as fs from "fs";
import { Signer } from "ethers";
const ethers = hre.ethers;
// import { Config } from "./config";
import type { BaseContract, ContractFactory } from 'ethers';

async function main() {
    //Loading accounts
    const accounts: Signer[] = await ethers.getSigners();
    const deployer = await accounts[0].getAddress();
    //Loading contracts' factory

    const TingswapV2Factory : ContractFactory = await ethers.getContractFactory(
        "TingswapV2Factory",
    );
    const TingswapV2Router : ContractFactory = await ethers.getContractFactory(
        "TingswapV2Router",
    );
    const WETH9 : ContractFactory = await ethers.getContractFactory(
        "WETH9",
    );

    // Deploy contracts
    console.log(
        "==================================================================",
    );
    console.log("DEPLOY CONTRACTS");
    console.log(
        "==================================================================",
    );

    console.log("ACCOUNT: " + deployer);

    const wETH9: BaseContract = await WETH9.deploy();
    await wETH9.waitForDeployment();

    const tingswapV2Factory: BaseContract = await TingswapV2Factory.deploy(deployer);
    await tingswapV2Factory.waitForDeployment();
    
    const tingswapV2Router: BaseContract = await TingswapV2Router.deploy(tingswapV2Factory.getAddress(), wETH9.getAddress());
    await tingswapV2Router.waitForDeployment();

    console.log("WETH9 deployed at: ", await wETH9.getAddress());
    console.log("TingswapV2Factory deployed at: ", await tingswapV2Factory.getAddress());
    console.log("TingswapV2Router deployed at: ", await tingswapV2Router.getAddress());

    const contractAddress = {
        WETH9: await wETH9.getAddress(),
        TingswapV2Factory: await tingswapV2Factory.getAddress(),
        TingswapV2Router: await tingswapV2Router.getAddress(),
    };

    fs.writeFileSync("contracts.json", JSON.stringify(contractAddress));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });