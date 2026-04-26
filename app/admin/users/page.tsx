'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Ban, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  name: string | null
  role: string | null
  created_at: string | null
  email_confirmed_at: string | null
  user_metadata?: { banned?: boolean }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    setSupabase(createClient())
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!supabase) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(user => {
    const lowerQuery = searchQuery.toLowerCase()
    const matchesSearch = (user.name?.toLowerCase().includes(lowerQuery) ?? false) ||
                         (user.email?.toLowerCase().includes(lowerQuery) ?? false)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      toast.success('User role updated')
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser || !supabase) return
    try {
      const { error } = await supabase.auth.admin.updateUserById(selectedUser.id, { user_metadata: { banned: true } })
      if (error) throw error
      toast.success('User banned successfully')
      setBanDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('Failed to ban user')
    }
  }

  const handleUnbanUser = async (userId: string) => {
    if (!supabase) return
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { banned: false } })
      if (error) throw error
      toast.success('User unbanned successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast.error('Failed to unban user')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser || !supabase) return
    try {
      await supabase.from('ads').delete().eq('user_id', selectedUser.id)
      await supabase.from('user_settings').delete().eq('user_id', selectedUser.id)
      await supabase.auth.admin.deleteUser(selectedUser.id)
      toast.success('User deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const isBanned = (user: User) => user?.user_metadata?.banned === true

  const handleRoleFilterChange = (value: string | null) => {
    if (value) setRoleFilter(value)
  }

  const handleUserRoleChange = (userId: string, value: string | null) => {
    if (value) handleRoleChange(userId, value)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
              </div>
              <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select value={user.role || 'user'} onValueChange={(value) => handleUserRoleChange(user.id, value)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      {isBanned(user) ? <Badge variant="destructive">Banned</Badge> : user.email_confirmed_at ? <Badge className="bg-emerald-500">Active</Badge> : <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isBanned(user) ? (
                          <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}><UserCheck className="h-4 w-4 mr-1" />Unban</Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setBanDialogOpen(true) }}><Ban className="h-4 w-4 mr-1" />Ban</Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-orange-500" />Ban User</DialogTitle>
            <DialogDescription>Are you sure you want to ban {selectedUser?.name || selectedUser?.email}?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBanUser}>Ban User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" />Delete User</DialogTitle>
            <DialogDescription>Are you sure you want to delete {selectedUser?.name || selectedUser?.email}? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
