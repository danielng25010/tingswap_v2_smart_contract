import { expect } from "chai";
import { TingswapV2Factory, TingswapV2Pair } from "../../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { getCreate2Address } from "./shared/utilities";
import { ethers } from "hardhat";

const TEST_ADDRESSES: [string, string] = [
  "0x1000000000000000000000000000000000000000",
  "0x2000000000000000000000000000000000000000",
];

describe("TingswapV2Factory", () => {
  async function fixture() {
    const tmp = await ethers.getContractFactory("TingswapV2Factory");
    const [wallet, other] = await ethers.getSigners();
    const factory = await tmp.deploy(wallet.address);
    return { factory, wallet, other };
  }

  it("feeTo, feeToSetter, allPairsLength", async () => {
    const { factory, wallet } = await loadFixture(fixture);
    expect(await factory.feeTo()).to.eq(ethers.ZeroAddress);
    expect(await factory.feeToSetter()).to.eq(wallet.address);
    expect(await factory.allPairsLength()).to.eq(0);
  });

  async function createPair(
    factory: TingswapV2Factory,
    tokens: [string, string],
  ) {
    const pairContract = await ethers.getContractFactory("TingswapV2Pair");
    const factoryAddress = await factory.getAddress();
    const create2Address = getCreate2Address(
      factoryAddress,
      tokens,
      pairContract.bytecode,
    );
    await expect(factory.createPair(tokens[0], tokens[1]))
      .to.emit(factory, "PairCreated")
      .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, 1);
    await expect(factory.createPair(tokens[0], tokens[1])).to.be.reverted; // TingswapV2: PAIR_EXISTS
    await expect(factory.createPair(tokens[1], tokens[0])).to.be.reverted; // TingswapV2: PAIR_EXISTS
    expect(await factory.getPair(tokens[0], tokens[1])).to.eq(create2Address);
    expect(await factory.getPair(tokens[1], tokens[0])).to.eq(create2Address);
    expect(await factory.allPairs(0)).to.eq(create2Address);
    expect(await factory.allPairsLength()).to.eq(1);

    const pair = pairContract.attach(create2Address) as TingswapV2Pair;
    expect(await pair.factory()).to.eq(factoryAddress);
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0]);
    expect(await pair.token1()).to.eq(TEST_ADDRESSES[1]);
  }

  it("Pair:codeHash", async () => {
    const { factory } = await loadFixture(fixture);
    const codehash = await factory.PAIR_HASH();
    const pair = await ethers.getContractFactory("TingswapV2Pair");
    expect(ethers.keccak256(pair.bytecode)).to.be.eq(codehash);
    console.log(codehash)
    // expect(codehash).to.be.eq(
    //   "0x443533a897cfad2762695078bf6ee9b78b4edcda64ec31e1c83066cee4c90a7e",
    // );
  });

  it("createPair", async () => {
    const { factory } = await loadFixture(fixture);
    await createPair(factory, [...TEST_ADDRESSES]);
  });

  it("createPair:reverse", async () => {
    const { factory } = await loadFixture(fixture);
    await createPair(
      factory,
      TEST_ADDRESSES.slice().reverse() as [string, string],
    );
  });

  it("createPair:gas", async () => {
    const { factory } = await loadFixture(fixture);
    const tx = await factory.createPair(...TEST_ADDRESSES);
    const receipt = await tx.wait();
    expect(receipt!.gasUsed).to.eq(2356517);
  });

  it("setFeeTo", async () => {
    const { factory, wallet, other } = await loadFixture(fixture);
    await expect(
      factory.connect(other).setFeeTo(other.address),
    ).to.be.revertedWith("TingswapV2: FORBIDDEN");
    await factory.setFeeTo(wallet.address);
    expect(await factory.feeTo()).to.eq(wallet.address);
  });

  it("setFeeToSetter", async () => {
    const { factory, wallet, other } = await loadFixture(fixture);
    await expect(
      factory.connect(other).setFeeToSetter(other.address),
    ).to.be.revertedWith("TingswapV2: FORBIDDEN");
    await factory.setFeeToSetter(other.address);
    expect(await factory.feeToSetter()).to.eq(other.address);
    await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith(
      "TingswapV2: FORBIDDEN",
    );
  });
});
