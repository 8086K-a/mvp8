"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import { auth } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface PhoneAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuth: (userData: any) => void
}

export function PhoneAuthModal({ open, onOpenChange, onAuth }: PhoneAuthModalProps) {
  const { signIn } = useAuth()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSendOTP = async () => {
    if (!phone) {
      setError("Please enter your phone number")
      return
    }

    // Format phone number to international format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    setLoading(true)
    setError("")

    try {
      const { data, error } = await auth.signInWithPhone(formattedPhone)
      
      if (error) {
        setError(error.message)
        return
      }

      setSuccess("SMS sent! Check your phone.")
      setStep("otp")
    } catch (err) {
      setError("Failed to send SMS. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter the 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      const { data, error } = await auth.verifyPhoneOTP(formattedPhone, otp)
      
      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        const userData = {
          type: "authenticated" as const,
          name: data.user.user_metadata?.full_name || `User-${phone.slice(-4)}`,
          email: data.user.email || `${phone}@phone.local`,
          phone: phone,
          customCount: 0,
          pro: false,
          id: data.user.id
        }
        signIn(userData)
        onAuth(userData)
        onOpenChange(false)
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep("phone")
    setOtp("")
    setError("")
    setSuccess("")
  }

  const resetForm = () => {
    setPhone("")
    setOtp("")
    setError("")
    setSuccess("")
    setStep("phone")
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {step === "phone" ? "Sign in with Phone" : "Enter Verification Code"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === "phone" 
              ? "We'll send you a verification code via SMS"
              : `Enter the 6-digit code sent to ${phone}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "phone" ? (
            <>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  disabled={loading}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter your phone number with country code
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Send Verification Code
              </Button>

              <div className="text-center text-sm">
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-blue-400 hover:underline"
                  disabled={loading}
                >
                  Back to other options
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{phone}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label htmlFor="otp" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-center text-lg tracking-widest"
                  disabled={loading}
                  maxLength={6}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter the 6-digit code from your SMS
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Verify & Sign In
              </Button>

              <div className="text-center text-sm">
                <button
                  onClick={handleSendOTP}
                  className="text-blue-400 hover:underline"
                  disabled={loading}
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 