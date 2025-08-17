import { SignIn } from '@clerk/nextjs'
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 gap-2 flex-col">
      <SignIn />
      <p className='text-black'>no accoount? <Link className='text-blue-600' href={'/sign-up'}> Sign up</Link> </p>
    </div>
  )
}