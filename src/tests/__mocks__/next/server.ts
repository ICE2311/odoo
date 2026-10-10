export const NextResponse = { json: (body: any, init?: any) => ({ body, init, status: init?.status || 200 }) };
