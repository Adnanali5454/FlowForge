import type { ConnectorPlugin, PollResult, ActionResult } from '@/lib/connectors/base';

const BASE = 'https://sheets.googleapis.com/v4';

function sheetsHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

const googleSheetsConnector: ConnectorPlugin = {
  manifest: {
    id: 'google-sheets',
    slug: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read and write data in Google Sheets spreadsheets',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
    category: 'productivity',
    version: '1.0.0',
    isBuiltIn: true,
    isPremium: false,
    authType: 'oauth2',
    authConfig: {
      type: 'oauth2',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    triggers: [
      {
        key: 'new_row',
        name: 'New Row',
        description: 'Triggers when a new row is added to a Google Sheet',
        type: 'polling',
        outputSchema: {
          type: 'object',
          properties: {
            row_number: { type: 'number' },
            values: { type: 'array' },
          },
        },
      },
    ],
    actions: [
      {
        key: 'append_row',
        name: 'Append Row',
        description: 'Append a new row to a Google Sheet',
        configFields: [
          { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'string', required: true },
          { key: 'range', label: 'Range (e.g. Sheet1)', type: 'string', required: true },
          { key: 'values', label: 'Values (comma-separated)', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { updated_range: { type: 'string' }, updated_rows: { type: 'number' } } },
      },
      {
        key: 'update_row',
        name: 'Update Row',
        description: 'Update values in a specific range of a Google Sheet',
        configFields: [
          { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'string', required: true },
          { key: 'range', label: 'Range (e.g. Sheet1!A1:C1)', type: 'string', required: true },
          { key: 'values', label: 'Values (comma-separated)', type: 'string', required: true },
        ],
        outputSchema: { type: 'object', properties: { updated_range: { type: 'string' }, updated_cells: { type: 'number' } } },
      },
      {
        key: 'create_spreadsheet',
        name: 'Create Spreadsheet',
        description: 'Create a new Google Sheets spreadsheet',
        configFields: [
          { key: 'title', label: 'Spreadsheet Title', type: 'string', required: true },
          { key: 'sheet_title', label: 'First Sheet Title', type: 'string', required: false },
        ],
        outputSchema: { type: 'object', properties: { spreadsheet_id: { type: 'string' }, url: { type: 'string' } } },
      },
    ],
  },

  async testConnection(credentials) {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: sheetsHeaders(credentials.accessToken),
    });
    return res.ok;
  },

  async poll(triggerKey, credentials, lastPollState): Promise<PollResult> {
    const headers = sheetsHeaders(credentials.accessToken);
    const spreadsheetId = (lastPollState.spreadsheet_id as string) || credentials.spreadsheet_id;
    const range = (lastPollState.range as string) || credentials.range || 'Sheet1';
    const lastRowCount = (lastPollState.row_count as number) || 0;

    if (!spreadsheetId) {
      return { newItems: [], nextPollState: lastPollState };
    }

    if (triggerKey === 'new_row') {
      const url = `${BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { newItems: [], nextPollState: lastPollState };
      const data = await res.json() as { values?: string[][] };
      const allValues = data.values || [];
      const currentCount = allValues.length;

      if (currentCount <= lastRowCount) {
        return { newItems: [], nextPollState: { ...lastPollState, row_count: currentCount } };
      }

      const newRows = allValues.slice(lastRowCount);
      const newItems = newRows.map((rowValues, idx) => ({
        row_number: lastRowCount + idx + 1,
        values: rowValues,
      }));

      return {
        newItems,
        nextPollState: { ...lastPollState, row_count: currentCount },
      };
    }

    return { newItems: [], nextPollState: lastPollState };
  },

  async executeAction(actionKey, credentials, params): Promise<ActionResult> {
    const headers = sheetsHeaders(credentials.accessToken);

    if (actionKey === 'append_row') {
      const { spreadsheet_id, range, values } = params as {
        spreadsheet_id: string;
        range: string;
        values: string;
      };
      const rowValues = values.split(',').map(v => v.trim());
      const url = `${BASE}/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [rowValues] }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Google Sheets append_row failed: ${err}` };
      }
      const data = await res.json() as { updates?: { updatedRange: string; updatedRows: number } };
      return {
        success: true,
        data: {
          updated_range: data.updates?.updatedRange || range,
          updated_rows: data.updates?.updatedRows || 1,
        },
      };
    }

    if (actionKey === 'update_row') {
      const { spreadsheet_id, range, values } = params as {
        spreadsheet_id: string;
        range: string;
        values: string;
      };
      const rowValues = values.split(',').map(v => v.trim());
      const url = `${BASE}/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [rowValues] }),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Google Sheets update_row failed: ${err}` };
      }
      const data = await res.json() as { updatedRange: string; updatedCells: number };
      return {
        success: true,
        data: {
          updated_range: data.updatedRange,
          updated_cells: data.updatedCells,
        },
      };
    }

    if (actionKey === 'create_spreadsheet') {
      const { title, sheet_title } = params as { title: string; sheet_title?: string };
      const body: Record<string, unknown> = { properties: { title } };
      if (sheet_title) {
        body.sheets = [{ properties: { title: sheet_title } }];
      }

      const res = await fetch(`${BASE}/spreadsheets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `Google Sheets create_spreadsheet failed: ${err}` };
      }
      const data = await res.json() as { spreadsheetId: string; spreadsheetUrl: string };
      return {
        success: true,
        data: {
          spreadsheet_id: data.spreadsheetId,
          url: data.spreadsheetUrl,
        },
      };
    }

    return { success: false, error: `Unknown action: ${actionKey}` };
  },
};

export default googleSheetsConnector;
