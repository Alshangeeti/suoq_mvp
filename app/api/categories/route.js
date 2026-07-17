export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCategoryTree } from "../../../lib/categories";

export async function GET() {
  try {
    const tree = await getCategoryTree();
    return NextResponse.json({ tree });
  } catch {
    return NextResponse.json({ tree: [] });
  }
}
