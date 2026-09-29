import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

// 🟢 [조회] 구글 시트 데이터 읽어오기 (GET)
export async function GET() {
  try {
    const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    if (!rawJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경 변수가 설정되지 않았습니다.');

    let credentialsJson;
    try {
      credentialsJson = JSON.parse(rawJson);
    } catch {
      credentialsJson = JSON.parse(rawJson.replace(/\n/g, '\\n'));
    }

    if (credentialsJson.private_key) {
      credentialsJson.private_key = credentialsJson.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentialsJson,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 🌟 변경 1: 순번(A열)이 추가되면서 연락처가 L열 -> M열로 이동했으므로 조회 범위를 A:M으로 확장
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'시트1'!A:M", 
    });

    return NextResponse.json({ success: true, data: response.data.values || [] });
  } catch (error: any) {
    console.error('구글 시트 조회 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🔵 [저장] 구글 시트에 데이터 저장하기 (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userName, mode, flightNum, date, route, acType,
      regNo, spot, paxStatus, dlaSummary, phone, reportText,
    } = body;

    const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    if (!rawJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 환경 변수가 설정되지 않았습니다.');

    let credentialsJson;
    try {
      credentialsJson = JSON.parse(rawJson);
    } catch {
      credentialsJson = JSON.parse(rawJson.replace(/\n/g, '\\n'));
    }

    if (credentialsJson.private_key) {
      credentialsJson.private_key = credentialsJson.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentialsJson,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const singleLineReport = (reportText || '').replace(/\n/g, ' / ');

    // 🌟 변경 2: A열부터 N열까지 입력하도록 범위를 'A:N'으로 변경
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'시트1'!A:N", 
      valueInputOption: 'USER_ENTERED', // 💡 이 옵션 덕분에 "=ROW()-1"이 문자열이 아닌 엑셀 수식으로 정상 작동합니다.
      requestBody: {
        values: [
          [
            // 🌟 변경 3: 배열의 첫 번째 값(A열)으로 수식 강제 삽입
            "=ROW()-1", 
            now, 
            userName || '미입력', 
            mode || 'FDR', 
            flightNum || '', 
            date || '', 
            route || '',
            acType || '', 
            regNo || '', 
            spot || '', 
            paxStatus || '', 
            dlaSummary || '', 
            phone || '', 
            singleLineReport,
          ],
        ],
      },
    });

    return NextResponse.json({ success: true, message: '시트 저장 완료' });
  } catch (error: any) {
    console.error('구글 시트 저장 에러:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}