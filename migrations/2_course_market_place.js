const Contract = artifacts.require("CourseMarketplace");

module.exports = function (deployer) {
  deployer.deploy(Contract);
};
