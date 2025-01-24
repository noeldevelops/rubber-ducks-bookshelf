import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleSpreadsheetRow } from 'google-spreadsheet';
import dotenv from 'dotenv';

dotenv.config();

interface Book {
  googleBooksUrl: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  categories: string[];
  pubDate: string;
}

const SPREADSHEET_ID = '1C2TuZrF9KFcqwZFIEHbCFDLL1k_T6DkwOGk7yw6gRN4';

function authenticate() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error(`
      The GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables are missing.
    `);
  }
  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function getAllBooks(): Promise<Book[]> {
  try {
    const auth = authenticate();
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['recs'];
    if (!sheet) {
      throw new Error('Sheet "recs" not found');
    }

    const rows = await sheet.getRows();
    return rows
      .map((row: GoogleSpreadsheetRow) => ({
        title: row.get('Title'),
        author: row.get('Full Author'),
        googleBooksUrl: row.get('Google Link'),
        subtitle: row.get('Subtitle') || '',
        description: row.get('Description') || '',
        categories: (row.get('Categories') || '').split(',').map((c: string) => c.trim()).filter(Boolean),
        pubDate: row.get('Date Published') || '',
      }))
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export { getAllBooks };
export type { Book }; 