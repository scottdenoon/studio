
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmailAndPasswordClient, signInWithGoogle } from '@/services/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { setRehydratedProfile } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    try {
      const { userProfile } = await signInWithEmailAndPasswordClient(data.email, data.password)
      setRehydratedProfile(userProfile);
      router.push('/')
    } catch (error: any) {
      console.error('Login failed:', error)
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      })
      setRehydratedProfile(null);
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { userProfile } = await signInWithGoogle();
      setRehydratedProfile(userProfile);
      router.push('/');
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unexpected error occurred.',
      });
      setRehydratedProfile(null);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">OR CONTINUE WITH</span>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M21.8 10.5c0-.7-.1-1.3-.2-2H12v3.7h5.5c-.2 1.2-1 2.2-2.1 2.9v2.5h3.2c1.9-1.7 3-4.2 3-7.1zM12 22c2.7 0 5-1 6.6-2.6l-3.2-2.5c-.9.6-2 .9-3.4.9c-2.6 0-4.8-1.7-5.6-4.1H3.1v2.5C4.8 19.8 8.1 22 12 22zM6.4 13.7c-.2-.6-.2-1.2-.2-1.8s0-1.2.2-1.8V7.6H3.1c-.6 1.2-1 2.5-1 4s.4 2.8 1 4zM12 5.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 1.9 14.6 1 12 1C8.1 1 4.8 3.2 3.1 6.1l3.3 2.5c.8-2.4 3-4.1 5.6-4.1z"></path></svg>
            )}
            Login with Google
          </Button>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
