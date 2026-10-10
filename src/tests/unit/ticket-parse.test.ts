import { describe, it, expect, vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import { parseTicketInput } from '@/server/data/door';

describe('parseTicketInput', () => {
  it('parses short 8-character ticket code', () => {
    const res = parseTicketInput('84485FD0');
    expect(res).toEqual({ type: 'code', ticketCode: '84485FD0' });
  });

  it('normalizes lowercase code and trims whitespace', () => {
    const res = parseTicketInput('   84485fd0 \n');
    expect(res).toEqual({ type: 'code', ticketCode: '84485FD0' });
  });

  it('handles code with prefix such as "CODE:" or "#"', () => {
    const res1 = parseTicketInput('CODE: 84485FD0');
    expect(res1).toEqual({ type: 'code', ticketCode: '84485FD0' });

    const res2 = parseTicketInput('#84485FD0');
    expect(res2).toEqual({ type: 'code', ticketCode: '84485FD0' });

    const res3 = parseTicketInput('ticket: 84485fd0');
    expect(res3).toEqual({ type: 'code', ticketCode: '84485FD0' });
  });

  it('parses direct UUID', () => {
    const uuid = '66364354-7c1d-4c77-ac4c-3791396bd9f3';
    const res = parseTicketInput(uuid);
    expect(res).toEqual({ type: 'uuid', ticketId: uuid });
  });

  it('parses ticket URL containing UUID', () => {
    const url = 'https://skyline.club/account/tickets/66364354-7c1d-4c77-ac4c-3791396bd9f3';
    const res = parseTicketInput(url);
    expect(res).toEqual({
      type: 'uuid',
      ticketId: '66364354-7c1d-4c77-ac4c-3791396bd9f3',
    });
  });

  it('parses signed QR token payload', () => {
    const token = 't:66364354-7c1d-4c77-ac4c-3791396bd9f3:0429a32c458514930be628ee3269bcf9d3fe0df91b3b5fc345da5e1ea1023747';
    const res = parseTicketInput(token);
    expect(res).toEqual({
      type: 'qr',
      candidateId: '66364354-7c1d-4c77-ac4c-3791396bd9f3',
      signature: '0429a32c458514930be628ee3269bcf9d3fe0df91b3b5fc345da5e1ea1023747',
    });
  });

  it('parses JSON payload', () => {
    const jsonStr = JSON.stringify({ code: '84485fd0' });
    const res = parseTicketInput(jsonStr);
    expect(res).toEqual({ type: 'code', ticketCode: '84485FD0' });
  });

  it('returns null for empty input', () => {
    expect(parseTicketInput('')).toBeNull();
    expect(parseTicketInput('   ')).toBeNull();
  });
});
