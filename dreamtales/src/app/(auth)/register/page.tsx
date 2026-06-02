'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
    full_name: z.string().min(2, { error: 'Jméno musí mít alespoň 2 znaky' }).trim(),
    email: z.email({ error: 'Zadejte platnou e-mailovou adresu' }),
    password: z
      .string()
      .min(8, { error: 'Heslo musí mít alespoň 8 znaků' })
      .regex(/[a-zA-Z]/, { error: 'Heslo musí obsahovat alespoň jedno písmeno' })
      .regex(/[0-9]/, { error: 'Heslo musí obsahovat alespoň jedno číslo' }),
    confirm_password: z.string().min(1, { error: 'Potvrďte heslo' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    error: 'Hesla se neshodují',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  async function onSubmit(data: FormValues) {
    setServerError(null)
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
        },
      })
      if (error) {
        if (error.message.includes('already registered')) {
          setServerError('Tento e-mail je již registrovaný. Přihlaste se.')
        } else {
          setServerError('Registrace se nezdařila. Zkuste to prosím znovu.')
        }
      } else {
        setRegisteredEmail(data.email)
        setSuccess(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Potvrďte e-mail</h2>
        </div>
        <p className="text-purple-200 text-sm leading-relaxed mb-2">
          Odeslali jsme potvrzovací e-mail na
        </p>
        <p className="text-violet-300 font-semibold mb-4">{registeredEmail}</p>
        <p className="text-purple-300 text-sm leading-relaxed mb-8">
          Kliknutím na odkaz v e-mailu dokončíte registraci a budete moci začít vytvářet pohádky.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold px-6 py-2.5 text-sm transition shadow-lg shadow-purple-900/50"
        >
          Zpět na přihlášení
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/50 mb-4">
          <span className="text-3xl">🌙</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">DreamTales</h1>
        <p className="text-purple-300 text-sm mt-1">Pohádky na dobrou noc</p>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6 text-center">Vytvoření účtu</h2>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1.5">
            Celé jméno
          </label>
          <input
            {...register('full_name', {
              validate: (v) => v.trim().length >= 2 || 'Jméno musí mít alespoň 2 znaky',
            })}
            type="text"
            autoComplete="name"
            placeholder="Jan Novák"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {errors.full_name && (
            <p className="mt-1.5 text-xs text-red-400">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1.5">
            E-mailová adresa
          </label>
          <input
            {...register('email', {
              validate: (v) => {
                const result = z.email().safeParse(v)
                return result.success || 'Zadejte platnou e-mailovou adresu'
              },
            })}
            type="email"
            autoComplete="email"
            placeholder="vas@email.cz"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1.5">
            Heslo
          </label>
          <input
            {...register('password', {
              validate: (v) => {
                if (v.length < 8) return 'Heslo musí mít alespoň 8 znaků'
                if (!/[a-zA-Z]/.test(v)) return 'Heslo musí obsahovat alespoň jedno písmeno'
                if (!/[0-9]/.test(v)) return 'Heslo musí obsahovat alespoň jedno číslo'
                return true
              },
            })}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-1.5">
            Potvrdit heslo
          </label>
          <input
            {...register('confirm_password', {
              validate: (v, formValues) =>
                v === formValues.password || 'Hesla se neshodují',
            })}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {errors.confirm_password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold py-2.5 text-sm transition shadow-lg shadow-purple-900/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Registrace...
            </>
          ) : (
            'Vytvořit účet'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-purple-300">
        Již máte účet?{' '}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition">
          Přihlaste se
        </Link>
      </p>
    </div>
  )
}
