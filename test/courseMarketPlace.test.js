const CourseMarketplace = artifacts.require("CourseMarketplace")

async function tx_gas_fees_async(tx_result) {
  const tx = await web3.eth.getTransaction(tx_result.tx);

  const gas_used = web3.utils.toBN(tx_result.receipt.gasUsed);
  const gas_price = web3.utils.toBN(tx.gasPrice);
  const gas_fees = gas_used.mul(gas_price);

  return gas_fees;
}

async function try_catch(promise, message = "Expected an error but did not get one") {
  try {
    await promise;
    throw null;
  }
  catch (error) {
    assert(error, message);
  }
};

const toBN = value => web3.utils.toBN(value);

contract("CourseMarketplace", accounts => {

  const course_id = "0x00000000000000000000000000003130";
  const proof = "0x0000000000000000000000000031300000000000000000000000000000003130";

  const course_id_2 = "0x00000000000000000000000000002130";
  const proof_2 = "0x0000000000000000000000000021300000000000000000000000000000002130";

  const value_wei = "10";

  let contract = null;
  let owner = null;
  let buyer = null;
  let course_hash;

  before(async () => {
    contract = await CourseMarketplace.deployed();
    owner = accounts[0];
    buyer = accounts[1];
  });

  describe("Purchase new course", () => {

    before(async () => {
      await contract.purchase(course_id, proof, {
        from: buyer,
        value: value_wei
      });

      course_hash = await contract.get_course_hash_at_index(0);
    });

    it("should not allow to repurchase owned course", async () => {
      try {
        await contract.purchase(course_id, proof, {
          from: buyer,
          value: value_wei
        });
        throw null;
      } catch (error) {
        assert(error, "Expected an error");
      }
    })

    it("can get course hash by index", async () => {

      const expected_hash = web3.utils.soliditySha3(
        { type: "bytes16", value: course_id },
        { type: "address", value: buyer }
      );

      assert.strictEqual(course_hash, expected_hash, "hashes should be equal");
    });

    it("should match the purchased data of the course", async () => {
      const expected_index = "0";
      const expected_state = "0";

      const course = await contract.get_course_by_hash(course_hash);

      assert.strictEqual(course.id, expected_index, "course index should be 0");
      assert.strictEqual(course.price, value_wei);
      assert.strictEqual(course.proof, proof);
      assert.strictEqual(course.owner, buyer);
      assert.strictEqual(course.state.expected_state);
    });
  });

  describe("Activate the purchased course", () => {

    it("not owner can't activate course", async () => {
      try {
        await contract.activate_course(course_hash, { from: buyer });
        throw null;
      }
      catch (error) {
        assert(error, "Expected an error");
      }

    })

    it("should activate course", async () => {
      await contract.activate_course(course_hash, { from: owner });
      const course = await contract.get_course_by_hash(course_hash);
      const expected_state = "1";

      assert.strictEqual(course.state, expected_state);
    })

  });

  describe("Transfer ownership", () => {

    it("owner can transfer ownership", async () => {
      await contract.transfer_ownership(buyer);
      const new_owner = await contract.owner();

      assert.strictEqual(new_owner, buyer);
      await contract.transfer_ownership(owner, { from: buyer });
    });

    it("not owner can't transfer ownership", async () => {
      try {
        await contract.transfer_ownership(accounts[4], { from: accounts[5] })
        throw null;
      }
      catch (error) {
        assert(error, "Expected an error");
      }
    })
  });

  describe("deactivate course", () => {
    let course_hash_2 = null;
    let current_owner = null;

    before(async () => {
      await contract.purchase(course_id_2, proof_2, {
        from: buyer,
        value: value_wei
      });

      course_hash_2 = await contract.get_course_hash_at_index(1);
      current_owner = await contract.owner();
    });

    it("should not be able to deactivate course by not contract owner", async () => {

      try {
        await contract.deactivate_course(course_hash_2, { from: buyer });
        throw null;
      }
      catch (error) {
        assert(error, "Expected an error");
      }
    });

    it("should have status of deactivated and price 0", async () => {
      const before_buyer_balance = await web3.eth.getBalance(buyer);
      const before_contract_balance = await web3.eth.getBalance(contract.address);
      const before_owner_balance = await web3.eth.getBalance(current_owner);

      const tx_res = await contract.deactivate_course(course_hash_2, { from: current_owner });

      const after_buyer_balance = await web3.eth.getBalance(buyer);
      const after_contract_balance = await web3.eth.getBalance(contract.address);
      const after_owner_balance = await web3.eth.getBalance(current_owner);

      const course = await contract.get_course_by_hash(course_hash_2);

      assert.strictEqual(course.state, "2", "Incorrect state");
      assert.strictEqual(course.price, "0", "Incorrect price");

      assert.equal(
        web3.utils
          .toBN(before_buyer_balance)
          .add(web3.utils.toBN(value_wei))
          .toString(),
        after_buyer_balance,
        "client balance is incorrect");

      assert.equal(
        web3.utils
          .toBN(before_contract_balance)
          .sub(web3.utils.toBN(value_wei))
          .toString(),
        after_contract_balance,
        "contract balance is incorrect");

      const gas_fees = await tx_gas_fees_async(tx_res);

      assert.equal(
        web3.utils
          .toBN(before_owner_balance)
          .sub(web3.utils.toBN(gas_fees))
          .toString(),
        after_owner_balance,
        "owner balance is incorrect");
    });

    it("should not be able to activate deactivated course", async () => {
      try {
        await contract.activate_course(course_hash_2, { from: owner });
        throw null;
      }
      catch (error) {
        assert(error, "Expected an error");
      }

    });
  })

  describe("Repurchase course", () => {
    let couse_hash_2 = null

    before(async () => {
      couse_hash_2 = await contract.get_course_hash_at_index(1)
    })

    it("should NOT repurchase when the course doesn't exist", async () => {
      const non_existing_hash = "0x5ceb3f8075c3dbb5d490c8d1e6c950302ed065e1a9031750ad2c6513069e3fc3"
      await try_catch(contract.repurchase_course(non_existing_hash, { from: buyer }));
    });

    it("should NOT repurchase with NOT course owner", async () => {
      await try_catch(contract.repurchase_course(couse_hash_2, { from: accounts[2] }))
    })

    it("should be able repurchase with the original buyer", async () => {
      const before_buyer_balance = await web3.eth.getBalance(buyer);
      const before_contract_balance = await web3.eth.getBalance(contract.address);

      const tx_result = await contract.repurchase_course(couse_hash_2, { from: buyer, value: value_wei });

      const after_buyer_balance = await web3.eth.getBalance(buyer);
      const after_contract_balance = await web3.eth.getBalance(contract.address);

      const gas_fees = await tx_gas_fees_async(tx_result);

      assert.equal(
        web3.utils
          .toBN(before_buyer_balance)
          .sub(web3.utils.toBN(value_wei))
          .sub(gas_fees)
          .toString(),
        after_buyer_balance,
        "client balance is incorrect");

      const course = await contract.get_course_by_hash(couse_hash_2)
      const exptectedState = 0;

      assert.equal(course.state, exptectedState, "The course is not in purchased state")
      assert.equal(course.price, value_wei, `The course price is not equal to ${value_wei}`);

      assert.equal(
        web3.utils
          .toBN(before_contract_balance)
          .add(web3.utils.toBN(value_wei))
          .toString(),
        after_contract_balance,
        "contract balance is incorrect");
    })

    it("should NOT be able to repurchase purchased course", async () => {
      await try_catch(contract.repurchase_course(couse_hash_2, { from: buyer }))
    })

  });

  describe("Receive funds", () => {

    it("Should have funds adter tx", async () => {

      const before_balance = await web3.eth.getBalance(contract.address);

      await web3.eth.sendTransaction({
        from: buyer,
        to: contract.address,
        value: value_wei
      });

      const after_balance = await web3.eth.getBalance(contract.address);

      assert.equal(
        web3.utils
          .toBN(before_balance)
          .add(web3.utils.toBN(value_wei))
          .toString(),
        after_balance,
        "contract balance is incorrect");
    });
  });

  describe("Normal withdraw", () => {
    const funds_to_deposit = "100000000000000000"
    const over_limit_funds = "999999000000000000000"
    let current_owner = null

    before(async () => {
      current_owner = await contract.owner()

      await web3.eth.sendTransaction({
        from: buyer,
        to: contract.address,
        value: funds_to_deposit
      })
    })

    it("should fail when withdrawing with NOT owner address", async () => {
      const value = "10000000000000000"
      await try_catch(contract.withdraw(value, { from: buyer }))
    })

    it("should fail when withdrawing OVER limit balance", async () => {
      await try_catch(contract.withdraw(over_limit_funds, { from: current_owner }))
    })

    it("should have +0.1ETH after withdraw", async () => {
      const owner_balance = await web3.eth.getBalance(current_owner)
      const result = await contract.withdraw(funds_to_deposit, { from: current_owner })
      const new_owner_balance = await web3.eth.getBalance(current_owner)
      const gas = await tx_gas_fees_async(result);

      assert.equal(
        web3.utils.toBN(owner_balance)
          .add(web3.utils.toBN(funds_to_deposit))
          .sub(web3.utils.toBN(gas))
          .toString(),
        new_owner_balance,
        "The new owner balance is not correct!"
      );


    });
  });

  describe("Emergency withdraw", () => {
    let current_owner;

    before(async () => {
      current_owner = await contract.owner()
    })

    after(async () => {
      await contract.unpause_contract({ from: current_owner })
    })

    it("should fail when contract is NOT stopped", async () => {
      await try_catch(contract.emergency_withdraw({ from: current_owner }))
    })

    it("should have +contract funds on contract owner", async () => {
      await contract.pause_contract({ from: current_owner })

      const contract_balance = await web3.eth.getBalance(contract.address)
      const owner_balance = await web3.eth.getBalance(current_owner)

      const result = await contract.emergency_withdraw({ from: current_owner })
      const gas = await tx_gas_fees_async(result)

      const new_owner_balance = await web3.eth.getBalance(current_owner)

      assert.equal(
        toBN(owner_balance)
        .add(toBN(contract_balance))
        .sub(gas),
        new_owner_balance,
        "Owner doesn't have contract balance"
      )
    })

    it("should have contract balance of 0", async () => {
      const contract_balance = await web3.eth.getBalance(contract.address)

      assert.equal(
        contract_balance,
        0,
        "Contract does't have 0 balance"
      )
    })
  })

  describe("Self Destruct", () => {
    let current_owner

    before(async () => {
      current_owner = await contract.owner()
    })

    it("should fail when contract is NOT stopped", async () => {
      await try_catch(contract.self_destruct({ from: current_owner }))
    })

    it("should have +contract funds on contract owner", async () => {
      await contract.pause_contract({ from: current_owner })

      const contract_balance = await web3.eth.getBalance(contract.address)
      const owner_balance = await web3.eth.getBalance(current_owner)

      const result = await contract.self_destruct({ from: current_owner })
      const gas = await tx_gas_fees_async(result)

      const new_owner_balance = await web3.eth.getBalance(current_owner)

      assert.equal(
        toBN(owner_balance)
        .add(toBN(contract_balance))
        .sub(gas),
        new_owner_balance,
        "Owner doesn't have contract balance"
      )
    })

    it("should have contract balance of 0", async () => {
      const contract_balance = await web3.eth.getBalance(contract.address)

      assert.equal(
        contract_balance,
        0,
        "Contract does't have 0 balance"
      )
    })

    it("should have 0x bytecode", async () => {
      const code = await web3.eth.getCode(contract.address)

      assert.equal(
        code,
        "0x",
        "Contract is not destroyed"
      )
    })
  })
});