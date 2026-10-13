import { Share } from 'react-native';

import { formatDate, formatMoney } from '@/lib/format';
import type { LorryReceipt } from '@/services/api';

type PrintModule = typeof import('expo-print');

let printModule: PrintModule | undefined;

try {
  printModule = require('expo-print') as PrintModule;
} catch {
  // The installed native binary may predate expo-print; sharing still works.
  printModule = undefined;
}

const escape = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const dash = (value: unknown) => escape(value === null || value === undefined || value === '' ? '-' : value);

function party(title: string, name: string | null, address: string[], gst: string | null, contact: string | null) {
  return `
    <div class="party">
      <div class="label">${title}</div>
      <div class="name">${dash(name)}</div>
      <div>${escape(address.filter(Boolean).join(', ')) || '-'}</div>
      <div>GST: ${dash(gst)}</div>
      <div>Contact: ${dash(contact)}</div>
    </div>`;
}

function cell(label: string, value: unknown) {
  return `<div class="cell"><div class="label">${label}</div><div class="value">${dash(value)}</div></div>`;
}

/** Printable A4 lorry receipt, laid out like the website's PDF. */
export function buildLrHtml(lr: LorryReceipt) {
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #10243e; margin: 28px; font-size: 12px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10243e; padding-bottom: 12px; }
  h1 { margin: 0; font-size: 22px; letter-spacing: .5px; }
  .muted { color: #65728a; }
  .copy { border: 1px solid #ff7417; color: #f27022; padding: 6px 10px; border-radius: 6px; font-weight: 800; text-transform: uppercase; font-size: 10px; display: inline-block; margin-bottom: 6px; }
  .right { text-align: right; font-weight: 700; }
  .parties { display: flex; gap: 16px; margin-top: 14px; }
  .party { flex: 1; border: 1px solid #e0ddd8; border-radius: 8px; padding: 10px; line-height: 1.5; }
  .label { color: #728095; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; }
  .name { font-weight: 800; font-size: 13px; margin: 4px 0; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
  .cell { background: #faf9f6; border-radius: 8px; padding: 8px 10px; }
  .value { font-weight: 700; margin-top: 3px; }
  .ledger { margin-top: 14px; border: 1px solid #e0ddd8; border-radius: 8px; padding: 10px; width: 50%; margin-left: auto; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; }
  .strong { font-weight: 800; border-top: 1px solid #cfd5dd; margin-top: 4px; padding-top: 6px; }
  .signs { display: flex; gap: 24px; margin-top: 48px; }
  .sign { flex: 1; border-top: 1px solid #8c94a3; padding-top: 6px; text-align: center; }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>FLEETCONNEKT LR</h1>
      <div class="muted">Digital lorry receipt for road freight movement</div>
    </div>
    <div class="right">
      <div class="copy">${escape(lr.copy_type)}</div>
      <div>LR number: ${escape(lr.lr_number)}</div>
      <div>Date: ${escape(formatDate(lr.lr_date))}</div>
    </div>
  </div>
  <div class="parties">
    ${party('Consignor', lr.consignor_name, [lr.consignor_address ?? '', lr.consignor_city ?? '', lr.consignor_state ?? '', lr.consignor_pin ?? ''], lr.consignor_gst, lr.consignor_contact)}
    ${party('Consignee', lr.consignee_name, [lr.consignee_address ?? '', lr.consignee_city ?? '', lr.consignee_state ?? '', lr.consignee_pin ?? ''], lr.consignee_gst, lr.consignee_contact)}
  </div>
  <div class="grid">
    ${cell('From', lr.from)}
    ${cell('To', lr.to)}
    ${cell('Truck', lr.truck_number)}
    ${cell('Vehicle type', lr.vehicle_type)}
    ${cell('Material', lr.material_name)}
    ${cell('Weight', lr.material_weight)}
    ${cell('Rate', Number(lr.rate) ? formatMoney(lr.rate, 2) : '-')}
    ${cell('Driver', [lr.driver_name, lr.driver_mobile].filter(Boolean).join(' · '))}
    ${cell('License', lr.driver_license)}
    ${cell('Vehicle owner / supplier', lr.owner_name)}
    ${cell('Owner mobile', lr.owner_mobile)}
    ${cell('Owner PAN', lr.owner_pan)}
  </div>
  <div class="ledger">
    <div class="label">Freight ledger</div>
    <div class="row"><span>Freight amount</span><span>${formatMoney(lr.freight_amount, 2)}</span></div>
    <div class="row"><span>Charges</span><span>${formatMoney(lr.charges, 2)}</span></div>
    <div class="row"><span>Advance</span><span>${formatMoney(lr.advance, 2)}</span></div>
    <div class="row strong"><span>Total amount</span><span>${formatMoney(lr.total_amount, 2)}</span></div>
    <div class="row strong"><span>Balance</span><span>${formatMoney(lr.balance, 2)}</span></div>
  </div>
  <div class="signs">
    <div class="sign label">Driver signature</div>
    <div class="sign label">Consignor stamp</div>
    <div class="sign label">Office signatory</div>
  </div>
</body></html>`;
}

function shareText(lr: LorryReceipt) {
  return [
    `Lorry Receipt ${lr.lr_number} (${lr.copy_type})`,
    `Date: ${formatDate(lr.lr_date)}`,
    `Route: ${lr.from || '-'} → ${lr.to || '-'}`,
    `Truck: ${lr.truck_number || '-'}`,
    `Consignor: ${lr.consignor_name || '-'}`,
    `Consignee: ${lr.consignee_name || '-'}`,
    `Material: ${lr.material_name || '-'}${lr.material_weight ? ` (${lr.material_weight})` : ''}`,
    `Total: ${formatMoney(lr.total_amount, 2)} · Balance: ${formatMoney(lr.balance, 2)}`,
    lr.share_url ? `View: ${lr.share_url}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function shareLr(lr: LorryReceipt) {
  await Share.share({ message: shareText(lr), title: `LR ${lr.lr_number}` });
}

/** Opens the system print dialog (print or save as PDF); falls back to sharing when printing is unavailable. */
export async function printLr(lr: LorryReceipt) {
  if (printModule) {
    try {
      await printModule.printAsync({ html: buildLrHtml(lr) });
      return;
    } catch (issue) {
      // A user cancelling the dialog is not an error worth falling back for.
      if (issue instanceof Error && /cancel/i.test(issue.message)) return;
    }
  }
  await shareLr(lr);
}
