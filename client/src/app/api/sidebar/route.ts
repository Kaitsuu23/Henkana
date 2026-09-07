import { ok, handleError } from '@/lib/api-helpers';
const { scrapeSidebar } = require('@/lib/scrapers/sidebarParser');

export async function GET() {
  try {
    const data = await scrapeSidebar();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
