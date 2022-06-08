import Link from "next/link";
import { useRouter } from "next/router";
import react from "react";

export default function ActiveLink({ children, ...props }) {
  
  const { pathname } = useRouter();

  let className = children.props.className || "";

  if (pathname === props.href) {
    className = `${className} text-indigo-500`;
  }

  return (
    <Link {...props}>
      {
        react.cloneElement(children,  { className })
      }
    </Link>
  )
}