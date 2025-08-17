import { SignUp } from '@clerk/nextjs'
import Link from "next/link";

export default function Page() {
  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 flex-col gap-0.5">
        <SignUp />
        <p className='text-black'>already have an accoount? <Link className='text-blue-600' href={'/sign-in'}> Sign In</Link> </p>
      </div>
    )
}