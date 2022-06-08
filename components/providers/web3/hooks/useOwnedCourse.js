import { create_course_hash, normalize } from "@utils/utils";
import useSWR from "swr"

export const handler = (web3, contract) => (course, account) => {
  const swrRes = useSWR(() =>
    (web3 && contract && account) ? `web3/ownedCourse/${account}` : null,
    async () => {
      const courseHash = create_course_hash(web3)(course.id, account);
      const ownedCourse = await contract.methods.get_course_by_hash(courseHash).call()
      if (ownedCourse.owner === "0x0000000000000000000000000000000000000000") {
        return null
      }

      return normalize(web3)(course, ownedCourse)
    }
  )

  return swrRes
}