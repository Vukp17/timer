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

export async function login(email: string, password: string): Promise<{ status: AuthError, token?: string }> {
    try {
        const res = await fetch('http://localhost:4000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data)
            return { status: 'Success', token: data.access_token };
        } else {
            return { status: 'Invalid credentials' };
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error) {
                case 'CredentialsSignin':
                    return { status: 'Invalid credentials' };
                default:
                    return { status: 'Something went wrong' };
            }
        }
        throw error;
    }
}
export async function reg(email: string, password: string, username: string): Promise<AuthError> {
    try {
        const res = await fetch('http://localhost:4000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username }),
        })
        if (res.ok) {
            return 'Success'
        } else {
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


export const cuUser = async (token: string) => {
    try {
        const res = await fetch('http://localhost:4000/auth/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }
        )


    }
    catch (error) {
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