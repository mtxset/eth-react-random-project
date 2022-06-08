const SIZE = {
  sm: "p-2 text-base xs:px-4",
  md: "p-3 text-base xs:px-8",
  lg: "p-3 text-lg xs:px-8"
}

export default function Button({
  children,
  className,
  hoverable=true,
  variant = "purple",
  size = "md",
  ...rest
}) {

  const variants = {
    green:     `text-white bg-green-600 ${hoverable && "hover:bg-green-700"}`,
    purple:     `text-white bg-indigo-600 ${hoverable && "hover:bg-indigo-700"}`,
    light_purple: `text-indigo-700 bg-indigo-100 ${hoverable && "hover:bg-indigo-200"}`,
    red:     `text-white bg-red-600 ${hoverable && "hover:bg-red-700"}`,
  }

  const sizeClass = SIZE[size];

  return (
    <button
      {...rest}
      className={`${sizeClass} disabled:opacity-50 disabled:cursor-not-allowed border rounded-md font-medium ${className} ${variants[variant]}`}>
      {children}
    </button>
  )
}