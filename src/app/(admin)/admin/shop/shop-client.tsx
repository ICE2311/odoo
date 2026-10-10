'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Edit2,
  Boxes,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  IndianRupee,
  Layers,
  X,
  ArrowUpRight,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { formatPaise } from '@/lib/format';
import {
  createProductWithVariants,
  updateProductDetails,
  addVariantToProduct,
  adjustStock,
  deleteProductAction,
} from '@/server/actions/admin-shop';

interface Variant {
  id: string;
  productId: string;
  label: string;
  sku: string;
  stockOnHand: number;
  stockHeld: number;
  priceOverridePaise: number | null;
}

interface ProductWithVariants {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrls: string[] | null;
  basePricePaise: number;
  status: 'draft' | 'active' | 'archived';
  maxPerUser: number | null;
  createdAt: Date;
  variants: Variant[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ShopClient({ initialProducts }: { initialProducts: ProductWithVariants[] }) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductWithVariants | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createPriceRupees, setCreatePriceRupees] = useState('500');
  const [createImageUrl, setCreateImageUrl] = useState('');
  const [createStatus, setCreateStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [createVariants, setCreateVariants] = useState<Array<{ label: string; sku: string; initialStock: number }>>([
    { label: 'S', sku: 's', initialStock: 10 },
    { label: 'M', sku: 'm', initialStock: 15 },
    { label: 'L', sku: 'l', initialStock: 15 },
    { label: 'XL', sku: 'xl', initialStock: 10 },
  ]);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriceRupees, setEditPriceRupees] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'active' | 'archived'>('active');

  // New variant in Stock modal
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('10');

  // Variant stock adjustments inputs (variantId -> { delta, reason, note })
  const [stockInputs, setStockInputs] = useState<Record<string, { delta: string; reason: 'restock' | 'adjustment'; note: string }>>({});

  const openCreateModal = () => {
    setCreateName('');
    setCreateSlug('');
    setCreateDesc('');
    setCreatePriceRupees('500');
    setCreateImageUrl('');
    setCreateStatus('active');
    setCreateVariants([
      { label: 'S', sku: 's', initialStock: 10 },
      { label: 'M', sku: 'm', initialStock: 15 },
      { label: 'L', sku: 'l', initialStock: 15 },
      { label: 'XL', sku: 'xl', initialStock: 10 },
    ]);
    setShowCreateModal(true);
    setStatusMsg(null);
  };

  const openEditModal = (p: ProductWithVariants) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSlug(p.slug);
    setEditDesc(p.description);
    setEditPriceRupees((p.basePricePaise / 100).toString());
    setEditImageUrl(p.imageUrls?.[0] || '');
    setEditStatus(p.status);
    setStatusMsg(null);
  };

  const openStockModal = (p: ProductWithVariants) => {
    setStockProduct(p);
    setNewVariantLabel('');
    setNewVariantSku('');
    setNewVariantStock('10');
    setStatusMsg(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const basePricePaise = Math.round(parseFloat(createPriceRupees || '0') * 100);
    const finalSlug = slugify(createSlug || createName);

    const payloadVariants = createVariants.map((v) => ({
      label: v.label,
      sku: v.sku.includes('-') ? v.sku : `${finalSlug}-${v.label.toLowerCase()}`,
      initialStock: v.initialStock || 0,
    }));

    startTransition(async () => {
      try {
        const res = await createProductWithVariants(
          {
            name: createName,
            slug: finalSlug,
            description: createDesc,
            basePricePaise,
            imageUrls: createImageUrl ? [createImageUrl] : [],
            status: createStatus,
          },
          payloadVariants
        );

        setShowCreateModal(false);
        setStatusMsg({ text: `Product "${createName}" created with ${payloadVariants.length} variants!` });
        window.location.reload();
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to create product', error: true });
      }
    });
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setStatusMsg(null);

    const basePricePaise = Math.round(parseFloat(editPriceRupees || '0') * 100);
    const finalSlug = slugify(editSlug);

    startTransition(async () => {
      try {
        await updateProductDetails(editingProduct.id, {
          name: editName,
          slug: finalSlug,
          description: editDesc,
          basePricePaise,
          imageUrls: editImageUrl ? [editImageUrl] : [],
          status: editStatus,
        });

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  name: editName,
                  slug: finalSlug,
                  description: editDesc,
                  basePricePaise,
                  imageUrls: editImageUrl ? [editImageUrl] : [],
                  status: editStatus,
                }
              : p
          )
        );

        setEditingProduct(null);
        setStatusMsg({ text: `Product "${editName}" updated successfully!` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to update product', error: true });
      }
    });
  };

  const handleDeleteProduct = (p: ProductWithVariants) => {
    if (!window.confirm(`Are you sure you want to delete "${p.name}"? If it has past orders, it will be safely archived so customer order histories are preserved.`)) return;

    setStatusMsg(null);
    startTransition(async () => {
      try {
        const res = await deleteProductAction(p.id);
        if (res.archived) {
          setProducts((prev) =>
            prev.map((item) => (item.id === p.id ? { ...item, status: 'archived' } : item))
          );
        } else {
          setProducts((prev) => prev.filter((item) => item.id !== p.id));
        }
        if (editingProduct?.id === p.id) {
          setEditingProduct(null);
        }
        setStatusMsg({ text: res.message });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to delete product', error: true });
      }
    });
  };


  const handleAdjustStock = async (variantId: string) => {
    const input = stockInputs[variantId];
    if (!input || !input.delta) return;
    const delta = parseInt(input.delta, 10);
    if (isNaN(delta) || delta === 0) return;

    setStatusMsg(null);

    startTransition(async () => {
      try {
        await adjustStock(variantId, delta, input.reason || 'restock', input.note);

        // Update local state
        setProducts((prev) =>
          prev.map((p) => {
            const hasVar = p.variants.some((v) => v.id === variantId);
            if (!hasVar) return p;
            return {
              ...p,
              variants: p.variants.map((v) =>
                v.id === variantId ? { ...v, stockOnHand: v.stockOnHand + delta } : v
              ),
            };
          })
        );

        if (stockProduct) {
          setStockProduct((prev) =>
            prev
              ? {
                  ...prev,
                  variants: prev.variants.map((v) =>
                    v.id === variantId ? { ...v, stockOnHand: v.stockOnHand + delta } : v
                  ),
                }
              : null
          );
        }

        // Reset delta input
        setStockInputs((prev) => ({
          ...prev,
          [variantId]: { delta: '', reason: 'restock', note: '' },
        }));

        setStatusMsg({ text: `Adjusted inventory by ${delta > 0 ? '+' : ''}${delta}!` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to adjust stock', error: true });
      }
    });
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct || !newVariantLabel) return;
    setStatusMsg(null);

    const initialStock = parseInt(newVariantStock || '0', 10);
    const sku = newVariantSku || `${stockProduct.slug}-${slugify(newVariantLabel)}`;

    startTransition(async () => {
      try {
        const res = await addVariantToProduct(stockProduct.id, {
          label: newVariantLabel,
          sku,
          initialStock,
        });

        const newV = res.variant;

        setProducts((prev) =>
          prev.map((p) => (p.id === stockProduct.id ? { ...p, variants: [...p.variants, newV] } : p))
        );

        setStockProduct((prev) => (prev ? { ...prev, variants: [...prev.variants, newV] } : null));

        setNewVariantLabel('');
        setNewVariantSku('');
        setNewVariantStock('10');
        setStatusMsg({ text: `Added variant "${newVariantLabel}"!` });
      } catch (err: any) {
        setStatusMsg({ text: err.message || 'Failed to add variant', error: true });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Merch Shop & Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Add merchandise products, manage variant sizes, and adjust live stock on hand.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-sm hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-[var(--radius-md)] text-xs font-medium flex items-center gap-2 ${
            statusMsg.error
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-success/10 text-success border border-success/20'
          }`}
        >
          {statusMsg.error ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Products List Table */}
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Product</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Price</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Variants & Stock</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Total Available</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const totalStock = product.variants.reduce((s, v) => s + v.stockOnHand, 0);
                const totalHeld = product.variants.reduce((s, v) => s + v.stockHeld, 0);
                const available = totalStock - totalHeld;

                return (
                  <tr key={product.id} className="hover:bg-muted/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
                          {product.imageUrls?.[0] ? (
                            <img
                              src={product.imageUrls[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{product.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">/{product.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-semibold uppercase tracking-wider ${
                          product.status === 'active'
                            ? 'bg-success/10 text-success border border-success/20'
                            : product.status === 'archived'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-foreground">
                      {formatPaise(product.basePricePaise)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {product.variants.map((v) => {
                          const vAvail = v.stockOnHand - v.stockHeld;
                          const isLow = vAvail <= 5 && vAvail > 0;
                          const isOut = vAvail <= 0;
                          return (
                            <span
                              key={v.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] text-xs font-medium border ${
                                isOut
                                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-muted text-foreground'
                              }`}
                              title={`OnHand: ${v.stockOnHand}, Held: ${v.stockHeld}`}
                            >
                              <span className="font-bold">{v.label}:</span>
                              <span>{vAvail}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {available} <span className="text-xs font-normal text-muted-foreground">/ {totalStock} total</span>
                      </div>
                      {totalHeld > 0 && (
                        <div className="text-[11px] text-amber-700">({totalHeld} held in carts)</div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openStockModal(product)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Boxes className="w-3.5 h-3.5" /> Manage Stock
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border hover:bg-muted text-foreground transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete or Archive Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No products added yet. Click &quot;Add New Product&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-[var(--radius-xl)] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center bg-muted">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Create New Merchandise Product
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    if (!createSlug || createSlug === slugify(createName)) {
                      setCreateSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="e.g. Skyline Hoodie 2025"
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={createSlug}
                    onChange={(e) => setCreateSlug(slugify(e.target.value))}
                    placeholder="skyline-hoodie-2025"
                    className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={createPriceRupees}
                    onChange={(e) => setCreatePriceRupees(e.target.value)}
                    className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="100% cotton, heavyweight, embroidered logo..."
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Image URL</label>
                <input
                  type="url"
                  value={createImageUrl}
                  onChange={(e) => setCreateImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Status</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">Active (Visible in shop)</option>
                  <option value="draft">Draft (Hidden from shop)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Initial Variants */}
              <div className="p-3 bg-muted border rounded-[var(--radius-lg)] space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Initial Sizes & Starting Stock
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {createVariants.map((v, i) => (
                    <div key={v.label} className="text-center">
                      <span className="text-xs font-semibold text-muted-foreground">{v.label}</span>
                      <input
                        type="number"
                        min="0"
                        value={v.initialStock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || '0', 10);
                          setCreateVariants((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, initialStock: val } : item))
                          );
                        }}
                        className="w-full mt-1 px-2 py-1 text-center border rounded-[var(--radius-md)] text-xs bg-card"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-[var(--radius-md)] text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-[var(--radius-xl)] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center bg-muted">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" /> Edit Product: {editingProduct.name}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(slugify(e.target.value))}
                    className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editPriceRupees}
                    onChange={(e) => setEditPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Image URL</label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-card outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="active">Active (Visible in shop)</option>
                  <option value="draft">Draft (Hidden from shop)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => editingProduct && handleDeleteProduct(editingProduct)}
                  disabled={isPending}
                  className="px-3 py-2 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Product
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border rounded-[var(--radius-md)] text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending ? 'Saving...' : 'Save Product Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE STOCK & VARIANTS MODAL */}
      {stockProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border rounded-[var(--radius-xl)] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center bg-muted">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-primary" /> Manage Inventory: {stockProduct.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Restock or adjust inventory levels for each variant.
                </p>
              </div>
              <button
                onClick={() => setStockProduct(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Existing Variants List & Stock Adjustments */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Current Variants ({stockProduct.variants.length})
                </span>

                <div className="space-y-2">
                  {stockProduct.variants.map((v) => {
                    const input = stockInputs[v.id] || { delta: '', reason: 'restock', note: '' };
                    const available = v.stockOnHand - v.stockHeld;

                    return (
                      <div
                        key={v.id}
                        className="p-3.5 border rounded-[var(--radius-lg)] bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-2">
                            <span>{v.label}</span>
                            <span className="text-xs font-mono font-normal text-muted-foreground">
                              ({v.sku})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Stock on Hand:{' '}
                            <span className="font-semibold text-foreground">{v.stockOnHand}</span> • Held:{' '}
                            <span className="text-amber-700">{v.stockHeld}</span> • Available:{' '}
                            <span
                              className={`font-semibold ${
                                available > 0 ? 'text-success' : 'text-destructive'
                              }`}
                            >
                              {available}
                            </span>
                          </div>
                        </div>

                        {/* Adjust Form */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            placeholder="+10 or -2"
                            value={input.delta}
                            onChange={(e) =>
                              setStockInputs((prev) => ({
                                ...prev,
                                [v.id]: {
                                  ...input,
                                  delta: e.target.value,
                                },
                              }))
                            }
                            className="w-24 px-2 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary font-semibold"
                          />

                          <select
                            value={input.reason}
                            onChange={(e) =>
                              setStockInputs((prev) => ({
                                ...prev,
                                [v.id]: {
                                  ...input,
                                  reason: e.target.value as any,
                                },
                              }))
                            }
                            className="px-2 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none"
                          >
                            <option value="restock">Restock</option>
                            <option value="adjustment">Correction</option>
                          </select>

                          <button
                            onClick={() => handleAdjustStock(v.id)}
                            disabled={isPending || !input.delta || input.delta === '0'}
                            className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-40 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Variant */}
              <div className="p-4 bg-muted/50 border rounded-[var(--radius-lg)] space-y-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" /> Add New Variant / Size
                </span>

                <form onSubmit={handleAddVariant} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Size/Label (e.g. XXL)"
                      value={newVariantLabel}
                      onChange={(e) => setNewVariantLabel(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="SKU (optional)"
                      value={newVariantSku}
                      onChange={(e) => setNewVariantSku(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Initial Stock"
                      value={newVariantStock}
                      onChange={(e) => setNewVariantStock(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-[var(--radius-md)] text-xs bg-card outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isPending || !newVariantLabel}
                      className="w-full py-1.5 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90 disabled:opacity-50"
                    >
                      Add Variant
                    </button>
                  </div>
                </form>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setStockProduct(null)}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-[var(--radius-md)] text-xs hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

