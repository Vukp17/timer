"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const baseURl = 'http://localhost:4000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify token with NestJS API
    fetch(baseURl + '/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/tracker');
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
      </div>
    );
  }

  return null;
}

