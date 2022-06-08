import courses from "./index.json";

export const get_all_courses = () => {
  return {
    data: courses,
    courseMap: courses.reduce((accumulator, data, index) => { 
      accumulator[data.id] = data;
      accumulator[data.id].index = index;
      return accumulator;
    }, {})
  };
}