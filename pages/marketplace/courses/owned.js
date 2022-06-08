import { useAccount, useOwnedCourses } from "@components/hooks/web3";
import { Button, Message } from "@components/ui/common";
import { OwnedCourseCard } from "@components/ui/course";
import { BaseLayout } from "@components/ui/layout";
import { MarketHeader } from "@components/ui/marketplace";
import { get_all_courses } from "content/courses/fetcher";
import { useRouter } from "next/router";

export default function OwnedCourses({ courses }) {
  
  const router = useRouter();
  const { account } = useAccount();
  const { ownedCourses } = useOwnedCourses(courses, account.data);
  
  return (
    <div>
      <MarketHeader />

      <section className="grid grid-cols-1">
        {ownedCourses.data?.map(course =>
          <OwnedCourseCard
            key={course.id}
            course={course}
          >
            <Button 
            onClick={() => router.push(`/courses/${course.slug}`)}>
              Watch the course
            </Button>
          </OwnedCourseCard>
        )}
      </section>
    </div>
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


OwnedCourses.Layout = BaseLayout