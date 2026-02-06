
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get('plan'); // 'report_one_shot'
    const address = searchParams.get('address');

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Configuration ad-hoc pour le rapport 19.90€
    if (plan === 'report_one_shot') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Rapport d'expertise : ${address || 'Bien Immobilier'}`,
                description: 'Analyse complète : DVF, Risques, Estimations, Environnement.',
                images: ['https://verifiemamaison.fr/logos/logo.png'], // Idealement une image valide
              },
              unit_amount: 1990, // 19.90 EUR
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/report/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/report/teasing?address=${encodeURIComponent(address || '')}`,
        metadata: {
          type: 'one_shot_report',
          address: address || 'N/A',
          sku: 'unite'
        }
      });

      if (session.url) {
        return NextResponse.redirect(session.url);
      }
    }

    return NextResponse.json({ error: 'Invalid plan or configuration' }, { status: 400 });

  } catch (error) {
    console.error('Checkout GET Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

import { getPlanBySku } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sku, successUrl, cancelUrl } = body;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    if (!sku) {
      return NextResponse.json({ error: 'Missing SKU' }, { status: 400 });
    }

    const plan = getPlanBySku(sku);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: plan.name,
              description: plan.description,
              images: ['https://verifiemamaison.fr/logos/logo.png'],
            },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout`,
      metadata: {
        type: 'pack_purchase',
        sku: plan.sku,
        credits: plan.reports.toString()
      }
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (error) {
    console.error('Checkout POST Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
