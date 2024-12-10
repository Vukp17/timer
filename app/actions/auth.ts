'use server'

import AuthError from 'next-auth'
export type AuthError = 'Invalid credentials' | 'Something went wrong' | 'Success' 
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

export async function login(email: string, password: string): Promise<AuthError> {
    try {
        const res =  await  fetch('http://localhost:4000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if(res.ok){
            return 'Success'

        }else{
            return 'Invalid credentials'
        }
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
export async function reg(email: string, password: string,username:string): Promise<AuthError> {
    try {
     const res = await  fetch('http://localhost:4000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password,username }),
        })
        if(res.ok){
        return 'Success'
        }else{
            return 'Invalid credentials'
        }
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

