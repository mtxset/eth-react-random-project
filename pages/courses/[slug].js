import { get_all_courses } from "content/courses/fetcher";
import { Message, Modal } from "@components/ui/common";
import {
  CourseHero,
  Curriculum,
  Keypoints
} from "@components/ui/course";
import { BaseLayout } from "@components/ui/layout";
import { useAccount, useOwnedCourse } from "@components/hooks/web3";

export default function Course({ course }) {
  
  const { account } = useAccount()
  const { ownedCourse } = useOwnedCourse(course, account.data)
  const courseState = ownedCourse.data?.state;

  const isLocked = (
    
    courseState === "purchased" || 
    courseState === "deactivated");

  return (
    <>
      <div className="py-4">
        <CourseHero
          hasOwner={!!ownedCourse.data}
          title={course.title}
          desc={course.description}
          image={course.coverImage}
        />
      </div>
      <Keypoints points={course.wsl} />
      {courseState &&

        <div className="max-w-5xl mx-auto">
          {courseState === "purchased" &&
            <Message type="warning">
              Course is purchased
              <i className="block font-normal">Questions</i>
            </Message>
          }

          {courseState === "activated" &&
            <Message type="success">
              Activated
              <i className="block font-normal">Questions</i>
            </Message>
          }

          {courseState === "deactivated" &&
            <Message type="danger">
              Deactivated
              <i className="block font-normal">Questions</i>
            </Message>
          }

        </div>
      }

      <Curriculum 
        locked={isLocked} 
        courseState={courseState} />
      <Modal />
    </>
  )
}

export function getStaticPaths() {
  const all_courses = get_all_courses();

  return {
    paths: all_courses.data.map(x => ({
      params: {
        slug: x.slug
      }
    })),
    fallback: false,
  }
}

export function getStaticProps({ params }) {
  const course_data = get_all_courses();
  const course = course_data.data.filter(x => x.slug === params.slug)[0];

  return {
    props: {
      course
    }
  }
}

Course.Layout = BaseLayout