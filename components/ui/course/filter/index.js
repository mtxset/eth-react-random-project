import { Button } from "@components/ui/common";
import { useState } from "react";

const OPTIONS = [
  "all",
  "purchased",
  "activated",
  "deactivated"
]

export default function CourseFilter({ on_search_submit, on_filter_selected}) {
  const [search_text, set_search_text] = useState();

  return (
    <div className="flex items-center my-4">
      <div className="flex mr-2 relative rounded-md">
        <input
          value={search_text}
          onChange={(event) => { set_search_text(event.target.value) }}
          type="text"
          name="account"
          id="account"
          className="w-96 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
          placeholder="0x2341ab..." />
        <Button
          onClick={() => on_search_submit(search_text)}>
          Search
        </Button>
      </div>
      <div className="relative text-gray-700">
        <select 
        onChange={(event) => on_filter_selected(event.target.value)}
        className="w-72 h-10 pl-3 pr-6 text-base placeholder-gray-600 border rounded-lg appearance-none focus:shadow-outline" 
        placeholder="Regular input">
          {OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
        </div>
      </div>
    </div>
  )
}