import { CourseCard, CourseList } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { get_all_courses } from "content/courses/fetcher";
import { useOwnedCourses, useWalletInfo } from "@components/hooks/web3";
import { Button, Loader, Message } from "@components/ui/common";
import { OrderModal } from "@components/ui/order";
import { useState } from "react";
import Header from "@components/ui/marketplace/header";
import { useWeb3 } from "@components/providers";

import { with_toast } from "@utils/utils";

export default function Marketplace({ courses }) {
  const { has_connected_wallet, account, is_connecting } = useWalletInfo();
  const { ownedCourses } = useOwnedCourses(courses, account.data);
  const { web3, contract, require_install } = useWeb3();

  const [selected_course, set_selected_course] = useState(null);
  const [is_new_purcahse, set_is_new_purchase] = useState(true);
  const [busy_course_id, set_busy_course_id] = useState(null);

  async function handle_purchase_order(order, course) {

    // taking first course id: 1410474
    // to hex: 0x31343130343734
    const hex_course_id = web3.utils.utf8ToHex(course.id);

    const order_hash = web3.utils.soliditySha3(
      { type: "bytes16", value: hex_course_id },
      { type: "address", value: account.data }
    );

    // bytes16: -> 0x31343130343734 -> 0x31343130343734000000000000000000
    // address: -> bytes20          -> 0xa24c85E70D1d40e3E5456fDC58643CcD81E2d70E

    // sha3(bytes16(course_id)+address(address))
    // sha3(31343130343734000000000000000000a24c85E70D1d40e3E5456fDC58643CcD81E2d70E)

    // order_hash = 8a2d829b7918a4c2ba6867dbc1de3cd109b36b06fb03686a9fd9e0f2f145ee83

    const price_value = web3.utils.toWei(String(order.price));

    set_busy_course_id(course.id);

    let promise = null;
    if (is_new_purcahse) {
      const email_hash = web3.utils.sha3(order.email);
      // email -> sha3("gensatus@gmail.com") -> 0x6122055d74730c3b80a9adc4a4808a9ba7b3a90385818474b97503c81f524b52

      const proof = web3.utils.soliditySha3(
        { type: "bytes32", value: email_hash },
        { type: "bytes32", value: order_hash },
      );

      // bytes32: -> email_hash (already in 32 bytes)
      // bytes32: -> order_hash (already in 32 bytes)

      // sha3(bytes32(email_hash)+bytes32(order_hash))
      // sha3(6122055d74730c3b80a9adc4a4808a9ba7b3a90385818474b97503c81f524b528a2d829b7918a4c2ba6867dbc1de3cd109b36b06fb03686a9fd9e0f2f145ee83)
      // proof = d6ec1b5e5bbb389322bebaa58b78e822633f2781cd9b6c8fb0a8e3833ec3b3a2
      promise = purchase_course(hex_course_id, proof, price_value, course);

    } else {
      promise = repurchase_course(order_hash, price_value, course);
    }

    with_toast(promise);
  }

  async function repurchase_course(order_hash, price_value, course) {
    try {
      const result = await contract.methods.repurchase_course(order_hash).send({
        from: account.data,
        value: price_value
      });
      const index = ownedCourses.data.findIndex(x => x.id === course.id);

      if (index >= 0) {
        ownedCourses.data[index].state = "purchased";
        ownedCourses.mutate(ownedCourses.data);
      }
      else {
        ownedCourses.mutate();
      }

      return result;
    }
    catch (e) {
      throw new Error(e.message);
    }
    finally {

    }
  }

  async function purchase_course(hex_course_id, proof, price_value, course) {
    try {
      const result = await contract.methods.purchase(hex_course_id, proof).send({
        from: account.data,
        value: price_value
      });

      ownedCourses.mutate([
        ...ownedCourses.data, {
          ...course,
          proof,
          state: "purchased",
          owner: account.data,
          price: price_value
        }
      ]);

      return result;
    }
    catch (e) {
      throw new Error(e.message);
    }
    finally {
      set_busy_course_id(null);
    }
  }

  function state_button(owned, course, is_busy) {
    return (
      <>
        <div className="flex">
          <Button
            size="sm"
            disabled={true}
            variant="white">
            Owned &#10004;
          </Button>
          {owned.state === "deactivated" &&
            <div className="ml-1">
              <Button
                size="sm"
                disabled={is_busy}
                onClick={() => {
                  set_is_new_purchase(false),
                    set_selected_course(course)
                }}
                variant="purple">
                {is_busy ?
                  <div className="flex">
                    <Loader size="sm"></Loader>
                    <div className="ml-2">In progress</div>
                  </div> : <div>Fund it</div>}
              </Button>
            </div>
          }
        </div>
      </>
    );
  }

  function notify() {
    const timeout_ms = 1500;
    const resolve = new Promise(
      (resolve, reject) => setTimeout(() => resolve({
        tx_hash: "0xe55fdad042fceeeb7e8fabd5839328263a2e10779fc8d632b4e09ecebe5d2b29"
      }), timeout_ms)
    );

    with_toast(resolve);
  }

  return (
    <>

      <Header />
      <button onClick={notify}>Notify!</button>
      <CourseList
        courses={courses}>
        {
          (course) => {
            const owned = ownedCourses.lookup[course.id];
            return (
              <CourseCard
                disabled={!has_connected_wallet}
                key={course.id}
                state={owned?.state}
                course={course}
                Footer={() => {

                  if (require_install) {
                    return (
                      <Button
                        size="sm"
                        disabled={true}
                        variant="light_purple">
                        Install
                      </Button>
                    )
                  }

                  if (is_connecting) {
                    return (
                      <Button
                        size="sm"
                        disabled={true}
                        variant="light_purple">
                        <Loader size="sm" />
                      </Button>
                    )
                  }

                  if (!ownedCourses.has_init_response) {
                    return (
                      // <div style={{ height: "50px" }}></div>
                      <Button
                        variant="white"
                        disabled={true}
                        size="sm">{has_connected_wallet ? "Loading state.." : "Connect"}</Button>
                    )
                  }

                  const is_busy = busy_course_id === course.id;
                  if (owned) {
                    return state_button(owned, course, is_busy);
                  }

                  return (
                    <Button
                      size="sm"
                      onClick={() => { set_selected_course(course) }}
                      disabled={!has_connected_wallet || is_busy}
                      variant="light_purple">
                      {is_busy ?
                        <div className="flex">
                          <Loader size="sm"></Loader>
                          <div className="ml-2">In progress</div>
                        </div> : <div>Purchase</div>}
                    </Button>
                  )

                }
                }
              />)
          }}
      </CourseList>
      {selected_course &&
        <OrderModal
          is_new_purchase={is_new_purcahse}
          course={selected_course}
          onClose={() => {
            set_selected_course(null);
            set_is_new_purchase(true)
          }}
          onSubmit={(form_data, course) => handle_purchase_order(form_data, course)}
        />
      }

    </>
  )
}

export function getStaticProps() {
  const course_data = get_all_courses();

  return {
    props: {
      courses: course_data.data
    }
  }
}

Marketplace.Layout = BaseLayout