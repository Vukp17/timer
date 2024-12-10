'use server'

import  AuthError  from 'next-auth'

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Simulate authentication logic
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const email = formData.get('email')
    const password = formData.get('password')
    
    if (email !== 'user@example.com' || password !== 'password') {
      return 'Invalid credentials'
    }
    
    return 'Success'
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error) {
        case 'CredentialsSignin':
          return 'Invalid credentials'
        default:
          return 'Something went wrong'
      }
    }
    throw error
  }
}

