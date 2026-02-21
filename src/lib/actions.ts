'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  // In a real app, you'd validate and authenticate the user
  console.log('Logging in with:', Object.fromEntries(formData));
  await new Promise(resolve => setTimeout(resolve, 1000));
  redirect('/dashboard');
}

export async function signup(prevState: any, formData: FormData) {
  // In a real app, you'd validate and create a new user
  console.log('Signing up with:', Object.fromEntries(formData));
  await new Promise(resolve => setTimeout(resolve, 1000));
  redirect('/dashboard');
}
