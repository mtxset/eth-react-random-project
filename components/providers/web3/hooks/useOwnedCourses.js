import { create_course_hash, normalize } from "@utils/utils";
import useSWR from "swr";

export const handler = (web3, contract) => (courses, account) => {
  const swrRes = useSWR(() => (
    web3 && 
    contract && 
    account) ? `web3/ownedCourses/${account}` : null,
    async () => {
      let owned_course_list = [];

      for (let i = 0; i < courses.length; i++) {
        //debugger;
        const course = courses[i];

        if (!course.id)
          continue;

        const course_hash = create_course_hash(web3)(course.id, account);

        const owned_course = await contract.methods.get_course_by_hash(course_hash).call();

        if (owned_course.owner !== "0x0000000000000000000000000000000000000000") {
          const normalized = normalize(web3)(course, owned_course);
          owned_course_list.push(normalized);
        }
      }

      return owned_course_list;
    }
  );

  return { 
    ...swrRes,
    lookup: swrRes.data?.reduce((a, c) => {
      a[c.id] = c
      return a;
    }, {}) ?? {}
  };
}