const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { expect } = require("chai")
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
        it("Sets the owner address correctly", async () => {
          expect(await toyToken.getOwner()).to.equal(owner)
        })
      })

      describe("randomEtherToToy", async () => {
        it("Able to buy some tokens", async () => {
          const sendValue = ethers.utils.parseEther("1") // 1 ETH
          const [owner, someAccount] = await ethers.getSigners()
          const someAccountConnectedContract = await toyToken.connect(
            someAccount
          )
          const startingAccountTokenBalance = await toyToken.balanceOf(
            someAccount.address
          )
          await someAccountConnectedContract.randomEtherToToy({
            value: sendValue,
          })
          const endingAccountTokenBalance = await toyToken.balanceOf(
            someAccount.address
          )
          expect(startingAccountTokenBalance).to.equal(0)
          expect(endingAccountTokenBalance).to.be.not.equal(0)
        })
        it("Does not allows sending no ethers", async () => {
          await expect(
            toyToken.randomEtherToToy({ value: 0 })
          ).to.be.revertedWith("ToyToken__NoEthSent")
        })
        it("Reverts when to much tokens are bought", async () => {
          const sendValue = ethers.utils.parseEther("1000")
          await expect(
            toyToken.randomEtherToToy({ value: sendValue })
          ).to.be.revertedWith("ToyToken__NotEnoughTokens")
        })
      })

      describe("withdraw", async () => {
        const sendValue = ethers.utils.parseEther("1") // 1 ETH

        beforeEach(async function () {
          await toyToken.randomEtherToToy({ value: sendValue })
        })

        it("Withdraw ETH from the owner", async () => {
          // Arrange
          const startingToyTokenBalance = await toyToken.provider.getBalance(
            toyToken.address
          )
          const startingOwnerBalance = await toyToken.provider.getBalance(owner)
          // Act
          const transactionResponse = await toyToken.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)
          const endingToyTokenBalance = await toyToken.provider.getBalance(
            toyToken.address
          )
          const endingOwnerBalance = await toyToken.provider.getBalance(owner)

          // Assert
          expect(endingToyTokenBalance).to.equal(0)
          expect(
            startingToyTokenBalance.add(startingOwnerBalance).toString()
          ).to.equal(endingOwnerBalance.add(gasCost).toString())
        })

        it("Only allows the owner to withdraw", async () => {
          const [owner, someAccount] = await ethers.getSigners()
          const someAccountConnectedContract = await toyToken.connect(
            someAccount
          )
          await expect(
            someAccountConnectedContract.withdraw()
          ).to.be.revertedWith("ToyToken__NotOwner")
        })
      })
    })
