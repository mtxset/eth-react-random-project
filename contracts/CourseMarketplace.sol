// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract CourseMarketplace {
  enum State {
    Purchased,
    Activated,
    Deactivaed
  }

  struct Course {
    uint id;
    uint price;
    bytes32 proof;
    address owner;
    State state;
  }

  // mapping of course hash to course data
  mapping(bytes32 => Course) private owned_courses;

  // course id to course hash
  mapping(uint => bytes32) private owned_courses_hash;

  uint public total_owned_courses;
  address payable public owner;

  bool public paused;

  constructor() {
    owner = payable(msg.sender);
  }
  
  /// Course has already an owner
  error CourseHasOwner();

  /// Sender Is Not Course Owner
  error SenderIsNotCourseOwner();

  /// Course should be created before used
  error CourseIsNotCreated();

  /// Course state should purchased before it can be activated
  error InvalidState();

  modifier only_owner() {
    require (msg.sender == owner);
    _;
  }

  function get_course_hash_at_index(uint index)
  external view
  returns (bytes32) {
    return owned_courses_hash[index];
  }

  function get_course_by_hash(bytes32 course_hash)
  external view
  returns (Course memory) {
    return owned_courses[course_hash];
  }

  function purchase(bytes16 course_id, bytes32 proof) 
  external payable 
  when_not_paused {
    // course id - 10
    // 10 ascii to hex - 31 30
    // 16 bytes (1 byte 2 chars)  - 0x00000000000000000000000000003130
    // 32 bytes proof - 0x0000000000000000000000000031300000000000000000000000000000003130
    // msg.sender - 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
    // both - 000000000000000000000000000031305B38Da6a701c568545dCfcB03FcB875f56beddC4
    // keccak256 - c4eaa3558504e2baa2669001b43f359b8418b44a4477ff417b4b007d7cc86e37
    bytes32 course_hash = keccak256(abi.encodePacked(course_id, msg.sender));

    if (owned_courses[course_hash].owner == msg.sender) {
      revert CourseHasOwner();     
    }

    uint id = total_owned_courses++;
    owned_courses_hash[id] = course_hash;

    // 0 => 0xc4eaa3558504e2baa2669001b43f359b8418b44a4477ff417b4b007d7cc86e37
    owned_courses[course_hash] = Course({
      id: id,
      price: msg.value,
      proof: proof,
      owner: msg.sender,
      state: State.Purchased
    });
  }

  function repurchase_course(bytes32 course_hash)
  external payable 
  when_not_paused {

    if (!is_course_created(course_hash)) {
      revert CourseIsNotCreated();
    } 
    
    if (!has_courses_ownership(course_hash)) {
      revert SenderIsNotCourseOwner();
    }

    Course storage course = owned_courses[course_hash];

    if (course.state != State.Deactivaed) {
      revert InvalidState();
    }

    course.state = State.Purchased;
    course.price = msg.value;
  }

  function activate_course(bytes32 course_hash)
  external
  only_owner when_not_paused
  {

    if (owned_courses[course_hash].owner == address(0x0)) {
      revert CourseIsNotCreated();
    }
    
    Course storage course = owned_courses[course_hash];

    if (course.state != State.Purchased) {
      revert InvalidState();
    }

    course.state = State.Activated;
  }

  function deactivate_course(bytes32 course_hash) 
  external
  only_owner when_not_paused
  {

    if (owned_courses[course_hash].owner == address(0x0)) {
      revert CourseIsNotCreated();
    }
    
    Course storage course = owned_courses[course_hash];

    if (course.state != State.Purchased) {
      revert InvalidState();
    }

    (bool success, ) = course.owner.call{value: course.price}("");
    require(success, "Could not transfer funds");
    
    course.state = State.Deactivaed;
    course.price = 0;
  }
  
  function pause_contract()
  external
  only_owner when_not_paused {
    paused = true;
  }

  function unpause_contract()
  external
  only_owner when_paused {
    paused = false;
  }

  modifier when_not_paused() {
    require(!paused, "Pausable: paused");
    _;
  }
  
  modifier when_paused() {
    require(paused, "Pausable: not paused");
    _;
  }

  function is_course_created(bytes32 couse_hash) 
  private view
  returns (bool) {
    return owned_courses[couse_hash].owner != address(0x0);
  }

  function has_courses_ownership(bytes32 couse_hash)
  private view
  returns (bool) {
    return owned_courses[couse_hash].owner == msg.sender;
  }

  function transfer_ownership(address new_owner)
  only_owner
  external {
    owner = payable(new_owner);
  }

  receive()
  external payable {}

  function withdraw(uint amount)
  external
  only_owner {
    owner.transfer(amount);
  }

  function emergency_withdraw()
  external
  only_owner when_paused {
    owner.transfer(address(this).balance);
  }

  function self_destruct() 
  external
  only_owner when_paused {
    selfdestruct(owner);
  }
}