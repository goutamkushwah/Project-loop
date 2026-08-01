"use client";

import { useState } from "react";

import { FeedbackCsvUpload } from "@/components/feedback/feedback-csv-upload";
import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { FeedbackListItem, FeedbackPage } from "@/types/feedback";

type FeedbackWorkspaceProps = {
  initialPage: FeedbackPage;
  canCreate: boolean;
};

const PAGE_SIZE = 10;

export function FeedbackWorkspace({ initialPage, canCreate }: FeedbackWorkspaceProps) {
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPage(nextPage: number) {
    setIsLoading(true);
    setLoadError(null);

    try {


      const response = await fetch(
        `/api/feedback?page=${safePage}&pageSize=${PAGE_SIZE}&sortOrder=desc`,
        {
          method:"GET",
          cache:"no-store",
          headers:{
            "Cache-Control":"no-cache"
          }
        }
      );


      const result =
        await response.json() as
        | ApiSuccessResponse<FeedbackPage>
        | ApiErrorResponse;



      if(!response.ok || !result.success){

        setError(
          result.success
          ? "Unable to load feedback"
          : result.error.message
        );

        return;
      }



      setPage(
        result.data
      );



    }
    catch(error){

      console.error(error);

      setError(
        "Unable to load feedback"
      );

    }
    finally{

      setLoading(false);

    }

  }





  async function handleCreated(
    feedback: FeedbackListItem
  ){

    setNotice(
      "Feedback saved successfully"
    );


    await loadPage(1);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
          Single entry
        </p>
        <h2 className="mt-2 text-2xl font-black text-loop-900">Add customer feedback</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Record one customer comment with its source channel. Content and channel are required.
        </p>

        <div className="mt-7">
          {canCreate ? (
            <FeedbackEntryForm onCreated={handleCreated} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-900">Read-only workspace access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Viewers can read workspace feedback but cannot create or modify records. The API
                enforces this restriction with HTTP 403.
              </p>
            </div>
          )}
        </div>
      </section>



</div>









{/* RIGHT COLUMN */}

<section
className="
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-sm
min-w-0
"
>



<div
className="
mb-6
flex
items-center
justify-between
"
>



<div>

<p
className="
text-sm
font-bold
uppercase
tracking-wide
text-loop-600
"
>
Workspace record
</p>


<h2
className="
text-2xl
font-black
text-loop-900
"
>
Recent feedback
</h2>


</div>




<span
className="
rounded-full
bg-violet-50
px-3
py-1
text-xs
font-bold
text-violet-800
"
>
AI classification pending
</span>



</div>







{
notice &&

<div
className="
mb-4
rounded-lg
bg-green-50
p-3
text-green-700
"
>
{notice}
</div>

}






<FeedbackList

page={page}

isLoading={loading}

error={error}

onPageChange={(next)=>
loadPage(next)
}

onRetry={()=>
loadPage(
page.pagination.page
)
}

/>




</section>





</div>


);


}