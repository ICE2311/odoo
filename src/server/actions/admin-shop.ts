'use server';

import { db } from '../db';
import { products, productVariants, stockMovements, merchOrders, merchOrderItems, auditLog } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { requireAdmin } from '../auth/guards';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  slug: z.string().trim().min(1, 'Slug is required').max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1, 'Description is required'),
  basePricePaise: z.coerce.number().int().min(0, 'Price must be non-negative'),
  imageUrls: z.array(z.string().url()).optional().default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  maxPerUser: z.coerce.number().int().min(1).optional().nullable(),
});

export async function createOrUpdateProduct(data: any) {
  const admin = await requireAdmin();

  if (data.id) {
    await db
      .update(products)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePricePaise: data.basePricePaise,
        imageUrls: data.imageUrls,
        status: data.status,
        maxPerUser: data.maxPerUser,
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.id));
  } else {
    const [p] = await db
      .insert(products)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        basePricePaise: data.basePricePaise,
        imageUrls: data.imageUrls || [],
        status: data.status,
        maxPerUser: data.maxPerUser,
      })
      .returning();
    data.id = p.id;
  }

  revalidatePath('/shop');
  revalidatePath('/admin/shop');
  return { success: true, productId: data.id };
}

export async function createProductWithVariants(
  productData: {
    name: string;
    slug: string;
    description: string;
    basePricePaise: number;
    imageUrls?: string[];
    status?: 'draft' | 'active' | 'archived';
    maxPerUser?: number | null;
  },
  variants: Array<{
    label: string;
    sku: string;
    initialStock: number;
    priceOverridePaise?: number | null;
  }>
) {
  const admin = await requireAdmin();
  const parsed = productSchema.parse(productData);

  // Check unique slug
  const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, parsed.slug));
  if (existing) {
    throw new Error(`A product with slug "${parsed.slug}" already exists`);
  }

  const result = await db.transaction(async (tx) => {
    const [newProduct] = await tx
      .insert(products)
      .values({
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        basePricePaise: parsed.basePricePaise,
        imageUrls: parsed.imageUrls,
        status: parsed.status,
        maxPerUser: parsed.maxPerUser || null,
      })
      .returning();

    // Default variant if none provided
    const items = variants.length > 0 ? variants : [{ label: 'Standard', sku: `${parsed.slug}-std`, initialStock: 10 }];

    for (const v of items) {
      const stock = Math.max(0, v.initialStock || 0);
      const [insertedVariant] = await tx
        .insert(productVariants)
        .values({
          productId: newProduct.id,
          label: v.label,
          sku: v.sku || `${parsed.slug}-${v.label.toLowerCase()}`,
          stockOnHand: stock,
          stockHeld: 0,
          priceOverridePaise: v.priceOverridePaise || null,
        })
        .returning();

      if (stock > 0) {
        await tx.insert(stockMovements).values({
          variantId: insertedVariant.id,
          delta: stock,
          reason: 'restock',
          refId: 'Initial inventory creation',
          by: admin.user.id,
        });
      }
    }

    await tx.insert(auditLog).values({
      actorId: admin.user.id,
      action: 'create_product',
      entityType: 'product',
      entityId: newProduct.id,
      afterJson: { ...parsed, variantsCount: items.length },
    });

    return newProduct;
  });

  revalidatePath('/shop');
  revalidatePath('/admin/shop');
  return { success: true, product: result };
}

export async function updateProductDetails(
  productId: string,
  data: {
    name: string;
    slug: string;
    description: string;
    basePricePaise: number;
    imageUrls?: string[];
    status?: 'draft' | 'active' | 'archived';
    maxPerUser?: number | null;
  }
) {
  const admin = await requireAdmin();
  const parsed = productSchema.parse(data);

  const [existing] = await db.select().from(products).where(eq(products.id, productId));
  if (!existing) throw new Error('Product not found');

  if (existing.slug !== parsed.slug) {
    const [slugConflict] = await db.select({ id: products.id }).from(products).where(eq(products.slug, parsed.slug));
    if (slugConflict && slugConflict.id !== productId) {
      throw new Error(`A product with slug "${parsed.slug}" already exists`);
    }
  }

  await db
    .update(products)
    .set({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      basePricePaise: parsed.basePricePaise,
      imageUrls: parsed.imageUrls,
      status: parsed.status,
      maxPerUser: parsed.maxPerUser || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  await db.insert(auditLog).values({
    actorId: admin.user.id,
    action: 'update_product',
    entityType: 'product',
    entityId: productId,
    beforeJson: { name: existing.name, slug: existing.slug, status: existing.status },
    afterJson: parsed,
  });

  revalidatePath('/shop');
  revalidatePath(`/shop/${parsed.slug}`);
  revalidatePath('/admin/shop');
  return { success: true };
}

export async function addVariantToProduct(
  productId: string,
  variant: {
    label: string;
    sku: string;
    initialStock: number;
    priceOverridePaise?: number | null;
  }
) {
  const admin = await requireAdmin();
  const stock = Math.max(0, variant.initialStock || 0);

  const [newVariant] = await db
    .insert(productVariants)
    .values({
      productId,
      label: variant.label,
      sku: variant.sku,
      stockOnHand: stock,
      stockHeld: 0,
      priceOverridePaise: variant.priceOverridePaise || null,
    })
    .returning();

  if (stock > 0) {
    await db.insert(stockMovements).values({
      variantId: newVariant.id,
      delta: stock,
      reason: 'restock',
      refId: 'Added new variant',
      by: admin.user.id,
    });
  }

  await db.insert(auditLog).values({
    actorId: admin.user.id,
    action: 'add_variant',
    entityType: 'product_variant',
    entityId: newVariant.id,
    afterJson: { productId, label: variant.label, sku: variant.sku, stock },
  });

  revalidatePath('/shop');
  revalidatePath('/admin/shop');
  return { success: true, variant: newVariant };
}

export async function adjustStock(
  variantId: string,
  delta: number,
  reason: 'restock' | 'adjustment',
  note?: string
) {
  const admin = await requireAdmin();

  await db.transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId));

    if (!variant) throw new Error('Variant not found');

    const newStock = variant.stockOnHand + delta;
    if (newStock < 0) {
      throw new Error(`Cannot reduce stock below zero. Current stock: ${variant.stockOnHand}, requested change: ${delta}`);
    }

    await tx
      .update(productVariants)
      .set({ stockOnHand: newStock })
      .where(eq(productVariants.id, variantId));

    await tx.insert(stockMovements).values({
      variantId,
      delta,
      reason,
      refId: note || (reason === 'restock' ? 'Manual restock' : 'Inventory audit adjustment'),
      by: admin.user.id,
    });
  });

  revalidatePath('/shop');
  revalidatePath('/admin/shop');
  return { success: true };
}

export async function markOrderCollected(orderId: string) {
  const admin = await requireAdmin();
  const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, orderId));
  if (!order) throw new Error('Order not found');
  if (order.status === 'collected') {
    throw new Error('Already collected at ' + order.collectedAt?.toISOString());
  }

  await db
    .update(merchOrders)
    .set({
      status: 'collected',
      collectedAt: new Date(),
      collectedBy: admin.user.id,
    })
    .where(eq(merchOrders.id, orderId));

  revalidatePath('/admin/orders');
  return { success: true };
}

export async function deleteProductAction(productId: string) {
  const admin = await requireAdmin();

  const [existing] = await db.select().from(products).where(eq(products.id, productId));
  if (!existing) throw new Error('Product not found');

  // Check if any order items reference this product's variants
  const variants = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
  const variantIds = variants.map((v) => v.id);

  let hasOrders = false;
  if (variantIds.length > 0) {
    const orderItems = await db
      .select({ orderId: merchOrderItems.orderId })
      .from(merchOrderItems)
      .where(inArray(merchOrderItems.variantId, variantIds))
      .limit(1);
    hasOrders = orderItems.length > 0;
  }

  if (hasOrders) {
    // Soft delete: archive product to preserve order history
    await db
      .update(products)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(products.id, productId));

    await db.insert(auditLog).values({
      actorId: admin.user.id,
      action: 'archive_product',
      entityType: 'product',
      entityId: productId,
      beforeJson: { status: existing.status },
      afterJson: { status: 'archived' },
    });

    revalidatePath('/shop');
    revalidatePath('/admin/shop');
    return {
      success: true,
      archived: true,
      message: `Product "${existing.name}" has order history and was archived so orders remain valid.`,
    };
  } else {
    // Hard delete: remove stock movements, variants, and product
    if (variantIds.length > 0) {
      await db.delete(stockMovements).where(inArray(stockMovements.variantId, variantIds));
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
    }
    await db.delete(products).where(eq(products.id, productId));

    await db.insert(auditLog).values({
      actorId: admin.user.id,
      action: 'delete_product',
      entityType: 'product',
      entityId: productId,
      beforeJson: { name: existing.name, slug: existing.slug },
    });

    revalidatePath('/shop');
    revalidatePath('/admin/shop');
    return {
      success: true,
      archived: false,
      message: `Product "${existing.name}" was permanently deleted.`,
    };
  }
}

