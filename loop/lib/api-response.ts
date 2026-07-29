import { NextResponse } from "next/server";

import type {
  ApiErrorCode,
  ApiErrorResponse,
  ApiFieldErrors,
  ApiSuccessResponse,
} from "@/types/api";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function apiSuccess<TData>(
  data: TData,
  status = 200,
): NextResponse<ApiSuccessResponse<TData>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  fieldErrors?: ApiFieldErrors,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}