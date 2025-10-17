"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

function Line({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`bg-gray-200/70 rounded ${w} ${h} animate-pulse`} />;
}

function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 max-w-2xl">
              <div className="bg-gradient-to-r from-[#5784ba]/5 to-blue-50/50 rounded-2xl p-6 border border-[#5784ba]/20">
                <div className="flex items-center gap-4">
                  <Line w="w-12 h-12" />
                  <div className="flex-1 space-y-2">
                    <Line w="w-48 h-5" />
                    <Line w="w-64 h-4" />
                  </div>
                  <Line w="w-32 h-10" />
                </div>
              </div>
            </div>
            <div className="w-full lg:w-80">
              <Line w="w-full h-10" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full">
              <Line w="w-full h-12" />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full">
              <Line w="w-28 h-4" />
              <div className="mt-3"><Line w="w-20 h-6" /></div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full">
              <Line w="w-28 h-4" />
              <div className="mt-3"><Line w="w-16 h-6" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200/60">
                <tr>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <th key={i} className="text-left px-6 py-4">
                      <Line w="w-20 h-4" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="hover:bg-gray-50/80">
                    {Array.from({ length: 8 }).map((_, c) => (
                      <td key={c} className="px-6 py-4">
                        <Line w="w-32 h-4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Line w="w-64 h-4" />
          <div className="flex items-center gap-2">
            <Line w="w-20 h-10" />
            <Line w="w-10 h-10" />
            <Line w="w-20 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

type InfluencerProfile = {
  influencer_name: string;
  coupon_code: string;
  email: string;
  instagram_username: string;
  instagram_profile_link: string;
  discount_percentage: number;
};

type RedemptionItem = {
  created_at: string;
  user_name: string;
  name: string;
  book_id: string;
  book_style: string;
  total_price: number;
  city: string;
};

type RedemptionPage = {
  items: RedemptionItem[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-[#5784ba] ${sizeClasses[size]}`} />;
};

function HomePageImpl() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";

  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [summaryCities, setSummaryCities] = useState(0);
  const [summaryOrders, setSummaryOrders] = useState(0);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState<InfluencerProfile | null>(null);

  const [adminToken, setAdminToken] = useState("");
  const [adminCoupon, setAdminCoupon] = useState("");
  const [adminProfile, setAdminProfile] = useState<InfluencerProfile | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isInfluencer = !!token;
  const isAdmin = !!adminToken;
  const isAuthed = isInfluencer || isAdmin;

  const toISTParts = (iso: string) => {
    const ist = dayjs.utc(iso).tz("Asia/Kolkata");
    return { date: ist.format("DD MMM YYYY"), time: ist.format("hh:mm A") };
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const stats = useMemo(() => {
    const localRevenue = items.reduce((sum, item) => sum + item.total_price, 0);
    return {
      totalRedemptions: items.length,
      totalRevenue: localRevenue,
      uniqueCities: new Set(items.map(i => i.city)).size,
    };
  }, [items]);

  const handleLogin = async () => {
    if (!API_BASE) return setLoginError("Server not configured");
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/api/influencer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setLoginError(err?.detail || `Login failed: ${res.status}`);
        setIsLoggingIn(false);
        return;
      }
      const data = await res.json();
      const tokenFromServer = String(data.token || "");
      const roleFromServer = String(data.role || "");
      if (roleFromServer === "influencer") {
        const url = new URL(window.location.href);
        url.searchParams.set("token", tokenFromServer);
        window.history.replaceState({}, "", url.toString());
        window.location.reload();
      } else if (roleFromServer === "admin") {
        setAdminToken(tokenFromServer);
      } else {
        setLoginError("Unknown role");
      }
    } catch {
      setLoginError("Network error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    if (!isInfluencer || !API_BASE) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/influencer/me?token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data: InfluencerProfile = await res.json();
        if (!cancelled) setProfile(data);
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [isInfluencer, token]);

  useEffect(() => {
    if (!isInfluencer || !API_BASE) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/influencer/summary?token=${encodeURIComponent(token)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setSummaryRevenue(data.total_revenue || 0);
          setSummaryCities(data.cities_reached || 0);
          setSummaryOrders(data.total_redemptions || 0);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [isInfluencer, token]);

  useEffect(() => {
    if (!isInfluencer || !API_BASE) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        p.set("token", token);
        p.set("page", String(page));
        p.set("page_size", String(pageSize));
        if (q.trim()) p.set("q", q.trim());
        const url = `${API_BASE}/api/influencer/redemptions?${p.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data: RedemptionPage = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setTotalPages(data.total_pages || 1);
          setTotalCount(data.total_count || 0);
        }
      } catch { } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isInfluencer, token, q, page, pageSize]);

  const adminLoad = async () => {
    if (!isAdmin || !adminCoupon || !API_BASE) return;
    setLoading(true);
    setAdminProfile(null);
    setItems([]);
    try {
      const profUrl = `${API_BASE}/api/influencer/profile?token=${encodeURIComponent(adminToken)}&coupon_code=${encodeURIComponent(adminCoupon)}`;
      const profRes = await fetch(profUrl);
      if (profRes.ok) {
        const prof: InfluencerProfile = await profRes.json();
        setAdminProfile(prof);
      } else {
        setAdminProfile(null);
      }
      const p = new URLSearchParams();
      p.set("token", adminToken);
      p.set("page", String(1));
      p.set("page_size", String(pageSize));
      p.set("coupon_code_override", adminCoupon);
      if (q.trim()) p.set("q", q.trim());
      const listUrl = `${API_BASE}/api/influencer/redemptions?${p.toString()}`;
      const listRes = await fetch(listUrl);
      if (!listRes.ok) throw new Error();
      const data: RedemptionPage = await listRes.json();
      setItems(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total_count || 0);
      setPage(1);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !API_BASE || !adminCoupon) return;
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/influencer/summary?token=${encodeURIComponent(adminToken)}&coupon_code_override=${encodeURIComponent(adminCoupon)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setSummaryRevenue(data.total_revenue || 0);
          setSummaryCities(data.cities_reached || 0);
          setSummaryOrders(data.total_redemptions || 0);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, adminToken, adminCoupon]);

  useEffect(() => {
    if (!isAdmin || !API_BASE || !adminCoupon) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        p.set("token", adminToken);
        p.set("page", String(page));
        p.set("page_size", String(pageSize));
        p.set("coupon_code_override", adminCoupon);
        if (q.trim()) p.set("q", q.trim());
        const url = `${API_BASE}/api/influencer/redemptions?${p.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data: RedemptionPage = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setTotalPages(data.total_pages || 1);
          setTotalCount(data.total_count || 0);
        }
      } catch { } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, adminToken, adminCoupon, q, page, pageSize]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-[#5784ba]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-[#5784ba] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">✦</span>
                </div>
                <div className="text-left">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Influencer Portal
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Access your campaign dashboard</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5784ba]/20 focus:border-[#5784ba] transition-all duration-300 group-hover:border-gray-300 placeholder:text-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#5784ba] transition-colors">
                    👤
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5784ba]/20 focus:border-[#5784ba] transition-all duration-300 group-hover:border-gray-300 placeholder:text-gray-400 pr-12"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#5784ba] transition-colors focus:outline-none"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn || !loginUsername || !loginPassword}
                className="w-full rounded-xl bg-gradient-to-br from-[#5784ba] to-blue-600 hover:from-[#4a76b0] hover:to-blue-700 text-white py-3.5 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Accessing Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                )}
              </button>

              {loginError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 animate-shake">
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <span className="text-red-500">⚠</span>
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  const headerProfile = isInfluencer ? profile : adminProfile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {headerProfile && (
              <div className="flex-1 max-w-2xl">
                <div className="bg-gradient-to-r from-[#5784ba]/5 to-blue-50/50 rounded-2xl p-6 border border-[#5784ba]/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#5784ba] to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">✦</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{headerProfile.influencer_name}</h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <a
                            href={headerProfile.instagram_profile_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:border-[#5784ba]/30 hover:text-[#5784ba] transition-all duration-200"
                          >
                            <span>📷</span>
                            <span>@{headerProfile.instagram_username}</span>
                            <span className="text-xs">↗</span>
                          </a>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full text-sm text-green-700">
                            <span>🎯</span>
                            <span>{headerProfile.discount_percentage}% OFF</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => copyToClipboard(headerProfile.coupon_code, "coupon")}
                        className="relative group flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-[#5784ba] hover:shadow-md transition-all duration-200"
                      >
                        <span className="font-mono font-bold text-gray-900">{headerProfile.coupon_code}</span>
                        <span className="text-gray-400 group-hover:text-[#5784ba] transition-colors">📋</span>
                        {copiedField === "coupon" && (
                          <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg whitespace-nowrap">
                            Copied to clipboard!
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 min-w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      value={adminCoupon}
                      onChange={(e) => setAdminCoupon(e.target.value)}
                      placeholder="e.g., SUMMER20"
                      className="flex-1 min-w-0 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5784ba] focus:border-transparent transition-all duration-200"
                      onKeyDown={(e) => e.key === "Enter" && adminLoad()}
                    />
                    <button
                      onClick={adminLoad}
                      disabled={!adminCoupon || loading}
                      className="rounded-xl bg-[#5784ba] text-white text-sm px-6 py-2.5 hover:bg-[#4a76b0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : "Load"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-lg">🔍</span>
                </div>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by user name, child name, book id..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#5784ba]/20 focus:border-[#5784ba] transition-all duration-300 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {summaryOrders > 0 && (
            <>
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{summaryOrders.toLocaleString()}</p>
                    </div>
                    <div className="text-3xl opacity-80">📊</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm h-full flex items-center">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Cities Reached</p>
                      <p className="text-2xl font-bold text-gray-900">{summaryCities.toLocaleString()}</p>
                    </div>
                    <div className="text-3xl opacity-80">🌍</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200/60">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Book ID</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Style</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <LoadingSpinner size="lg" />
                        <p className="text-gray-500 text-sm">Loading orders...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <span className="text-4xl">📦</span>
                        <p className="text-sm font-medium">No orders found</p>
                        <p className="text-xs">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((it, idx) => {
                    const parts = toISTParts(it.created_at);
                    return (
                      <tr key={idx} className="group hover:bg-gray-50/80 transition-colors duration-200">
                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-[#5784ba] transition-colors">
                          {parts.date}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{parts.time}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{it.user_name}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{it.name}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => copyToClipboard(it.book_id, `book-${idx}`)}
                            className="font-mono text-sm text-gray-700 hover:text-[#5784ba] transition-colors duration-200 relative group/copy px-2 py-1 rounded hover:bg-gray-100"
                          >
                            {it.book_id}
                            {copiedField === `book-${idx}` && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                Copied!
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-700 font-medium">{it.book_style}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ₹{it.total_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{it.city}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
            <div className="text-sm text-gray-600">
              Showing page {page} of {totalPages} • {totalCount.toLocaleString()} total orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              <span className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-4 py-2.5 text-sm rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageImpl />
    </Suspense>
  );
}