"use client";

import { useState } from "react";

import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import CsvUploadForm from "@/components/feedback/CsvUploadForm";

import type { FeedbackPage, FeedbackListItem } from "@/types/feedback";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types/api";


type Props = {
  initialPage: FeedbackPage;
  canCreate: boolean;
};


const PAGE_SIZE = 10;


export function FeedbackWorkspace({
  initialPage,
  canCreate,
}: Props) {


  const [page, setPage] = useState<FeedbackPage>(
    initialPage
  );


  const [loading, setLoading] = useState(false);


  const [error, setError] =
    useState<string | null>(null);


  const [notice, setNotice] =
    useState<string | null>(null);



  async function loadPage(
    nextPage:number = 1
  ) {

    setLoading(true);
    setError(null);


    try {


      const response = await fetch(
        `/api/feedback?page=${nextPage}&pageSize=${PAGE_SIZE}&sortOrder=desc`,
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







  async function handleCSVUploaded(){

    setNotice(
      "CSV uploaded successfully"
    );


    // wait a little for database transaction
    setTimeout(()=>{

      loadPage(1);

    },500);


  }





return (

<div
className="
grid
gap-5
lg:grid-cols-[380px_minmax(0,1fr)]
"
>



{/* LEFT COLUMN */}

<div
className="
space-y-5
"
>



{/* SINGLE ENTRY */}

<section
className="
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-sm
"
>


<h2
className="
text-xl
font-black
text-loop-900
"
>
Single Feedback Entry
</h2>


<p className="mt-2 text-sm text-slate-600">
Add one customer feedback record.
</p>



<div className="mt-5">


{
canCreate &&

<FeedbackEntryForm
onCreated={handleCreated}
/>

}


</div>


</section>







{/* CSV UPLOAD */}

<section
className="
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-sm
"
>


<h2
className="
text-xl
font-black
text-loop-900
"
>
Bulk CSV Upload
</h2>


<p className="mt-2 text-sm text-slate-600">
Upload multiple feedback records.
</p>



<div className="mt-5">


{
canCreate &&

<CsvUploadForm
onUploaded={handleCSVUploaded}
/>

}



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