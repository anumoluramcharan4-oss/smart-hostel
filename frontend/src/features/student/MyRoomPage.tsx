import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DoorOpen, Users, CheckCircle2, AlertTriangle, Wrench, ShieldCheck, Mail, Phone } from 'lucide-react'
import { useAuth } from '@/app/AuthContext'
import { api } from '@/lib/api'
import type { Room } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'

export const MyRoomPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRoom() {
      if (!user) return
      try {
        const rooms = await api.getRooms()
        const myRoom = rooms.find((r) => r.roomNumber === (user.roomNumber || 'A-204'))
        if (myRoom) setRoom(myRoom)
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Room Details
          </h1>
          <p className="text-xs text-slate-500">
            Room {room?.roomNumber} • {room?.blockName} • Floor {room?.floor}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/student/raise-complaint')}
          leftIcon={<Wrench className="w-4 h-4 text-indigo-600" />}
        >
          Report Room Issue
        </Button>
      </div>

      {/* Room Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Room Number</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{room?.roomNumber}</p>
          <Badge variant="pending" size="sm" className="mt-2">Floor {room?.floor}</Badge>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Room Type</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 capitalize">{room?.type} Sharing</p>
          <p className="text-[11px] text-slate-400 mt-2">Capacity: {room?.capacity} Students</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Current Occupancy</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {room?.occupants.length} / {room?.capacity} Beds
          </p>
          <Badge variant="warning" size="sm" className="mt-2">1 Bed Available</Badge>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Hostel Block</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{room?.blockName.split(' ')[0]}</p>
          <p className="text-[11px] text-slate-400 mt-2">Warden: Prof. Rajesh Sharma</p>
        </Card>
      </div>

      {/* Roommates & Amenities Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocated Roommates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Roommates & Bed Allocations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {room?.occupants.map((occ) => {
              const isCurrentUser = occ.id === user?.id || occ.email === user?.email
              return (
                <div
                  key={occ.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={occ.name} size="md" status="online" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {occ.name}
                        </h4>
                        {isCurrentUser && <Badge variant="pending" size="sm">You</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{occ.studentId}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {occ.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {occ.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="neutral" size="sm" className="font-mono font-bold">
                    {occ.bedNumber}
                  </Badge>
                </div>
              )
            })}

            {/* Vacant Bed Item */}
            {room && room.occupants.length < room.capacity && (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600 dark:text-slate-300">Bed-3 (Vacant)</p>
                <p className="text-[11px]">Available for allocation by the Warden Office.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Inventory & Amenities Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Room Asset & Amenities Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {room?.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5 text-xs">
                  {amenity.condition === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : amenity.condition === 'fair' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {amenity.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      amenity.condition === 'good'
                        ? 'success'
                        : amenity.condition === 'fair'
                        ? 'warning'
                        : 'critical'
                    }
                    size="sm"
                  >
                    Condition: {amenity.condition.toUpperCase()}
                  </Badge>

                  {amenity.condition !== 'good' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[11px] h-7 px-2"
                      onClick={() => navigate('/student/raise-complaint')}
                    >
                      Report
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
