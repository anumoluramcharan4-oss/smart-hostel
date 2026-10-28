'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Wrench,
  AlertTriangle,
  Search,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Tag,
  Bed,
  Layers,
  Archive,
  DollarSign,
  TrendingDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function InventoryManagementPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'assets' | 'room-checklist' | 'consumables' | 'register'>('assets')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [checklistBlock, setChecklistBlock] = useState('Block A')
  const [checklistRoom, setChecklistRoom] = useState('204')

  // Modals / Dialogs
  const [transferModal, setTransferModal] = useState<any>(null)
  const [damageModal, setDamageModal] = useState<any>(null)
  const [stockTxModal, setStockTxModal] = useState<any>(null)

  // Asset Form State
  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    category: 'FURNITURE',
    description: '',
    serial_number: '',
    building: 'Main Campus',
    block: 'Block A',
    floor: 2,
    room_number: '204',
    bed_number: 'A',
    purchase_cost: 2500,
    condition: 'GOOD',
    status: 'IN_USE',
    notes: '',
  })

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => api.getInventoryStats(),
    refetchInterval: 5000,
  })

  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['assets-list', selectedBlock, searchQuery],
    queryFn: () => api.getAssets({ block: selectedBlock, search: searchQuery }),
  })

  const { data: roomAssets = [] } = useQuery({
    queryKey: ['room-inventory', checklistBlock, checklistRoom],
    queryFn: () => api.getRoomInventory(checklistBlock, checklistRoom),
  })

  const { data: consumables = [], isLoading: loadingConsumables } = useQuery({
    queryKey: ['consumables-list'],
    queryFn: () => api.getConsumables(),
  })

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: (data: any) => api.createAsset(data, 'admin'),
    onSuccess: (data) => {
      toast.success(`Asset ${data.asset_tag} registered with tracking QR`)
      queryClient.invalidateQueries({ queryKey: ['assets-list'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setActiveTab('assets')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Asset registration failed')
    },
  })

  const transferMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.transferAsset(id, payload, 'admin'),
    onSuccess: () => {
      toast.success('Asset relocated and movement history recorded')
      setTransferModal(null)
      queryClient.invalidateQueries({ queryKey: ['assets-list'] })
      queryClient.invalidateQueries({ queryKey: ['room-inventory'] })
    },
    onError: (err: any) => toast.error(err.message || 'Transfer failed'),
  })

  const damageMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.reportAssetDamage(id, payload),
    onSuccess: (data) => {
      toast.success(`Damage reported! Maintenance Ticket: ${data.maintenance_ticket_id}`)
      setDamageModal(null)
      queryClient.invalidateQueries({ queryKey: ['assets-list'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
    onError: (err: any) => toast.error(err.message || 'Damage report failed'),
  })

  const stockMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.transactConsumableStock(id, payload),
    onSuccess: () => {
      toast.success('Inventory stock transaction logged')
      setStockTxModal(null)
      queryClient.invalidateQueries({ queryKey: ['consumables-list'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
    },
    onError: (err: any) => toast.error(err.message || 'Stock transaction failed'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Inventory & Asset Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track hostel equipment, room assets, movement audit trails, maintenance link, and consumables.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('register')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Add Durable Asset
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Assets</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total_assets ?? 0}</span>
            <span className="text-xs text-slate-400">items</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Damaged / Defect</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.damaged_assets ?? 0}</span>
            <span className="text-xs text-slate-400">flagged</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Under Repair</span>
            <Wrench className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.under_repair_assets ?? 0}</span>
            <span className="text-xs text-slate-400">tickets</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Low Stock Alert</span>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats?.low_stock_items ?? 0}</span>
            <span className="text-xs text-slate-400">supplies</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Asset Book Value</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{(stats?.total_asset_value ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'assets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Asset Registry ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('room-checklist')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'room-checklist'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Room-wise Inventory Checklist
          </button>
          <button
            onClick={() => setActiveTab('consumables')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'consumables'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Consumable Supplies Stock ({consumables.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Commission New Asset
          </button>
        </div>
      </div>

      {/* TAB 1: Asset Registry */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search asset tag, name, or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="all">All Blocks</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Asset Tag</th>
                    <th className="p-3">Equipment Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Current Location</th>
                    <th className="p-3">Condition</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No assets registered yet. Click &quot;Add Durable Asset&quot; to begin.
                      </td>
                    </tr>
                  ) : (
                    assets.map((ast: any) => (
                      <tr key={ast.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ast.asset_tag}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {ast.name}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Cost: ₹{ast.purchase_cost}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{ast.category}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {ast.block} • Rm {ast.room_number || 'Common'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ast.condition === 'GOOD' || ast.condition === 'NEW'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {ast.condition}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ast.status === 'IN_USE'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : ast.status === 'UNDER_REPAIR'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {ast.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setTransferModal(ast)}
                              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                              Relocate
                            </button>
                            <button
                              onClick={() => setDamageModal(ast)}
                              className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100"
                            >
                              Report Defect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Room-wise Inventory Checklist */}
      {activeTab === 'room-checklist' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Expected Room Inventory Manifest
              </h3>
              <p className="text-xs text-slate-500">
                Inspect registered fixtures and furniture allocated to a specific quarters.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Block e.g. Block A"
                value={checklistBlock}
                onChange={(e) => setChecklistBlock(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Room e.g. 204"
                value={checklistRoom}
                onChange={(e) => setChecklistRoom(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomAssets.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50">
                <Bed className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  No assets currently assigned to {checklistBlock} Room {checklistRoom}.
                </p>
              </div>
            ) : (
              roomAssets.map((ast: any) => (
                <div
                  key={ast.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {ast.asset_tag}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ast.condition === 'GOOD'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {ast.condition}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ast.name}</h4>
                  <p className="text-xs text-slate-500">Category: {ast.category}</p>
                  <p className="text-xs text-slate-500">Bed Allocation: {ast.bed_number || 'Shared'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Consumables Supplies */}
      {activeTab === 'consumables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Housekeeping & Consumable Supplies
              </h3>
              <p className="text-xs text-slate-500">
                Quantity-based transactions with minimum stock threshold protection.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Supply Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Min Threshold</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {consumables.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No consumables tracked.
                    </td>
                  </tr>
                ) : (
                  consumables.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold">{item.item_code}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                      <td className="p-3 text-slate-500">{item.category}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            item.current_stock <= item.min_threshold
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.current_stock} {item.unit}
                        </span>
                        {item.current_stock <= item.min_threshold && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-bold">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{item.min_threshold} {item.unit}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setStockTxModal(item)}
                          className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold text-[11px] hover:bg-blue-100"
                        >
                          Transact Stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Register Asset Form */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Commission New Durable Asset
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Assign unique asset tag, initial location, and procurement details.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              createAssetMutation.mutate(formData)
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Asset Tag *
                </label>
                <input
                  type="text"
                  required
                  placeholder="AST-BLK-A-RM204-FAN-01"
                  value={formData.asset_tag}
                  onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Asset / Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Havells 56-inch Ceiling Fan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                >
                  <option value="FURNITURE">Furniture</option>
                  <option value="ELECTRICAL_FIXTURE">Electrical Fixture</option>
                  <option value="APPLIANCE">Appliance</option>
                  <option value="BEDDING">Bedding / Mattress</option>
                  <option value="PLUMBING">Plumbing Fixture</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Purchase Cost (₹)
                </label>
                <input
                  type="number"
                  value={formData.purchase_cost}
                  onChange={(e) => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Assigned Block & Room
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Block A"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="204"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Bed Identifier
                </label>
                <input
                  type="text"
                  placeholder="Bed A / Bed B"
                  value={formData.bed_number}
                  onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createAssetMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm transition"
            >
              {createAssetMutation.isPending ? 'Registering...' : 'Register Asset with Movement History'}
            </button>
          </form>
        </div>
      )}

      {/* Relocate Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Relocate Asset {transferModal.asset_tag}
            </h3>
            <p className="text-xs text-slate-500">
              Transfer asset to new block/room while saving audit trail.
            </p>

            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                transferMutation.mutate({
                  id: transferModal.id,
                  payload: {
                    to_block: e.target.block.value,
                    to_floor: Number(e.target.floor.value),
                    to_room_number: e.target.room.value,
                    reason: e.target.reason.value,
                  },
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Destination Block</label>
                <input name="block" defaultValue="Block B" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Floor</label>
                  <input name="floor" type="number" defaultValue="1" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Room</label>
                  <input name="room" defaultValue="105" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Transfer Rationale</label>
                <input name="reason" defaultValue="Seasonal room reallocation" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModal(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Report Modal */}
      {damageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Report Damage for {damageModal.name}
            </h3>
            <p className="text-xs text-slate-500">
              Directly links to Staff & Maintenance ticket for repair triage.
            </p>

            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                damageMutation.mutate({
                  id: damageModal.id,
                  payload: {
                    reported_by: 'Staff Member',
                    description: e.target.description.value,
                    priority: e.target.priority.value,
                    estimated_cost: Number(e.target.cost.value || 0),
                  },
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Defect Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="e.g. Motor burnt out, making loud humming noise..."
                  className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800 font-semibold">
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Est. Repair Cost (₹)</label>
                  <input name="cost" type="number" defaultValue="450" className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDamageModal(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={damageMutation.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                >
                  Dispatch Maintenance Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {stockTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transact Stock: {stockTxModal.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Available Stock: <b className="text-slate-800 dark:text-slate-200">{stockTxModal.current_stock} {stockTxModal.unit}</b>
            </p>

            <form
              onSubmit={(e: any) => {
                e.preventDefault()
                stockMutation.mutate({
                  id: stockTxModal.id,
                  payload: {
                    transaction_type: e.target.type.value,
                    quantity: Number(e.target.quantity.value),
                    reference: e.target.ref.value,
                  },
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Transaction Type</label>
                <select name="type" className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800 font-semibold">
                  <option value="ISSUED">ISSUED (Dispense to housekeeping)</option>
                  <option value="RECEIVED">RECEIVED (Inward from vendor)</option>
                  <option value="CONSUMED">CONSUMED (Used up)</option>
                  <option value="RETURNED">RETURNED (Surplus return)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Quantity ({stockTxModal.unit})</label>
                <input name="quantity" type="number" min="1" defaultValue="5" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Reference / Allocation</label>
                <input name="ref" defaultValue="Weekly cleaning routine Block A" required className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-50 dark:bg-slate-800" />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockTxModal(null)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockMutation.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Record Stock Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
