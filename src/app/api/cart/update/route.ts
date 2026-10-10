import { NextRequest, NextResponse } from 'next/server';
import { updateCartQtyAction } from '@/server/actions/cart';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let variantId = '';
    let qty = 1;

    if (contentType.includes('application/json')) {
      const body = await req.json();
      variantId = body.variantId;
      qty = Number(body.qty);
    } else {
      const formData = await req.formData();
      variantId = formData.get('variantId') as string;
      qty = Number(formData.get('qty'));
    }

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    await updateCartQtyAction(variantId, qty);

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/cart', req.url), 303);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update item quantity' }, { status: 400 });
  }
}

