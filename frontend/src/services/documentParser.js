const FIELD_ALIASES = {
  investorName: ['INVESTORNAME', 'INVESTOR', 'INVNAME', 'CLIENTNAME'],
  folioNumber: ['FOLIONUMBER', 'FOLIONO', 'FOLIO', 'ACCOUNTNUMBER'],
  amcCode: ['AMCCODE', 'AMC'],
  schemeCode: ['SCHEMECODE', 'SCHEMEID'],
  schemeName: ['SCHEMENAME', 'SCHEME', 'FUNDNAME'],
  transactionType: ['TRANSACTIONTYPE', 'TXNTYPE', 'TRANSACTION'],
  transactionNumber: ['TRANSACTIONNUMBER', 'TXNNUMBER', 'TXNNO'],
  transactionDate: ['TRANSACTIONDATE', 'TXNDATE', 'DATE'],
  investmentAmount: ['INVESTMENTAMOUNT', 'INVAMT', 'AMOUNT', 'INVESTMENT'],
  investedTotal: ['INVESTEDTOTAL', 'TOTALINVESTED', 'PURCHASECOST'],
  units: ['UNITS', 'UNIT'],
  brokerageType: ['BROKERAGETYPE', 'BRKAGETYPE'],
  brokerageRate: ['BROKERAGERATE', 'BRKAGERATE'],
  brokerageAmount: ['BROKERAGEAMOUNT', 'BRKAGEAMT', 'BROKERAGE'],
  averageAssets: ['AVERAGEASSETS', 'AVGASSETS'],
  amRate: ['AMRATE'],
  camRate: ['CAMRATE'],
  mamRate: ['MAMRATE'],
  amComm: ['AMCOMM'],
  camComm: ['CAMCOMM'],
  mamComm: ['MAMCOMM'],
  gstInformation: ['GSTINFORMATION', 'GSTINFO', 'GST'],
  gstAmount: ['GSTAMOUNT', 'GSTAMT'],
  tdsInformation: ['TDSINFORMATION', 'TDSINFO'],
  tdsAmount: ['TDSAMOUNT', 'TDSAMT', 'TDSDEDUCTED'],
  currentValue: ['CURRENTVALUE', 'CURRVAL', 'MARKETVALUE'],
  nav: ['NAV', 'NETASSETVALUE'],
  returnPercentage: ['RETURNPERCENTAGE', 'RETURNPERCENT', 'RETURNSPERCENT'],
  paymentStatus: ['PAYMENTSTATUS', 'PAYOUTSTATUS'],
};

const normalizeHeader = (value) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

function parseRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === delimiter) {
      row.push(cell);
      cell = '';
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error('The file contains an unterminated quoted field.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function parseNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const cleaned = String(value).replace(/[₹,%\s]/g, '').replace(/^(INR)/i, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseTabularDocument(fileName, text) {
  const contents = text.replace(/^\uFEFF/, '');
  const extension = fileName.toLowerCase().split('.').pop();
  const firstLine = contents.split(/\r?\n/, 1)[0] || '';
  const delimiter = extension === 'tsv' || (extension === 'txt' && firstLine.includes('\t') && !firstLine.includes(','))
    ? '\t'
    : ',';
  const rows = parseRows(contents, delimiter);
  if (rows.length < 2) throw new Error('The file must contain a header row and at least one data row.');

  const headers = rows[0].map((header) => header.trim());
  const normalizedHeaders = headers.map(normalizeHeader);
  const fieldColumns = Object.entries(FIELD_ALIASES)
    .map(([field, aliases]) => [field, normalizedHeaders.findIndex((header) => aliases.includes(header))])
    .filter(([, index]) => index >= 0);

  if (!fieldColumns.some(([field]) => ['schemeName', 'investmentAmount', 'brokerageAmount'].includes(field))) {
    throw new Error('No recognized scheme, investment, or brokerage columns were found in this file.');
  }

  const records = rows.slice(1).map((values) => {
    const sourceData = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const record = { sourceData };
    fieldColumns.forEach(([field, columnIndex]) => {
      const rawValue = values[columnIndex]?.trim() ?? '';
      if (['investmentAmount', 'investedTotal', 'units', 'brokerageAmount', 'averageAssets', 'amComm', 'camComm', 'mamComm', 'gstAmount', 'tdsAmount', 'currentValue', 'nav', 'returnPercentage'].includes(field)) {
        record[field] = parseNumber(rawValue);
      } else if (rawValue) {
        record[field] = rawValue;
      }
    });
    return record;
  }).filter((record) => Object.keys(record.sourceData).some((key) => record.sourceData[key].trim() !== ''));

  if (records.length === 0) throw new Error('No data records were found in the file.');

  return {
    id: `doc-${Date.now()}`,
    name: fileName,
    source: 'Source not identified',
    docType: 'Delimited text statement',
    records,
    rawColumns: headers,
    period: 'Not available',
  };
}
