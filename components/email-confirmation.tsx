"use client"

import Image from "next/image"
import { Mail, AlertCircle, CheckCircle2, LogIn } from "lucide-react"

interface EmailConfirmationProps {
  email: string
  onBack: () => void
}

export default function EmailConfirmation({ email, onBack }: EmailConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-8 space-y-8">
      <div className="flex flex-col items-center justify-center mb-6">
        <Image src="/images/orphion-full-dark.png" alt="Orphion Logo" width={200} height={50} className="mb-6" />
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
          <Mail size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-neutral-400 max-w-sm">
          We've sent a verification link to <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-neutral-400 text-sm">Please check your inbox and click the link to verify your account.</p>

        <div className="bg-neutral-800 p-4 rounded-lg w-full mt-4">
          <div className="flex items-start mb-3">
            <CheckCircle2 size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-left text-neutral-300">
              The verification email has been sent. It may take a few minutes to arrive.
            </p>
          </div>
          <div className="flex items-start">
            <AlertCircle size={18} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-left text-neutral-300">
              If you don't see it, please check your spam or junk folder.
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-red-700 hover:bg-red-600 rounded-lg text-white transition-colors w-full mt-4"
        >
          <LogIn size={18} />
          <span>Go to Sign In</span>
        </button>
      </div>
    </div>
  )
}
