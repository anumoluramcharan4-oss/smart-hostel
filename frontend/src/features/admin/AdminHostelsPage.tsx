import React, { useEffect, useState } from 'react'
import { Building, Users, Shield, PlusCircle, Edit3, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/app/ToastContext'
import type { Hostel, Block } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export const AdminHostelsPage: React.FC = () => {
  const { success } = useToast()
  const [hostel, setHostel] = useState<Hostel | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editChiefWarden, setEditChiefWarden] = useState('')
  const [editPhone, setEditPhone] = useState('')

  useEffect(() => {
    Promise.all([api.getHostel(), api.getBlocks()]).then(([h, b]) => {
      setHostel(h)
      setBlocks(b)
      setEditName(h.name)
      setEditChiefWarden(h.chiefWarden)
      setEditPhone(h.contactPhone)
    }).catch(console.error)
  }, [])

  const handleSaveHostel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostel) return
    const updated = await api.updateHostel({
      name: editName,
      chiefWarden: editChiefWarden,
      contactPhone: editPhone,
    })
    setHostel(updated)
    setIsEditModalOpen(false)
    success('Hostel estate details updated')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hostels & Blocks Management
          </h1>
          <p className="text-xs text-slate-500">
            Facility hierarchy, physical infrastructure blocks, and master capacity parameters
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditModalOpen(true)}
          leftIcon={<Edit3 className="w-4 h-4" />}
        >
          Edit Hostel Info
        </Button>
      </div>

      {/* Main Hostel Card */}
      {hostel && (
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{hostel.name}</h2>
                  <Badge variant="pending" size="sm">{hostel.code}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gender: <strong className="capitalize">{hostel.gender}</strong> • Chief Warden: <strong>{hostel.chiefWarden}</strong> • Hotline: {hostel.contactPhone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-center sm:text-right">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Capacity</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{hostel.totalCapacity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Occupied</p>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{hostel.occupiedCapacity}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Vacant</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {hostel.totalCapacity - hostel.occupiedCapacity}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Blocks Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Residential Blocks ({blocks.length} Halls)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blocks.map((blk) => (
            <Card key={blk.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{blk.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">{blk.code}</p>
                </div>
                <Badge variant="success" size="sm">
                  {Math.round((blk.occupied / blk.capacity) * 100)}% Full
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Floors</span>
                  <strong className="text-slate-800 dark:text-slate-200">{blk.floorsCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Rooms</span>
                  <strong className="text-slate-800 dark:text-slate-200">{blk.roomsCount}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Occupied Beds</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{blk.occupied}/{blk.capacity}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>In-Charge Warden: <strong>{blk.wardenName}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Hostel Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Hostel Details"
        description="Update campus facility master information."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveHostel} className="space-y-4">
          <Input
            label="Hostel Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Chief Warden"
            value={editChiefWarden}
            onChange={(e) => setEditChiefWarden(e.target.value)}
            required
          />
          <Input
            label="Helpline Phone"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
