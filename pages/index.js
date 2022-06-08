import { Hero } from "@components/ui/common"
import { CourseList, CourseCard } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { get_all_courses } from "content/courses/fetcher";

export default function Home({courses}) {
  return (
    <>
      <Hero />
      <CourseList courses={courses}>
          {
            (course) => <CourseCard key={course.id} course={course} />
          }
        </CourseList> 
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

Home.Layout = BaseLayout