import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleSpreadsheetRow } from 'google-spreadsheet';
import dotenv from 'dotenv';

dotenv.config();

interface Book {
  title: string;
  author: string;
  googleBooksUrl: string;
  month: string;
}

interface YearlyBooks {
  year: number;
  books: Book[];
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

async function getAllBooks(): Promise<YearlyBooks[]> {
  try {
    const auth = authenticate();
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    await doc.loadInfo();

    // Get all sheets and convert their titles (the year) to numbers
    const yearlyData = await Promise.all(
      Object.values(doc.sheetsByTitle)
        .filter(sheet => !isNaN(Number(sheet.title))) // Only process sheets with numeric names
        .map(async sheet => {
          const rows = await sheet.getRows();
          // console.log(rows);
          return {
            year: parseInt(sheet.title),
            books: rows.map((row: GoogleSpreadsheetRow) => ({
              title: row.get('Title'),
              author: row.get('Author'),
              googleBooksUrl: row.get('Google Link'),
              month: row.get('Date Published'),
            }))
            .filter(book => book.title?.trim()) // Filter out any rows with no title - means we didn't read a book that month
          };
        })
    );

    // Sort by year in descending order (most recent first)
    return yearlyData.sort((a, b) => b.year - a.year);
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export { getAllBooks };
export type { Book, YearlyBooks }; 