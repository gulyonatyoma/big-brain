import { supabase } from '../../../shared/api/supabaseClient'

type SignUpInput = {
  email: string
  password: string
}

type SignInInput = {
  email: string
  password: string
}

export async function signUpWithEmail(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signInWithEmail(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}