import { getSupabaseClient } from "@/lib/supabase/client";

export interface CertificateExamQuestion {
  id: string;
  module: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
}

export interface CertificateResult {
  id?: string;
  clerk_user_id: string;
  module: string;
  score: number;
  total_questions: number;
  passed: boolean;
  attempted_at?: string;
}

export interface Certificate {
  id?: string;
  clerk_user_id: string;
  module: string;
  student_name: string;
  issued_at?: string;
  cert_id: string;
}

export interface CertificateVerification {
  cert_id: string;
  clerk_user_id: string;
  module: string;
  student_name: string;
  issued_at: string;
  is_valid: boolean;
}

export async function fetchCertificateExams(
  clerkUserId: string,
  moduleName: string
): Promise<CertificateExamQuestion[]> {
  const client = getSupabaseClient(clerkUserId);
  const { data, error } = await client
    .from("certificate_exams")
    .select("*")
    .eq("module", moduleName);

  if (error) {
    console.error(`[ERROR] fetchCertificateExams failed: Table: certificate_exams | Module: ${moduleName} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    module: row.module,
    question: row.question,
    options: typeof row.options === "string" ? JSON.parse(row.options) : row.options,
    correct_answer: row.correct_answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
  }));
}

export async function fetchCertificates(clerkUserId: string): Promise<Certificate[]> {
  const client = getSupabaseClient(clerkUserId);
  const { data, error } = await client
    .from("certificates")
    .select("*")
    .eq("clerk_user_id", clerkUserId);

  if (error) {
    console.error(`[ERROR] fetchCertificates failed: Table: certificates | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data || [];
}

export async function fetchCertificateByCertId(certId: string): Promise<CertificateVerification | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("certificate_verification")
    .select("*")
    .eq("cert_id", certId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error(`[ERROR] fetchCertificateByCertId failed: Table: certificate_verification | ID: ${certId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data;
}

export async function saveCertificateResult(
  clerkUserId: string,
  result: Omit<CertificateResult, "clerk_user_id">
): Promise<CertificateResult> {
  const client = getSupabaseClient(clerkUserId);
  const payload = {
    clerk_user_id: clerkUserId,
    module: result.module,
    score: result.score,
    total_questions: result.total_questions,
    passed: result.passed,
  };

  const { data, error } = await client
    .from("certificate_results")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(`[ERROR] saveCertificateResult failed: Table: certificate_results | User: ${clerkUserId} | Code: ${error.code} | Message: ${error.message}`);
    throw error;
  }
  return data;
}

export async function issueCertificate(
  clerkUserId: string,
  certificate: Omit<Certificate, "clerk_user_id">
): Promise<Certificate> {
  const client = getSupabaseClient(clerkUserId);
  const payload = {
    clerk_user_id: clerkUserId,
    module: certificate.module,
    student_name: certificate.student_name,
    cert_id: certificate.cert_id,
  };

  // 1. Insert into certificates table
  const { data: certData, error: certError } = await client
    .from("certificates")
    .upsert(payload, { onConflict: "clerk_user_id,module" })
    .select()
    .single();

  if (certError) {
    console.error(`[ERROR] issueCertificate failed (certificates): Table: certificates | User: ${clerkUserId} | Code: ${certError.code} | Message: ${certError.message}`);
    throw certError;
  }

  // 2. Insert into certificate_verification table
  const { error: verifyError } = await client
    .from("certificate_verification")
    .upsert({
      cert_id: certificate.cert_id,
      clerk_user_id: clerkUserId,
      module: certificate.module,
      student_name: certificate.student_name,
      issued_at: certData.issued_at || new Date().toISOString(),
      is_valid: true,
    }, { onConflict: "cert_id" });

  if (verifyError) {
    console.error(`[ERROR] issueCertificate failed (verification): Table: certificate_verification | User: ${clerkUserId} | Code: ${verifyError.code} | Message: ${verifyError.message}`);
    throw verifyError;
  }

  return certData;
}
