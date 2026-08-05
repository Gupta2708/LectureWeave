import React from 'react'

// NOTE: Full marketing landing content lands in phase UI-3. This placeholder
// keeps the public route buildable while the shell/router are wired.
export default function LandingPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-extrabold text-marketing-text">LectureWeave</h1>
      <p className="mt-4 text-marketing-textsoft">
        Grounded AI notes for every lecture.
      </p>
    </section>
  )
}
