"use client"

import { useState, useEffect } from "react"
import { AdminPageWrapper } from "../page-wrapper"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Eye } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { toast } from "react-hot-toast"

interface LoginSession {
  id: string
  user_id: string
  email: string
  role: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  user_metadata?: any
  app_metadata?: any
}

interface SessionStats {
  total_sessions: number
  active_sessions: number
  unique_users: number
  today_logins: number
}

export default function LoginHistoryPage() {
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    fetchLoginHistory()
  }, [roleFilter])

  useEffect(() => {
    if (sessions.length > 0) {
      fetchSessionStats()
    }
  }, [sessions])

  const fetchLoginHistory = async () => {
    setIsLoading(true)
    try {
      // Fetch users from Supabase Auth with profiles
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        console.error('Error fetching auth users:', authError)
        toast.error('Không thể tải danh sách người dùng từ Supabase Auth')
        return
      }

      // Fetch profiles to get role information
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Combine auth users with profile data
      const sessions: LoginSession[] = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id)
        return {
          id: user.id,
          user_id: user.id,
          email: user.email || 'Unknown',
          role: profile?.role || 'unknown',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        }
      })

      // Filter by role if specified
      const filteredSessions = roleFilter === "all"
        ? sessions
        : sessions.filter(session => session.role === roleFilter)

      setSessions(filteredSessions)
    } catch (error) {
      console.error('Error fetching login history:', error)
      toast.error('Lỗi khi tải lịch sử đăng nhập')
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessionStats = async () => {
    try {
      // Calculate stats from current sessions data
      const today = new Date().toISOString().split('T')[0]
      const todayLogins = sessions.filter(session =>
        session.last_sign_in_at && session.last_sign_in_at.includes(today)
      ).length

      const stats: SessionStats = {
        total_sessions: sessions.length,
        active_sessions: sessions.filter(session =>
          session.last_sign_in_at &&
          new Date(session.last_sign_in_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        ).length,
        unique_users: new Set(sessions.map(s => s.user_id)).size,
        today_logins: todayLogins
      }

      setSessionStats(stats)
    } catch (error) {
      console.error('Error calculating session stats:', error)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getDeviceType = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) return 'Mobile'
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  const getBrowser = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ip_address?.includes(searchTerm)

    const matchesRole = roleFilter === "all" || session.role === roleFilter

    return matchesSearch && matchesRole
  })

  const handleTerminateSession = async (userId: string) => {
    try {
      // Sign out user using Supabase Admin API
      const { error } = await supabaseAdmin.auth.admin.signOut(userId)

      if (error) {
        console.error('Error terminating session:', error)
        toast.error('Không thể kết thúc phiên đăng nhập')
      } else {
        toast.success('Phiên đăng nhập đã được kết thúc')
        fetchLoginHistory() // Reload data
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      toast.error('Lỗi khi kết thúc phiên đăng nhập')
    }
  }

  return (
    <AdminPageWrapper title="Login History" activePage="login-history">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Tìm kiếm theo email hoặc địa chỉ IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Login Sessions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900">Người dùng</th>
                  <th className="text-left p-4 font-medium text-gray-900">Lần đăng nhập cuối</th>
                  <th className="text-left p-4 font-medium text-gray-900">Cập nhật cuối</th>
                  <th className="text-left p-4 font-medium text-gray-900">Địa chỉ IP</th>
                  <th className="text-left p-4 font-medium text-gray-900">Thiết bị</th>
                  <th className="text-left p-4 font-medium text-gray-900">Trình duyệt</th>
                  <th className="text-left p-4 font-medium text-gray-900">Trạng thái</th>
                  <th className="text-left p-4 font-medium text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      No login sessions found
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.session_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{session.email}</div>
                        <div className="text-sm text-gray-500">{session.role}</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.last_sign_in_at ? formatDateTime(session.last_sign_in_at) : formatDateTime(session.created_at)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.updated_at !== session.created_at ? formatDateTime(session.updated_at) : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.user_metadata?.ip_address || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.user_metadata?.device || 'Desktop'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.user_metadata?.browser || 'Unknown'}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(!!session.last_sign_in_at)}>
                          {session.last_sign_in_at ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye size={16} />
                          </Button>
                          {session.last_sign_in_at && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleTerminateSession(session.user_id)}
                            >
                              Đăng xuất
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">
              {sessionStats?.total_sessions || sessions.length}
            </div>
            <div className="text-sm text-gray-600">Tổng phiên đăng nhập</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {sessionStats?.active_sessions || sessions.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Phiên đang hoạt động</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {sessionStats?.unique_users || new Set(sessions.map(s => s.user_id)).size}
            </div>
            <div className="text-sm text-gray-600">Người dùng duy nhất</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {sessionStats?.today_logins || sessions.filter(s => s.login_time.includes(new Date().toISOString().split('T')[0])).length}
            </div>
            <div className="text-sm text-gray-600">Đăng nhập hôm nay</div>
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  )
}
