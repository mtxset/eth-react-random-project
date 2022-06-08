import { normalize } from "@utils/utils"
import useSWR from "swr"

export const handler = (web3, contract) => account => {

  const swrRes = useSWR(() =>
    (web3 &&
    contract &&
    account.data && account.isAdmin ) ? `web3/managedCourses/${account.data}` : null,
    async () => {
      const courses = []
      const courseCount = await contract.methods.total_owned_courses().call()

      for (let i = Number(courseCount) - 1; i >= 0; i--) {
        const courseHash = await contract.methods.get_course_hash_at_index(i).call()
        const course = await contract.methods.get_course_by_hash(courseHash).call()

        if (course) {
          const normalized = normalize(web3)({ hash: courseHash }, course)
          courses.push(normalized)
        }
      }

      return courses
    }
  )

  return swrRes
}