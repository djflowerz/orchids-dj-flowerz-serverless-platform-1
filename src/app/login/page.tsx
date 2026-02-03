"use client"

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-2">
            DJ FLOWERZ
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl border-0 rounded-3xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-2xl h-14 border-gray-200 hover:bg-gray-50",
              formButtonPrimary: "rounded-2xl h-14 bg-black hover:bg-gray-800",
              formFieldInput: "rounded-2xl h-14 border-gray-200",
              footerActionLink: "text-black font-semibold hover:underline",
              identityPreviewEditButton: "text-black",
              formResendCodeLink: "text-black",
              otpCodeFieldInput: "border-gray-200"
            }
          }}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/"
          redirectUrl="/"
        />
      </div>
    </div>
  )
}
