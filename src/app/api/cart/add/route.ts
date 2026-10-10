import { NextRequest, NextResponse } from 'next/server';
import { addToCartAction } from '@/server/actions/cart';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let variantId = '';
    let qty = 1;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      variantId = body.variantId;
      qty = Number(body.qty) || 1;
    } else {
      const formData = await req.formData();
      variantId = formData.get('variantId') as string;
      qty = Number(formData.get('qty')) || 1;
    }

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    await addToCartAction(variantId, qty);

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/cart', req.url));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add item to cart' }, { status: 400 });
  }
}

