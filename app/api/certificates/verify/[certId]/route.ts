import { NextRequest, NextResponse } from "next/server";
import { fetchCertificateByCertId } from "@/lib/database/certificateService";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ certId: string }> }
) {
  try {
    const params = await props.params;
    const { certId } = params;
    const cert = await fetchCertificateByCertId(certId);

    if (!cert) {
      return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      valid: cert.is_valid,
      studentName: cert.student_name,
      module: cert.module,
      completionDate: cert.issued_at,
      certId: cert.cert_id,
      status: cert.is_valid ? "VERIFIED" : "REVOKED"
    });
  } catch (error: any) {
    console.error("[ERROR] API certificates/verify failed:", error);
    return NextResponse.json({ error: "Failed to verify certificate" }, { status: 500 });
  }
}
