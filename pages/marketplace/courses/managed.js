import { useAdmin, useManagedCourses } from "@components/hooks/web3";
import { useWeb3 } from "@components/providers";
import { Button, Message } from "@components/ui/common";
import { CourseFilter, ManagedCourseCard } from "@components/ui/course";
import { BaseLayout } from "@components/ui/layout";
import { MarketHeader } from "@components/ui/marketplace";
import { normalize, with_toast } from "@utils/utils";
import { useEffect, useState } from "react";

const VerificationInput = ({ onVerify }) => {
  const [email, setEmail] = useState("")

  return (
    <div className="flex mr-2 relative rounded-md">
      <input
        value={email}
        onChange={({ target: { value } }) => setEmail(value)}
        type="text"
        name="account"
        id="account"
        className="w-96 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
        placeholder="0x2341ab..." />
      <Button
        onClick={() => {
          onVerify(email)
        }}
      >
        Verify
      </Button>
    </div>
  )
}

export default function ManagedCourses() {
  const [proofedOwnership, setProofedOwnership] = useState({});
  const [searched_course, set_searched_course] = useState(null);
  const [filter, set_filters] = useState({ state: "all" })

  const { web3, contract } = useWeb3();
  const { account } = useAdmin({ redirectTo: "/marketplace" });
  const { managedCourses } = useManagedCourses(account);

  const verifyCourse = (email, { hash, proof }) => {
    if (!email)
      return;
      
    const emailHash = web3.utils.sha3(email)
    const proofToCheck = web3.utils.soliditySha3(
      { type: "bytes32", value: emailHash },
      { type: "bytes32", value: hash }
    )

    proofToCheck === proof ?
      setProofedOwnership({
        ...proofedOwnership,
        [hash]: true
      }) :
      setProofedOwnership({
        ...proofedOwnership,
        [hash]: false
      })
  }

  if (!account.isAdmin) {
    return null
  }

  async function change_course_state_async(course_hash, method) {
    try {
      const result = await contract.methods[method](course_hash).send({ from: account.data });
      return result;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async function activate_course_async(course_hash) {
    const promise = change_course_state_async(course_hash, "activate_course");
    with_toast(promise);
  }

  async function deactivate_course_async(course_hash) {
    const promise = change_course_state_async(course_hash, "deactivate_course");
    with_toast(promise);
  }

  async function search_course_async(course_hash) {
    if (!course_hash)
      return;

    const reg = /[0-9A-Fa-f]{6}/g;

    if (!reg.test(course_hash) || course_hash.length !== 66) {
      alert("Invalid Hash");
      return;
    }

    const course = await contract.methods.get_course_by_hash(course_hash).call();
    if (course === 0x0000000000000000000000000000000000000000) {
      set_searched_course(null);
      return;
    }

    const normalized = normalize(web3)({ course_hash }, course);
    set_searched_course(normalized);
    console.log(normalized);
  }

  function render_card(course) {
    return (
      <ManagedCourseCard
        key={course.ownedCourseId}
        course={course}
      >
        <VerificationInput
          onVerify={email => {
            verifyCourse(email, {
              hash: course.hash,
              proof: course.proof
            })
          }}
        />
        {proofedOwnership[course.hash] &&
          <div className="mt-2">
            <Message>
              Verified!
            </Message>
          </div>
        }
        {proofedOwnership[course.hash] === false &&
          <div className="mt-2">
            <Message type="danger">
              Wrong Proof!
            </Message>
          </div>
        }
        {course.state === "purchased" &&
          <div className="mt-2">
            <Button
              onClick={() => activate_course_async(course.hash)}
              variant="green">
              Activate
            </Button>
            <Button variant="red"
              onClick={() => deactivate_course_async(course.hash)}
            >
              Deactivate
            </Button>
          </div>
        }
      </ManagedCourseCard>
    )
  }

  const show_courses = managedCourses.data
    ?.filter((course) => {
      if (filter.state === "all")
        return true;

      return course.state === filter.state;
    })
    ?.map(course => render_card(course));
  
  return (
    <>
      <MarketHeader />
      <CourseFilter
        on_filter_selected={(option) => set_filters({ state: option })}
        on_search_submit={search_course_async} />
      <section className="grid grid-cols-1">
        {searched_course &&
          <div>
            <h1 className="text-2l font-bold p-5">Found</h1>
            {render_card(searched_course)}
          </div>
        }
        <h1 className="text-2l font-bold p-5">All courses:</h1>
        { show_courses }
        { show_courses?.length === 0 &&
          <Message type="warning">No courses</Message>
        }
      </section>
    </>
  )
}

ManagedCourses.Layout = BaseLayout