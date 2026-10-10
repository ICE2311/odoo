import { NextRequest, NextResponse } from 'next/server';
import { removeFromCartAction } from '@/server/actions/cart';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let variantId = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      variantId = body.variantId;
    } else {
      const formData = await req.formData();
      variantId = formData.get('variantId') as string;
    }

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    await removeFromCartAction(variantId);

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/cart', req.url), 303);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to remove item from cart' }, { status: 400 });
  }
}

