"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/app/contexts/UserContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") === "register") {
      setIsRegister(true);
    }
  }, [searchParams]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [language, setLanguage] = useState("");
  const [agree, setAgree] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);


  const updateUsercontext = () => {
    setUser({
      ...user,
      name: loginEmail.split("@")[0] || user.name,
      id: loginEmail,
    });
    console.log("aaaa",user.WebHook_Url,"aaaa",user.name);
}

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("https://n8naurora.duckdns.org/webhook/login-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      let data: any;
      try { data = await res.json(); } catch { data = null; }
      const status = (Array.isArray(data) ? data[0]?.status : data?.status) as string | undefined;
      if (status) {
        if (status.toLowerCase().includes("logged in")) {
          setLoginMsg({ text: status, type: "success" });
          localStorage.setItem("userEmail", loginEmail);
          updateUsercontext();
          setTimeout(() => router.push("/pages/Dashboard"), 800);
        } else {
          setLoginMsg({ text: status, type: "error" });
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { "first name": firstName, "last name": lastName, email: regEmail, password: regPassword, language };
      const res = await fetch("https://n8naurora.duckdns.org/webhook/register-button", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setRegistered(true);
      console.log("Registered:", payload);
    } catch (err) {
      console.error("Register failed:", err);
    }
    setSubmitting(false);
  };

  const toggle = () => {
    setIsRegister((p) => !p);
    setLoginEmail("");
    setLoginPassword("");
    setFirstName("");
    setLastName("");
    setRegEmail("");
    setRegPassword("");
    setLanguage("");
    setAgree(false);
    setRegistered(false);
    setLoginMsg(null);
  };

  const inputClass =
    "w-full px-3 py-2 text-sm text-slate-800 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-md shadow-indigo-950/40">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2 3 7v6c0 4.5 3.8 8.3 9 9 5.2-.7 9-4.5 9-9V7l-9-5Zm0 4.2 5 2.8v4c0 3-2.2 5.6-5 6.1-2.8-.5-5-3.1-5-6.1V9l5-2.8Z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">CareerAI</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {registered && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium text-center">
                  Successfully registered
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  >
                    {showRegPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Which language do you prefer for your CV?</label>
                <select
                  required
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select language</option>
                  <option value="english">English</option>
                  <option value="german">Deutsch</option>
                </select>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to submit all information
                </span>
              </label>

              <button
                type="submit"
                disabled={!agree || submitting}
                className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
              >
                {submitting ? "Registering..." : "Register"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginMsg && (
                <div className={`p-3 rounded-lg border text-sm font-medium text-center ${
                  loginMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}>
                  {loginMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                  >
                    {showLoginPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl transition shadow-sm"
              >
                Sign In
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={toggle}
                className="font-medium text-indigo-600 hover:text-indigo-700 transition"
              >
                {isRegister ? "Sign In" : "Register"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
