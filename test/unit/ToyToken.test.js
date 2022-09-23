const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("ToyToken", async function () {
      let toyToken, owner

      beforeEach(async function () {
        // deploy our contract using HardHat-deploy
        owner = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        toyToken = await ethers.getContract("ToyToken", owner)
      })

      describe("constructor", async () => {
        it("sets the owner address correctly", async () => {
          expect(await toyToken.getOwner()).to.equal(owner)
        })
      })
    })
